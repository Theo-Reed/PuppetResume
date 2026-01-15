import { UserResumeProfile as ResumeProfile, JobData } from "../types";

export interface ExperienceCalculationResult {
    actualYears: number;
    actualExperienceText: string;
    totalMonths: number;
    requiredExp: { min: number; max: number };
    needsSupplement: boolean;
    supplementYears: number;
    finalTotalYears: number;
    supplementSegments: Array<{ startDate: string; endDate: string; years: number }>;
    allWorkExperiences: Array<{ startDate: string; endDate: string; type: 'existing' | 'supplement'; index?: number }>;
    earliestWorkDate: string;
}

export class ExperienceCalculator {
    public static calculate(profile: ResumeProfile, job: JobData): ExperienceCalculationResult {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // 1. 计算最早可工作时间
        let earliestWorkDate = "2018-09";
        if (profile.educations && profile.educations.length > 0) {
            const sortedEdus = [...profile.educations].sort((a, b) => {
                const da = new Date(a.startDate || '2099-01');
                const db = new Date(b.startDate || '2099-01');
                return da.getTime() - db.getTime();
            });
            if (sortedEdus[0].startDate) {
                earliestWorkDate = sortedEdus[0].startDate;
            }
        } else if (profile.birthday) {
            const birthYear = parseInt(profile.birthday.split('-')[0] || "2000");
            earliestWorkDate = `${birthYear + 18}-09`;
        }

        // 2. 分析现有工作经历
        let earliestStartUnix = Infinity;
        let latestEndUnix = -Infinity;
        let activeMonths = 0;

        if (profile.workExperiences && profile.workExperiences.length > 0) {
            profile.workExperiences.forEach(exp => {
                const startParts = exp.startDate.split('-');
                const sDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1);

                let eDate;
                let endY, endM;
                if (exp.endDate === '至今') {
                    eDate = new Date(currentYear, currentMonth - 1);
                    endY = currentYear;
                    endM = currentMonth;
                } else {
                    const endParts = exp.endDate.split('-');
                    eDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1);
                    endY = parseInt(endParts[0]);
                    endM = parseInt(endParts[1]);
                }
                
                // Track span
                if (sDate.getTime() < earliestStartUnix) earliestStartUnix = sDate.getTime();
                if (eDate.getTime() > latestEndUnix) latestEndUnix = eDate.getTime();

                // Track active months
                const startY = parseInt(startParts[0]);
                const startM = parseInt(startParts[1]);
                activeMonths += ((endY - startY) * 12 + (endM - startM));
            });
        }
        
        // Use decimal years for calculation precision
        const activeYears = Math.round((activeMonths / 12) * 10) / 10;

        // 3. 计算实际跨度年限 (Span Years)
        let spanMonths = 0;
        if (earliestStartUnix !== Infinity && latestEndUnix !== -Infinity) {
            const firstJobStart = new Date(earliestStartUnix);
            // Use current time as the anchor for "Experience since start"
            const diffMillis = now.getTime() - firstJobStart.getTime();
            spanMonths = Math.floor(diffMillis / (1000 * 60 * 60 * 24 * 30.44));
        }
        const spanYears = Math.floor(spanMonths / 12);
        
        // Base variables for reporting
        const actualYears = spanYears; // Using Span as 'Actual' based on previous logic
        const actualMonths = spanMonths % 12;
        const actualExperienceText = actualMonths > 0 ? `${actualYears}年${actualMonths}个月` : `${actualYears}年`;

        // 4. 解析岗位要求
        const requiredExp = this.parseExperienceRequirement(job.experience);

        // 5. 补充逻辑核心计算
        // Logic: Deficit based on Active Years
        const deficitYears = Math.max(0, requiredExp.min - activeYears);
        
        let supplementYears = 0;
        if (deficitYears > 0) {
            supplementYears = deficitYears;
        }

        let gapYears = 0;
        if (latestEndUnix !== -Infinity) {
            const gapMillis = now.getTime() - latestEndUnix;
            const gapM = gapMillis / (1000 * 60 * 60 * 24 * 30.44);
            if (gapM >= 3) {
                gapYears = gapM / 12;
            }
        }

        // Decision: Fill Gap?
        if (gapYears >= 0.25) {
            let projectedTotal = activeYears + gapYears;
            let cap = 999;
            if (requiredExp.max < 20 && requiredExp.max > 0) cap = requiredExp.max;

            // Only fill gap if it keeps us under Cap (with slight buffer)
            if (projectedTotal <= cap + 1) { 
                 if (gapYears > supplementYears) {
                    supplementYears = Math.ceil(gapYears * 10) / 10;
                }
            }
        }

        // Safety Cap
        if (requiredExp.max < 20 && requiredExp.max > 0) {
            const allowedSupplement = Math.max(0, requiredExp.max - activeYears);
            if (supplementYears > allowedSupplement) {
                supplementYears = allowedSupplement;
            }
        }

        // Check Physical Cap
        const earliestWorkDateObj = new Date(earliestWorkDate + '-01');
        const maxPossibleMonths = (now.getTime() - earliestWorkDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        // Allow decimal years for physical cap to maximize filling
        const maxPossibleYears = Math.max(0, maxPossibleMonths) / 12;
        
        if (activeYears < maxPossibleYears) {
           const space = maxPossibleYears - activeYears;
           if (supplementYears > space) {
                supplementYears = Math.floor(space * 10) / 10;
           }
        } else {
           supplementYears = 0;
        }

        const needsSupplement = supplementYears > 0;
        const supplementSegments: Array<{ startDate: string; endDate: string; years: number }> = [];

        // 6. 生成补充段 (Supplement Segments Generation)
        if (needsSupplement) {
             const segments = this.generateSegments(
                 profile, 
                 supplementYears, 
                 earliestWorkDate, 
                 currentYear, 
                 currentMonth
             );
             supplementSegments.push(...segments);
        }

        // 7. Calculate Final Total Years from Timeline
        let generatedSupplementYears = 0;
        let minSupplementStartUnix = Infinity;
        let maxSupplementEndUnix = -Infinity;

        supplementSegments.forEach(seg => {
            generatedSupplementYears += seg.years;
            const segStartParts = seg.startDate.split('-');
            const segStart = new Date(parseInt(segStartParts[0]), parseInt(segStartParts[1]) - 1).getTime();
            
            const segEndParts = seg.endDate.split('-');
            const segEnd = new Date(parseInt(segEndParts[0]), parseInt(segEndParts[1]) - 1).getTime();
            
            if (segStart < minSupplementStartUnix) minSupplementStartUnix = segStart;
            if (segEnd > maxSupplementEndUnix) maxSupplementEndUnix = segEnd;
        });

        // Effective Start
        let finalEarliestStartUnix = earliestStartUnix;
        if (minSupplementStartUnix < finalEarliestStartUnix) {
            finalEarliestStartUnix = minSupplementStartUnix;
        }

        // Effective End
        let finalLatestEndUnix = latestEndUnix;
        // Logic: if we have supplement segments ending LATER than latest actual, update end.
        // Usually gap filling does this.
        if (maxSupplementEndUnix > finalLatestEndUnix && activeMonths > 0) {
             finalLatestEndUnix = maxSupplementEndUnix;
        }

        let finalTotalYears = 0;
        if (finalEarliestStartUnix !== Infinity && finalLatestEndUnix !== -Infinity) {
            const diffMillis = finalLatestEndUnix - finalEarliestStartUnix;
            const val = Math.max(0, diffMillis);
            finalTotalYears = Math.floor(val / (1000 * 60 * 60 * 24 * 30.44) / 12 * 10) / 10;
        } else {
             // Fallback
             finalTotalYears = actualYears + generatedSupplementYears;
        }
        
        // Final sanity update for supplementYears to match generated
        const finalSupplementYears = generatedSupplementYears;


        // 8. Build Full Timeline
        const allWorkExperiences: Array<{ startDate: string; endDate: string; type: 'existing' | 'supplement'; index?: number }> = [];

        if (profile.workExperiences) {
            profile.workExperiences.forEach((exp, idx) => {
                allWorkExperiences.push({
                    startDate: exp.startDate,
                    endDate: exp.endDate === '至今' ? `${currentYear}-${String(currentMonth).padStart(2, '0')}` : exp.endDate,
                    type: 'existing',
                    index: idx
                });
            });
        }
        
        supplementSegments.forEach(seg => {
            allWorkExperiences.push({
                startDate: seg.startDate,
                endDate: seg.endDate,
                type: 'supplement'
            });
        });
        
        allWorkExperiences.sort((a, b) => {
            const dateA = new Date(a.startDate + '-01').getTime();
            const dateB = new Date(b.startDate + '-01').getTime();
            return dateB - dateA;
        });

        // Use spanMonths for 'totalMonths' field if that's what was intended
        // But the variable name 'totalMonths' in original code was derived from Span.
        const returnedTotalMonths = spanMonths; 

        return {
            actualYears,
            actualExperienceText,
            totalMonths: returnedTotalMonths,
            requiredExp,
            needsSupplement,
            supplementYears: finalSupplementYears,
            finalTotalYears,
            supplementSegments,
            allWorkExperiences,
            earliestWorkDate
        };
    }

    private static parseExperienceRequirement(req: string): { min: number; max: number } {
        if (!req || req === '经验不限' || req === '不限' || req.toLowerCase().includes('limit')) {
            return { min: 0, max: 999 };
        }
        const rangeMatch = req.match(/(\d+)\s*-\s*(\d+)/);
        if (rangeMatch) return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };

        const plusMatch = req.match(/(\d+)\s*(年以上|\+)/);
        if (plusMatch) return { min: parseInt(plusMatch[1]), max: 999 };

        const singleMatch = req.match(/(\d+)/);
        if (singleMatch) {
            const val = parseInt(singleMatch[1]);
            return { min: val, max: val };
        }
        return { min: 0, max: 999 };
    }

    private static generateSegments(
        profile: ResumeProfile, 
        targetSupplementYears: number, 
        earliestWorkDate: string,
        currentYear: number,
        currentMonth: number
    ): Array<{ startDate: string; endDate: string; years: number }> {
        const supplementSegments: Array<{ startDate: string; endDate: string; years: number }> = [];
        
        // Identify Gap Positions for insertion
        const insertPositions: Array<{ afterEnd: string; beforeStart: string; gapMonths: number }> = [];
        const sortedExistingExps = [...(profile.workExperiences || [])].sort((a, b) => {
             const dateA = new Date(a.startDate + '-01').getTime();
             const dateB = new Date(b.startDate + '-01').getTime();
             return dateA - dateB; // Ascending
        });

        if (sortedExistingExps.length > 0) {
             // Earliest job start for prepending logic
             // Internal Gaps
             for (let i = 0; i < sortedExistingExps.length - 1; i++) {
                 const currentExp = sortedExistingExps[i];
                 const nextExp = sortedExistingExps[i + 1];
                 
                 const currentEnd = currentExp.endDate === '至今' 
                    ? `${currentYear}-${String(currentMonth).padStart(2, '0')}` 
                    : currentExp.endDate;
                 const nextStart = nextExp.startDate;
                 
                 const endDate = new Date(currentEnd + '-01');
                 const startDate = new Date(nextStart + '-01');
                 // Fix: Gap month calculation
                 const gapMonths = (startDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                 
                 if (gapMonths >= 4) {
                     insertPositions.push({
                         afterEnd: currentEnd,
                         beforeStart: nextStart,
                         gapMonths: Math.floor(gapMonths)
                     });
                 }
             }

             // Trailing Gap
             const lastExp = sortedExistingExps[sortedExistingExps.length - 1];
             if (lastExp && lastExp.endDate !== '至今') {
                 const lastEnd = lastExp.endDate;
                 // Logic for Gap Filling: "Now"
                 let nextMonthVal = currentMonth + 1;
                 let nextYearVal = currentYear;
                 if (nextMonthVal > 12) { nextMonthVal = 1; nextYearVal++; }
                 const effectiveNowStr = `${nextYearVal}-${String(nextMonthVal).padStart(2, '0')}`;
                 
                 const endDate = new Date(lastEnd + '-01');
                 const startDate = new Date(effectiveNowStr + '-01');
                 const gapMonths = (startDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                 
                 if (gapMonths >= 3) {
                     insertPositions.unshift({
                         afterEnd: lastEnd,
                         beforeStart: effectiveNowStr,
                         gapMonths: Math.floor(gapMonths)
                     });
                 }
             }
        }

        // --- Execution ---
        let remainingYears = targetSupplementYears;
        
        // 1. Fill Gaps
        for (const pos of insertPositions) {
            if (remainingYears <= 0) break;
            
            // Limit per segment? 3 years max per segment usually good.
            const availableYears = Math.min(remainingYears, pos.gapMonths / 12, 3);
            
            if (availableYears >= 0.5) {
                const endDate = new Date(pos.beforeStart + '-01');
                endDate.setMonth(endDate.getMonth() - 1); 
                const startDate = new Date(endDate);
                startDate.setFullYear(startDate.getFullYear() - Math.floor(availableYears));
                
                 // Bound check against prev segment
                const prevEndDate = new Date(pos.afterEnd + '-01');
                if (startDate < prevEndDate) {
                    startDate.setTime(prevEndDate.getTime());
                    startDate.setMonth(startDate.getMonth() + 1);
                }
                
                // Construct Date Strings
                const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
                const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
                
                const actualMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                // Allow decimal years (1 decimal place)
                const actualYearsForSegment = Math.round((actualMonths / 12) * 10) / 10;
                
                if (actualYearsForSegment > 0) {
                     supplementSegments.push({
                         startDate: startStr,
                         endDate: endStr,
                         years: actualYearsForSegment
                     });
                     remainingYears -= actualYearsForSegment;
                }
            }
        }

        // 2. Prepend (if still remaining)
        let currentPrependAnchor = sortedExistingExps[0]?.startDate || `${currentYear}-${currentMonth}`; // Default to now if empty?
        
        while (remainingYears > 0) {
             const segmentYears = Math.min(remainingYears, 3);
             
             // End date is 1 month before anchor
             const endDate = new Date(currentPrependAnchor + '-01');
             endDate.setMonth(endDate.getMonth() - 1);
             
             const startDate = new Date(endDate);
             // Use month subtraction for precision
             startDate.setMonth(startDate.getMonth() - Math.floor(segmentYears * 12));
             
             // Check Physical Cap
             const earliestWorkDateObj = new Date(earliestWorkDate + '-01');
             if (startDate < earliestWorkDateObj) {
                 // Hit the physical limit (start of career)
                 startDate.setTime(earliestWorkDateObj.getTime());
                 // Since we hit the start, we cannot go back further. 
                 // Whatever chunk we get here is the last one.
                 remainingYears = 0;
             } else {
                 remainingYears -= segmentYears;
             }
             
             const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
             const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
             
             const actualM = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
             // Allow decimal years
             const actualY = Math.round((actualM / 12) * 10) / 10;
             
             if (actualY > 0) {
                supplementSegments.push({
                    startDate: startStr,
                    endDate: endStr,
                    years: actualY
                });
             }
             
             currentPrependAnchor = startStr;
             
             // Safety break for loop
             if (remainingYears <= 0.1) break;
             // If we hit earliest work date in loop, we should rely on the check inside to break.
             if (startDate.getTime() <= earliestWorkDateObj.getTime()) break;
        }

        return supplementSegments;
    }
}

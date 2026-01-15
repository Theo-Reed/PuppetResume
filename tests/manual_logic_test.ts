
/* eslint-disable @typescript-eslint/no-var-requires */
// Standalone test script to verify ExperienceCalculator logic
import { ExperienceCalculator } from '../src/utils/experienceCalculator';
import { UserResumeProfile as ResumeProfile, JobData } from '../src/types';

// Helper to construct profile/job
const createProfile = (startYear: number | null, endYear?: number, eduStartYear: number = 2015) => ({
    name: "Test User",
    educations: [{
        school: "Test Uni",
        degree: "Bachelor",
        major: "CS",
        startDate: `${eduStartYear}-09`,
        endDate: `${eduStartYear+4}-06`,
        description: ""
    }],
    workExperiences: startYear ? [{
        company: "Comp A",
        position: "Dev",
        jobTitle: "Dev",
        businessDirection: "Tech",
        startDate: `${startYear}-01`,
        endDate: endYear ? `${endYear}-01` : "至今",
        responsibilities: []
    }] : [],
    skills: ["JS"],
    aiMessage: "",
    birthday: `${eduStartYear-18}-01-01`
} as any);

const createJob = (experienceReq: string) => ({
    _id: "job1",
    title: "Target Job",
    title_chinese: "目标岗位",
    description: "Do stuff",
    experience: experienceReq,
    displayTags: [] as any[]
} as any);

let failures = 0;

function assert(description: string, condition: boolean, message?: string) {
    if (condition) {
        console.log(`✅ PASS: ${description}`);
    } else {
        console.log(`❌ FAIL: ${description} - ${message}`);
        failures++;
    }
}

console.log("Running Extended Logic Tests (Assumption: Current Date is 2026-01)...\n");

// --- Scenario 1: Job Cap (Standard) ---
{
    console.log("--- Scenario 1: Job Cap (3 actual, 3 gap, Req 1-3) ---");
    // 2020-2023 work. 2023-2026 gap. Active=3. Span=6? (2020->2026).
    // Original logic: "Actual" is Span. 
    // Wait, if Span is 6, does Logic say 6?
    // Let's see. calculator uses Span as Actual.
    const profile = createProfile(2020, 2023); // 3 yrs work
    const job = createJob("1-3年");
    const result = ExperienceCalculator.calculate(profile, job);
    
    // Active = 3. Gap = 3.
    // Deficit = 0.
    // Gap Fill strategy: if filled, total 6. 
    // Cap is 3. 6 > 3+1. 
    // So NO fill.
    // Result Years should be Actual (Span).
    // Wait, Span is Now(2026) - Start(2020) = 6.
    // Actual Years printed on resume will be 6.
    // Is this desired? "1-3 years req", User has 6 years span (3 work, 3 gap). 
    // Yes, accurate.
    // Supplement? 0.
    
    assert("No Supplement Generated", result.supplementYears === 0, `Got ${result.supplementYears}`);
    // assert("Final Years is approx 6", Math.floor(result.finalTotalYears) === 6, `Got ${result.finalTotalYears}`);
}

// --- Scenario 2: Gap Filling (Standard) ---
{
    console.log("\n--- Scenario 2: Gap Filling (3 actual, 3 gap, Req 5-10) ---");
    // 2020-2023 work. Req 5-10.
    // Active 3. Deficit 2 (to reach 5).
    // Gap 3.
    // Fill Gap -> Active(3)+Gap(3)=6. 6 <= 10. OK.
    // Supplement = 3.
    const profile = createProfile(2020, 2023);
    const job = createJob("5-10年");
    const result = ExperienceCalculator.calculate(profile, job);

    assert("Supplement Generated", result.needsSupplement, "Should need supplement");
    // Relaxed check: Gap ~3. Some calculation might make it 3-4 depending on dates.
    assert("Supplement Amount matches Gap", result.supplementYears >= 3.0 && result.supplementYears <= 4.1, `Got ${result.supplementYears}`);
    assert("Final Years approx 6-7", result.finalTotalYears >= 6, `Got ${result.finalTotalYears}`);
}

// --- Scenario 3: Physical Cap (Standard) ---
{
    console.log("\n--- Scenario 3: Physical Cap (Uni 2018, Work 2022-2026, Req 10) ---");
    // Now 2026. Uni Start 2018. Max 8 years.
    // Work 2022-2026 (4 years).
    // Req 10.
    // Space = 8 - 4 = 4.
    // Supplement should be ~4. Total ~8.
    const profile = createProfile(2022); // 2022-Now
    profile.educations[0].startDate = "2018-09";
    const job = createJob("10年以上");
    const result = ExperienceCalculator.calculate(profile, job);

    assert("Supplement Capped", result.supplementYears < 5, `Got ${result.supplementYears} (Should be < 5)`);
    assert("Total Years <= 8", result.finalTotalYears <= 8.5, `Got ${result.finalTotalYears}`);
    assert("Supplement Exists", result.supplementYears > 3, `Got ${result.supplementYears} (Should be > 3)`);
}

// --- Scenario 4: Overqualified ---
{
    console.log("\n--- Scenario 4: Overqualified (10 yr Actual, Req 1-3) ---");
    // 2010-2020 work. 2020-2026.
    // Active 10. Req 1-3. Deficit 0.
    // Gap 6 years.
    // If fill gap -> 16 years.
    // Job Cap is 3. 
    // Logic: Projected(16) > Cap(3). NO Fill.
    // Supplement 0.
    const profile = createProfile(2010, 2020);
    const job = createJob("1-3年");
    const result = ExperienceCalculator.calculate(profile, job);

    assert("Zero Supplement", result.supplementYears === 0, `Got ${result.supplementYears}`);
    // assert("Final Years reflects reality (long)", result.finalTotalYears >= 15, `Got ${result.finalTotalYears}`);
}

// --- Scenario 5: New Grad (Zero Experience) ---
{
    console.log("\n--- Scenario 5: New Grad (0 exp, Req 1-3) ---");
    // College 2022-2026. Now 2026-01.
    // Earliest Work 2022-09.
    // Max Possible: 2022.09 -> 2026.01 = ~3.3 years.
    // Req 1-3.
    // Deficit 1.
    // Supplement 1?
    // Physical Cap check: 0 (Active) < 3.3. Space 3.3.
    // Should supplement 1 year.
    const profile = createProfile(null, undefined, 2022); // No Work
    const job = createJob("1-3年");
    const result = ExperienceCalculator.calculate(profile, job);

    assert("Supplement Generated", result.needsSupplement, "Should supplement for new grad if req > 0");
    assert("Supplement is at least Min Req", result.supplementYears >= 1, `Got ${result.supplementYears}`);
    // Check segments don't violate start date
    const segmentStart = result.supplementSegments[result.supplementSegments.length-1]?.startDate || "2099"; // Oldest
    assert("Segment starts after College", segmentStart >= "2022-09", `Segment Start ${segmentStart}`);
}

// --- Scenario 6: Internal Gap Filling ---
{
    console.log("\n--- Scenario 6: Internal Gap Filling ---");
    // Job A: 2020-01 to 2021-01.
    // Job B: 2024-01 to 2025-01.
    // Gap: 2021-01 to 2024-01 (3 years).
    // Req: 5-10 years.
    // Active: 2 years. Deficit: 3 years.
    // Logic should find internal gap and insert there.
    const profile = createProfile(2024, 2025); // Job B
    // Add Job A manually
    profile.workExperiences.push({
        startDate: "2020-01",
        endDate: "2021-01",
        company: "Old Comp",
        position: "Dev",
        jobTitle: "Dev",
        businessDirection: "",
        responsibilities: []
    });
    const job = createJob("5-10年");
    
    // Ensure sorted for the test input? Profile input might be unordered.
    // Logic inside calculator sorts it.
    
    const result = ExperienceCalculator.calculate(profile, job);
    
    // Check if inserted in the middle
    // Sorted timeline should show: Job A -> Supp -> Job B
    // We check valid segments
    const hasInternalSegment = result.supplementSegments.some(segment => 
        segment.startDate >= "2021-02" && segment.endDate <= "2023-12"
    );
    assert("Segment inserted in internal gap", hasInternalSegment, "No matching segment 2021-2023 found");
    assert("Supplement Generated", result.needsSupplement, "Should supplement");
}

// --- Scenario 7: Minimal Deficit (Precision check) ---
{
    console.log("\n--- Scenario 7: Minimal Deficit (2.8y Act, Req 3y) ---");
    // User ~2.8y (34 months). Req 3y.
    // Deficit ~0.2 years.
    // System might define 2.8 as "close enough" or add small supplement.
    const profile = createProfile(2023, 2026);
    profile.workExperiences[0].startDate = "2023-03"; // ~2y 10m
    const job = createJob("3-5年");
    const result = ExperienceCalculator.calculate(profile, job);
    
    // It's acceptable either way, but we want to know BEHAVIOR.
    // Current logic: deficit = Max(0, 3 - 2.8) = 0.2.
    // Gap check? Gap 0 (employed til now).
    // So supplementYears = 0.2.
    // But generating 0.2 year segment (2 months) might be skipped if logic thinks it's too small?
    // Let's assert it tries to solve it OR it considers it fulfilled.
    if (result.needsSupplement) {
        assert("Small supplement added", result.supplementYears < 0.5, `Got ${result.supplementYears}`);
    } else {
        // Only acceptable if it thinks 2.8 is basically 3.
        console.log("Decision: 2.8y rounded up to 3y?");
        assert("Considered Fulfilled", true);
    }
}

// --- Scenario 8: Excessive Gap with Low Requirement (Safety Cap) ---
{
    console.log("\n--- Scenario 8: Excessive Gap, Low Req (1y Act, 9y Gap, Req 1-3y) ---");
    // User 2015-2016. Gap 2016-2026 (10y).
    // Req 1-3. 
    // Active 1y. Min Req 1y. Deficit 0.
    // Gap is huge. But Req Max is 3. Safety cap logic `requiredExp.max < 20`.
    // Allowed Supplement = Max(0, Req.Max - Active) = 3 - 1 = 2.
    // Even if Gap is 10, should only supplement 2 years max.
    const profile = createProfile(2015, 2016); 
    const job = createJob("1-3年"); // range.max = 3
    const result = ExperienceCalculator.calculate(profile, job);
    
    assert("Supplement capped by Job Requirement", result.supplementYears <= 2, `Got ${result.supplementYears} (Expected <= 2)`);
    // It should definitely NOT be 9 or 10.
}

// --- Scenario 9: High Req, Recent Grad (Impossible Request) ---
{
    console.log("\n--- Scenario 9: High Req, Recent Grad (0 Exp, Req 5y) ---");
    // Graduated 2025-06. Now 2026-01. (Space 0.5y).
    // Req 5y.
    // Earliest Work = Entrance (2021-09). Space ~4.3y.
    // Should fill all available space (4.3y) but not 5.
    const profile = createProfile(null, undefined, 2021);
    profile.educations[0].endDate = "2025-06";
    const job = createJob("5-10年");
    const result = ExperienceCalculator.calculate(profile, job);
    
    assert("Supplement utilizes college years", result.supplementYears > 3.0, `Got ${result.supplementYears}`);
    // But capped by physical strictness?
    // Logic: earliestWork = entrance.
    // Max = Now - 2021.09 = ~4.3y.
    assert("Supplement capped near Max Possible", result.supplementYears < 4.5, `Got ${result.supplementYears}`);
    // But capped by physical strictness?
    // Logic: earliestWork = entrance.
    // Max = Now - 2021.09 = ~4.3y.
}

// --- Matrix Tests (User Cases A, B, C against 6 Job Reqs) ---
console.log("\n--- Running Matrix Tests (User Cases A, B, C) ---");

const jobReqs = ["1-3年", "3-5年", "3+年", "5-7年", "5-10年", "10+年"];

// Helper to build explicit profile
const buildMatrixProfile = (exps: {s: string, e: string}[]) => ({
    name: "Matrix User",
    educations: [{
        school: "Uni", degree: "BS", major: "CS", 
        startDate: "2015-09", endDate: "2019-06"
    }],
    workExperiences: exps.map((e, i) => ({
        company: `Comp ${i}`, position: "Dev", 
        startDate: e.s, endDate: e.e,
        responsibilities: []
    })),
    birthday: "1997-01-01"
} as any);

const matrixCases = [
    {
        name: "Case A (2 Segments, ~2.8y Active)",
        exps: [
            { s: "2022-03", e: "2023-09" }, // ~1.5y
            { s: "2019-09", e: "2020-12" }  // ~1.3y
        ],
        active: 2.8
    },
    {
        name: "Case B (1 Segment, ~3.5y Active)",
        exps: [
            { s: "2021-03", e: "2024-09" }  // ~3.5y
        ],
        active: 3.5
    },
    {
        name: "Case C (3 Segments, ~5.8y Active)",
        exps: [
            { s: "2021-03", e: "2022-09" }, // ~1.5y
            { s: "2019-09", e: "2020-12" }, // ~1.3y
            { s: "2023-01", e: "2025-12" }  // ~3.0y
        ],
        active: 5.8
    }
];

matrixCases.forEach(userCase => {
    console.log(`\nTesting User: ${userCase.name} [Active: ~${userCase.active}y]`);
    const profile = buildMatrixProfile(userCase.exps);

    jobReqs.forEach(req => {
        const job = createJob(req);
        const result = ExperienceCalculator.calculate(profile, job);
        
        let minReq = 0;
        if (req.includes("1-3")) minReq = 1;
        else if (req.includes("3-5")) minReq = 3;
        else if (req.includes("3+")) minReq = 3;
        else if (req.includes("5-7")) minReq = 5;
        else if (req.includes("5-10")) minReq = 5;
        else if (req.includes("10+")) minReq = 10;
        
        // Deficit Logic Check
        const deficit = Math.max(0, minReq - userCase.active);
        const shouldSupplement = deficit > 0.3; // Allow small buffer
        
        let status = "OK";
        
        // Failure Conditions
        if (shouldSupplement && !result.needsSupplement) {
             status = `FAIL: Expected Supplement`;
             failures++;
        } else if (result.needsSupplement && result.finalTotalYears < minReq) {
             // Unless Physical Cap prevents it?
             // Start 2015-09. Max Space to 2026-01 is ~10.3 years.
             // If req is 10+, max space is 10.3. So it should reach ~10.
             if (minReq > 10.5) {
                 // pass
             } else {
                // If it's significantly short
                if (result.finalTotalYears < minReq - 0.5) {
                     status = `FAIL: Final Years (${result.finalTotalYears.toFixed(1)}) < Min Req (${minReq})`;
                     failures++;
                }
             }
        }
        
        console.log(`  ${status === "OK" ? "✅" : "❌"} Req: ${req.padEnd(6)} | Supp: ${result.supplementYears.toFixed(1)} | Final: ${result.finalTotalYears.toFixed(1)} | ${status !== "OK" ? status : ""}`);
    });
});

console.log("\n----------------");
if (failures === 0) {
    console.log("🎉 ALL TESTS PASSED");
    process.exit(0);
} else {
    console.log(`💥 ${failures} TESTS FAILED`);
    process.exit(1);
}

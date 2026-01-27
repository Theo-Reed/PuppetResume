import { ExperienceCalculator } from '../src/utils/experienceCalculator';
import { UserResumeProfile, JobData } from '../src/types';

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function generateRandomProfile(caseId: number): UserResumeProfile {
    // 随机出生年份 1995-2002
    const birthYear = randomInt(1995, 2002);
    const birthday = `${birthYear}-06-15`;

    // 随机学历 (80% 概率有学历)
    const hasEducation = Math.random() > 0.2;
    const educations = [];
    if (hasEducation) {
        const eduStartYear = birthYear + 18;
        const eduEndYear = eduStartYear + 4;
        educations.push({
            school: 'Test University',
            degree: 'Bachelor',
            major: 'CS',
            startDate: `${eduStartYear}-09`,
            endDate: `${eduEndYear}-06`,
            description: ''
        });
    }

    // 随机工作经历 0-3 段
    const numJobs = randomInt(0, 3);
    const workExperiences = [];
    
    // 从当前时间往回推
    let cursor = new Date();
    
    // 随机当前空窗期 (0-12个月)
    // 为了测试 Case 2.2 (末尾空窗 > 6个月)，我们需要让某些用例 gap > 6
    const currentGap = randomInt(0, 12); 
    cursor.setMonth(cursor.getMonth() - currentGap);

    for (let i = 0; i < numJobs; i++) {
        // 每段工作 0.5 - 2 年 (6 - 24 个月)
        const durationMonths = randomInt(6, 24);
        
        const endDate = new Date(cursor);
        const startDate = new Date(cursor);
        startDate.setMonth(startDate.getMonth() - durationMonths);

        const isCurrentJob = (i === 0 && currentGap === 0);

        workExperiences.push({
            company: `公司_${String.fromCharCode(65 + i)}`,
            jobTitle: '工程师',
            businessDirection: '技术',
            startDate: formatDate(startDate),
            endDate: isCurrentJob ? '至今' : formatDate(endDate)
        });

        // 两段工作之间的空窗期 (0-12个月)
        // 为了测试 Case 2.1 (中间空窗 > 6个月)
        const gapMonths = randomInt(0, 12);
        cursor = new Date(startDate);
        cursor.setMonth(cursor.getMonth() - gapMonths);
    }

    return {
        name: `User_Case_${caseId}`,
        photo: '',
        email: 'test@example.com',
        phone: '13800138000',
        workExperiences: workExperiences.reverse(), // 按时间正序排列输入
        educations,
        skills: [],
        certificates: [],
        aiMessage: '',
        birthday,
        gender: 'Male',
        wechat: 'wx123'
    };
}

function generateRandomJobReq(): string {
    const min = randomInt(1, 10);
    const formats = [
        `${min}年`,
        `${min}-${min + randomInt(1, 3)}年`,
        `${min}年以上`,
        `${min}年+`
    ];
    return formats[randomInt(0, 3)];
}

console.log('Running 20 Random Test Cases for ExperienceCalculator...\n');

for (let i = 1; i <= 20; i++) {
    const profile = generateRandomProfile(i);
    const jobReqStr = generateRandomJobReq();
    const job: JobData = { 
        experience: jobReqStr,
        _id: 'job1', title: 'Target Job', description: 'Desc', team: 'Team'
    } as unknown as JobData;

    console.log(`=== Case ${i} ===`);
    console.log(`Job Req: ${jobReqStr}`);
    
    console.log('Target Work Timeline:');
    if (profile.workExperiences.length === 0) {
        console.log('  (No work experience)');
    }
    profile.workExperiences.forEach(exp => {
        console.log(`  [Existing] ${exp.startDate} ~ ${exp.endDate}`);
    });
    if(profile.educations.length > 0) {
        console.log(`  [Education] ${profile.educations[0].startDate} ~ ${profile.educations[0].endDate}`);
    } else {
        console.log(`  [Birthday] ${profile.birthday} (No Edu)`);
    }

    const result = ExperienceCalculator.calculate(profile, job);

    console.log('------------------------------------------------');
    console.log(`Output Summary:`);
    console.log(`Total Supplement Segments: ${result.supplementSegments.length}`);
    
    if (result.supplementSegments.length > 0) {
        result.supplementSegments.forEach((seg, idx) => {
            console.log(`  + Supplement ${idx + 1}: ${seg.startDate} ~ ${seg.endDate} (${seg.years} years)`);
        });
    } else {
        console.log(`  (No supplements added)`);
    }

    console.log(`Total Final Experience: ${result.finalTotalYears} years`);
    
    // Check Full Timeline order
    console.log('Full Result Timeline:');
    result.allWorkExperiences.forEach(exp => {
         console.log(`  ${exp.startDate} ~ ${exp.endDate} [${exp.type}]`);
    });
    console.log('\n\n');
}

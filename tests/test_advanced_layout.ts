
import { ResumeGenerator } from '../src/resumeGenerator';
import { ResumeFactory } from './generator_utils';
import { ResumeData } from '../src/types';

async function generate(generator: ResumeGenerator, data: ResumeData, filename: string, description: string) {
    console.log(`\n--- 开始生成: ${description} ---`);
    const outputPath = filename; // path relative to current dir
    try {
        await generator.generatePDFToFile(data, outputPath);
        console.log(`✅ 生成成功: ${filename}`);
    } catch (error) {
        console.error(`❌ 生成失败 (${filename}):`, error);
    }
}

async function runAdvancedTests() {
    const generator = new ResumeGenerator();
    console.log('正在初始化生成器...');
    await generator.init();

    // === 第一组：常见场景 ===

    // 1. 技能专长型 (Skill Heavy)
    // 很多技能分类，学历简单
    const skillHeavy = ResumeFactory.generateProfile({
        eduLevel: 'bachelor',
        skillCats: 5,     // 5大类
        skillItems: 4,    // 每类4小点
        certCount: 2,
        jobCount: 2,
        respsPerJob: 4,
        introLength: 'medium'
    });
    skillHeavy.name = "技能狂魔";
    await generate(generator, skillHeavy, 'test_case_01_skill_heavy.pdf', '场景1：重技能板块 (5大类)');

    // 2. 学术研究型 (PhD/Academic)
    // 博士，详细教育描述，少量工作
    const eduHeavy = ResumeFactory.generateProfile({
        eduLevel: 'phd',
        eduDesc: true,     
        skillCats: 2,
        skillItems: 3,
        certCount: 1,
        jobCount: 1,       // 只有1份工作
        respsPerJob: 3,
        introLength: 'long'
    });
    eduHeavy.name = "学术博士";
    await generate(generator, eduHeavy, 'test_case_02_academic.pdf', '场景2：重教育背景 (博士)');

    // 3. 极简主义 (Minimalist)
    // 内容很少，甚至不到半页，测试强力拉伸
    const minimalist = ResumeFactory.generateProfile({
        eduLevel: 'bachelor',
        skillCats: 2,
        skillItems: 2,
        certCount: 0,
        jobCount: 1,
        respsPerJob: 3,
        introLength: 'short'
    });
    minimalist.name = "应届毕业生";
    await generate(generator, minimalist, 'test_case_03_minimalist.pdf', '场景3：极简内容 (测试拉伸)');

    // 4. 刚好溢出 (Just Overflow)
    // 内容大约 1.1 - 1.2 页，期望被压缩回1页
    const overflow = ResumeFactory.generateProfile({
        eduLevel: 'masters',
        skillCats: 4,
        skillItems: 3,
        certCount: 2,
        jobCount: 4,       
        respsPerJob: 5,
        introLength: 'medium'
    });
    overflow.name = "溢出测试员";
    await generate(generator, overflow, 'test_case_04_overflow_compression.pdf', '场景4：刚好溢出 (测试压缩)');

    // === 第二组：特殊板块组合 ===

    // 5. 单份长工作 (Long Experience)
    // 只有一份工作，但描述非常长，测试跨页分页
    const longJob = ResumeFactory.generateProfile({
        eduLevel: 'bachelor',
        skillCats: 3,
        jobCount: 1,
        respsPerJob: 15,    // 15条职责！
        introLength: 'medium'
    });
    longJob.name = "深耕专家";
    await generate(generator, longJob, 'test_case_05_long_job_span.pdf', '场景5：单份超长工作 (测试分页)');

    // 6. 碎片化经历 (Many Short Jobs)
    // 很多份短工作，测试两页布局
    const jobHopper = ResumeFactory.generateProfile({
        eduLevel: 'bachelor',
        skillCats: 3,
        jobCount: 8,       // 8份工作
        respsPerJob: 3,
        introLength: 'short'
    });
    jobHopper.name = "跳槽达人";
    await generate(generator, jobHopper, 'test_case_06_many_jobs.pdf', '场景6：多份工作 (测试列表连贯性)');

    // 7. 无证书 (No Certificates)
    const noCert = ResumeFactory.generateProfile({
        eduLevel: 'masters',
        certCount: 0,      // 无证书
        skillCats: 3,
        jobCount: 3,
        respsPerJob: 4
    });
    await generate(generator, noCert, 'test_case_07_no_certs.pdf', '场景7：无证书板块');

    // 8. 证书墙 (Many Certificates)
    const manyCert = ResumeFactory.generateProfile({
        eduLevel: 'masters',
        certCount: 10,     // 10个证书
        skillCats: 3,
        jobCount: 2,
        respsPerJob: 4
    });
    await generate(generator, manyCert, 'test_case_08_many_certs.pdf', '场景8：多证书板块');

    // === 第三组：极端/边缘情况 ===

    // 9. 无技能 (No Skills - Management/Sales)
    const noSkills = ResumeFactory.generateProfile({
        eduLevel: 'bachelor',
        skillCats: 0,      // 无技能
        jobCount: 4,
        respsPerJob: 5,
        introLength: 'long'
    });
    noSkills.name = "纯管理岗";
    await generate(generator, noSkills, 'test_case_09_no_skills.pdf', '场景9：无技能板块');

    // 10. 长个人介绍 (Long Intro)
    const longIntro = ResumeFactory.generateProfile({
        eduLevel: 'masters',
        skillCats: 3,
        jobCount: 2,
        respsPerJob: 4,
        introLength: 'super_long' // 超长
    });
    longIntro.name = "话痨选手";
    await generate(generator, longIntro, 'test_case_10_long_intro.pdf', '场景10：超长个人介绍');

    // 11. 双页满填充 (Two Pages Full)
    const twoPageFull = ResumeFactory.generateProfile({
        eduLevel: 'masters',
        eduDesc: true,
        skillCats: 5,
        skillItems: 4,
        certCount: 3,
        jobCount: 5,       
        respsPerJob: 7     
    });
    await generate(generator, twoPageFull, 'test_case_11_2pages_full.pdf', '场景11：两页满充填');

    // 12. 三页满填充 (Three Pages Full)
    const threePageFull = ResumeFactory.generateProfile({
        eduLevel: 'phd',
        eduDesc: true,
        skillCats: 6,
        skillItems: 5,
        certCount: 5,
        jobCount: 9,       
        respsPerJob: 8     
    });
    await generate(generator, threePageFull, 'test_case_12_3pages_full.pdf', '场景12：三页满充填');

    await generator.close();
    console.log('所有12个高级测试用例已执行完毕。');
}

runAdvancedTests().catch(console.error);

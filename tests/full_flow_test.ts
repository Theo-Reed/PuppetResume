
import * as dotenv from 'dotenv';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { ResumeAIService } from '../src/resumeAIService';
import { ResumeGenerator } from '../src/resumeGenerator';
import { GenerateFromFrontendRequest } from '../src/types';

// 加载环境变量
dotenv.config();

async function runFullFlowTest() {
    console.log('🚀 开始全链路集成测试...');

    // 1. 准备数据
    const profilePath = join(__dirname, 'test_profile.json');
    const jobsPath = join(__dirname, 'diverse_test_jobs.json');
    
    const profile = JSON.parse(readFileSync(profilePath, 'utf-8'));
    const jobs = JSON.parse(readFileSync(jobsPath, 'utf-8'));
    const targetJob = jobs[0]; // 使用第一个岗位 (.NET开发工程师)

    const payload: GenerateFromFrontendRequest = {
        userId: 'test_user_001',
        jobId: targetJob._id,
        language: 'chinese',
        resume_profile: profile,
        job_data: targetJob
    };

    try {
        // 2. AI 增强阶段
        console.log('\n🤖 [Step 1/3] 正在调用 AI 进行内容增强...');
        const aiService = new ResumeAIService();
        const enhancedData = await aiService.enhance(payload);
        
        console.log('✅ AI 增强完成！素材概览:');
        console.log(`- 个人介绍长度: ${enhancedData.personalIntroduction.length} 字`);
        console.log(`- 技能组数量: ${enhancedData.professionalSkills?.length}`);
        console.log(`- 工作经历数: ${enhancedData.workExperience.length}`);
        enhancedData.workExperience.forEach((exp, i) => {
            console.log(`  [Job ${i+1}] ${exp.company} - 职责数: ${exp.responsibilities?.length}`);
        });

        // 3. PDF 生成阶段
        console.log('\n📄 [Step 2/3] 正在启动布局引擎进行模拟与裁剪...');
        const generator = new ResumeGenerator();
        await generator.init();
        
        const outputFilename = `test_result_${Date.now()}.pdf`;
        const outputPath = join(__dirname, outputFilename);
        
        await generator.generatePDFToFile(enhancedData, outputPath);
        
        // 4. 完成
        console.log('\n🎉 [Step 3/3] 集成测试圆满完成！');
        console.log(`✅ 简历已生成并保存至: ${outputPath}`);
        
        await generator.close();
    } catch (error: any) {
        console.error('\n❌ 测试流程异常:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

runFullFlowTest();

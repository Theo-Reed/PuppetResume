
import { ResumeGenerator } from '../src/resumeGenerator';
import { ResumeFactory } from './generator_utils';
import { ResumeData } from '../src/types';

async function generate(generator: ResumeGenerator, data: ResumeData, filename: string, description: string) {
    console.log(`\n--- 开始生成: ${description} ---`);
    try {
        await generator.generatePDFToFile(data, filename);
        console.log(`✅ 生成成功: ${filename}`);
    } catch (error) {
        console.error(`❌ 生成失败 (${filename}):`, error);
    }
}

async function runSimulationTests() {
    const generator = new ResumeGenerator();
    console.log('正在初始化生成器...');
    await generator.init();

    // 生成 20 个随机场景
    const cases = ResumeFactory.generateRandomCases(20);
    
    for (const testCase of cases) {
        await generate(generator, testCase.data, testCase.filename, testCase.desc);
    }

    await generator.close();
    console.log('所有20个模拟测试用例已执行完毕。');
}

runSimulationTests().catch(console.error);

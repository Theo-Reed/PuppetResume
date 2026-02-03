import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { GenerateFromFrontendRequest } from './types';

// 定义依赖接口
export interface TaskServices {
  db: any;
  gemini: any;
  aiService: any;
  generator: any;
}

const COLLECTION_RESUMES = 'generated_resumes';

// 静态文件服务 - 用于访问生成的简历
const PUBLIC_DIR = join(process.cwd(), 'public');
const RESUMES_DIR = join(PUBLIC_DIR, 'resumes');
if (!existsSync(RESUMES_DIR)) {
  mkdirSync(RESUMES_DIR, { recursive: true });
}

/**
 * 异步后台任务：负责 AI 增强、PDF 生成和本地保存
 */
export async function runBackgroundTask(taskId: string, payload: GenerateFromFrontendRequest, services: TaskServices) {
    const { db, gemini, aiService, generator } = services;
    console.log(`🚀 [Task ${taskId}] 后台任务启动...`);

  if (!db) {
    console.error(`[Task ${taskId}] ❌ 无法启动后台任务：数据库未初始化`);
    return;
  }

  try {
    // 在生成之前检查连通性，避免浪费计算资源
    // 重试机制：尝试 3 次，每次间隔 3 秒
    let check = { success: false, message: '' };
    for (let i = 0; i < 3; i++) {
        try {
            check = await gemini.checkConnectivity();
            if (check.success) break;
        } catch (e: any) {
            check.message = e.message;
        }
        if (i < 2) { // 只有前两次失败才等待
            console.log(`[Task ${taskId}] ⚠️ 连通性测试失败，3秒后重试 (${i + 1}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    if (!check.success) {
      throw new Error(`Gemini 服务不可用: ${check.message} (已重试3次)`);
    }

    console.log(`[Task ${taskId}] 🤖 开始 AI 增强内容...`);
    // 1. 调用 AI 增强服务
    const resumeData = await aiService.enhance(payload);

    console.log(`[Task ${taskId}] 📄 开始生成 PDF...`);
    // 2. 生成 PDF Buffer
    const pdfBuffer = await generator.generatePDFToBuffer(resumeData);

    console.log(`[Task ${taskId}] 💾 开始保存到本地服务器...`);
    // 3. 保存到本地
    const timestamp = Date.now();
    const fileName = `${payload.userId}_${timestamp}_${taskId}.pdf`;
    const filePath = join(RESUMES_DIR, fileName);
    
    writeFileSync(filePath, pdfBuffer);
    const fileUrl = `/public/resumes/${fileName}`;

    // 4. 更新数据库状态为成功
    await db.collection(COLLECTION_RESUMES).updateOne({ task_id: taskId }, {
      $set: {
        status: 'completed',
        fileUrl: fileUrl, 
        completeTime: new Date()
      }
    });

    console.log(`[Task ${taskId}] ✅ 任务完成，保存路径: ${filePath}`);
  } catch (error: any) {
    console.error(`[Task ${taskId}] ❌ 任务处理失败:`, error);
    // 更新数据库状态为失败
    try {
      await db.collection(COLLECTION_RESUMES).updateOne({ task_id: taskId }, {
        $set: {
          status: 'failed',
          errorMessage: error.message || '内部处理超时或生成失败',
          completeTime: new Date()
        }
      });
    } catch (dbError) {
      console.error(`[Task ${taskId}] ❌ 无法更新失败状态到数据库:`, dbError);
    }
  }
}

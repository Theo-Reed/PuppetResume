import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { ObjectId } from 'mongodb';
import { GenerateFromFrontendRequest, JobData } from '../types';
import { runBackgroundTask, TaskServices } from '../taskRunner';

const router = Router();

router.post('/retryGenerateResume', async (req: Request, res: Response) => {
  try {
    const { openid, resumeId } = req.body;
    
    // 1. 验证用户权限
    const headers = req.headers;
    const effectiveOpenId = (headers['x-openid'] as string) || openid;
    if (!effectiveOpenId) {
       return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (!resumeId) {
        return res.status(400).json({ success: false, message: 'Missing resumeId' });
    }

    const db = getDb();
    const resumesCollection = db.collection('generated_resumes');
    const jobsCollection = db.collection('jobs');
    
    // 2. 查找简历记录
    let queryId;
    try {
        queryId = new ObjectId(resumeId);
    } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid resumeId format' });
    }

    const resume = await resumesCollection.findOne({ 
        _id: queryId,
        $or: [
            { userId: effectiveOpenId },
            { _openid: effectiveOpenId }
        ]
    });

    if (!resume) {
        return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    
    // 3. 构建 Payload
    let jobData: JobData;

    // 优先从 resume 记录中获取保存的 jobData
    if (resume.jobData) {
        jobData = resume.jobData as JobData;
    } else {
        // 如果没有保存，尝试去 jobs 表里查 (兼容旧数据)
        if (!resume.jobId) {
            return res.status(400).json({ success: false, message: 'Missing jobId in resume record' });
        }
        
        let jobQueryId;
        try {
            jobQueryId = new ObjectId(resume.jobId);
        } catch {
            jobQueryId = resume.jobId;
        }

        const job = await jobsCollection.findOne({ _id: jobQueryId });
        if (!job) {
            // 如果两个地方都找不到，那只能报错了
            return res.status(404).json({ success: false, message: `Job not found: ${resume.jobId}` });
        }

        jobData = {
            ...(job as any),
            _id: job._id.toString()
        };
    }

    const payload: GenerateFromFrontendRequest = {
        userId: effectiveOpenId,
        jobId: resume.jobId || jobData._id,
        resume_profile: resume.resumeInfo, 
        job_data: jobData,
        language: (resume.resumeInfo as any).language || 'chinese' 
    };

    // 4. 重置状态
    await resumesCollection.updateOne(
        { _id: queryId },
        { 
            $set: { 
                status: 'processing', 
                errorMessage: null,
                retryTime: new Date()
            } 
        }
    );

    // 5. 重新触发后台任务
    // 从 app.locals 获取服务实例
    const { gemini, aiService, generator } = req.app.locals.services;
    const services: TaskServices = { db, gemini, aiService, generator };

    runBackgroundTask(resume.task_id || resume.taskId, payload, services);

    res.json({
        success: true,
        message: 'Retry task started'
    });

  } catch (error: any) {
    console.error('retryGenerateResume error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
  }
});

export default router;

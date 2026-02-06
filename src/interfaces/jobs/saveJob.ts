import { Router, Request, Response } from 'express';
import { getDb } from '../../db';

const router = Router();

// Used in: pages/job-detail/index.ts
router.post('/saveJob', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    // 使用 phoneNumber 作为业务主键
    const user = (req as any).user;
    const phoneNumber = user?.phoneNumber;

    console.log(`[saveJob] Request from ${phoneNumber} for jobId: ${jobId}`);

    if (!phoneNumber || !jobId) {
      console.warn('[saveJob] Missing credentials:', { phoneNumber, jobId });
      return res.status(400).json({ success: false, message: 'Missing phoneNumber or jobId' });
    }

    const db = getDb();
    const result = await db.collection('saved_jobs').updateOne(
        { phoneNumber, jobId },
        { 
            $set: { 
                phoneNumber, 
                jobId, 
                createdAt: new Date() 
            } 
        },
        { upsert: true }
    );
    
    res.json({
      success: true,
      result: {
        _id: jobId, // Return jobId as reference for simplicity
        ok: 1,
        upsertedId: result.upsertedId
      }
    });
  } catch (error: any) {
    console.error('saveJob error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

export default router;

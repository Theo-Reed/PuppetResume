import { Router, Request, Response } from 'express';
import { getDb } from '../../db';

const router = Router();

// Used in: pages/index/index.ts
router.post('/clearAllSearchConditions', async (req: Request, res: Response) => {
  try {
    const openid = req.headers['x-openid'] as string || req.body.openid;

    if (!openid) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const db = getDb();
    const result = await db.collection('saved_search_conditions').deleteMany({
      openid: openid
    });
    
    res.json({
      success: true,
      result: { 
        success: true, 
        count: result.deletedCount 
      }
    });
  } catch (error) {
    console.error('Error in clearAllSearchConditions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

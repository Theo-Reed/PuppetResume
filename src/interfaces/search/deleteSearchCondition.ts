import { Router, Request, Response } from 'express';
import { getDb } from '../../db';
import { ObjectId } from 'mongodb';

const router = Router();

// Used in: pages/index/index.ts
router.post('/deleteSearchCondition', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const openid = req.headers['x-openid'] as string || req.body.openid;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID is required' });
    }

    const db = getDb();
    // Delete only if it belongs to the user
    const result = await db.collection('saved_search_conditions').deleteOne({
      _id: new ObjectId(id as string),
      openid: openid
    });
    
    res.json({
      success: true,
      result: { 
        success: result.deletedCount > 0 
      }
    });
  } catch (error) {
    console.error('Error in deleteSearchCondition:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

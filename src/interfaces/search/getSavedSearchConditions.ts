import { Request, Response } from 'express';
import { getDb } from '../../db';

// Used in: pages/index/index.ts
export const getSavedSearchConditions = async (req: Request, res: Response) => {
  try {
    const { tabIndex, openid } = req.body;
    const db = getDb();

    // Logic:
    // Query 'saved_search_conditions' where userId = openid AND tabIndex = tabIndex
    const conditions = await db.collection('saved_search_conditions').find({
      userId: openid,
      tabIndex: tabIndex
    }).toArray();
    
    res.json({
      success: true,
      result: {
        conditions: conditions || []
      }
    });
  } catch (error) {
    console.error('Error in getSavedSearchConditions:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

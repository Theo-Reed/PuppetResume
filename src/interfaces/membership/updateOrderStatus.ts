import { Router, Request, Response } from 'express';
import { getDb } from '../../db';
import { ObjectId } from 'mongodb';

const router = Router();

// Used in: pages/me/index.ts (when user cancels payment)
router.post('/updateOrderStatus', async (req: Request, res: Response) => {
  try {
    const { order_id, status } = req.body;
    const openid = req.headers['x-openid'] as string || req.body.openid;

    if (!order_id || !status) {
      return res.status(400).json({ success: false, message: 'Missing order_id or status' });
    }

    const db = getDb();
    const ordersCol = db.collection('orders');

    // Only allow updating to certain statuses manually from frontend
    const allowedStatuses = ['cancelled', 'pending'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const result = await ordersCol.updateOne(
      { 
        _id: new ObjectId(order_id),
        openid: openid // Security check: must own the order
      },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    res.json({
      success: true,
      result: { success: true }
    });
  } catch (error: any) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

export default router;

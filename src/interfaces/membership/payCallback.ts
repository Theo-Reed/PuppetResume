import { Router, Request, Response } from 'express';
import { getWxPayClient } from '../../wechat-pay';
import { activateMembershipByOrder } from '../../services/membershipService';

const router = Router();

router.post('/payCallback', async (req: Request, res: Response) => {
  try {
    const pay = getWxPayClient();
    
    // The wechatpay-node-v3 library verification
    // It requires headers and body (body can be object or string depending on version)
    const result = await pay.verify_sign(req.headers, req.body);
    
    if (!result) {
      console.error('[PayCallback] Signature verification failed');
      return res.status(401).json({ code: 'FAIL', message: 'Signature verification failed' });
    }

    // Decrypt resource
    const { resource } = req.body;
    const decoded = pay.decipher_gcm(resource.ciphertext, resource.associated_data, resource.nonce);
    
    console.log('[PayCallback] Decoded event:', decoded);

    if (decoded.trade_state === 'SUCCESS') {
      const order_id = decoded.out_trade_no;
      console.log(`[PayCallback] Payment success for order: ${order_id}`);
      await activateMembershipByOrder(order_id);
    }

    // Always return success to WeChat if verification passed
    res.json({ code: 'SUCCESS', message: 'OK' });
  } catch (error: any) {
    console.error('[PayCallback] Error:', error);
    // Be careful: WeChat will retry if you don't return success
    res.status(500).json({ code: 'FAIL', message: error.message });
  }
});

export default router;

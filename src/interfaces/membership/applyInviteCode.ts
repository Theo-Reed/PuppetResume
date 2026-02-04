import { Router, Request, Response } from 'express';
import { getDb } from '../../db';
import { ensureUser } from '../../userUtils';

const router = Router();

/**
 * Apply an invitation code
 * POST /api/applyInviteCode
 */
router.post('/applyInviteCode', async (req: Request, res: Response) => {
  try {
    const { targetInviteCode } = req.body;
    const openid = req.headers['x-openid'] as string || req.body.openid;

    if (!openid || !targetInviteCode) {
      return res.json({ success: false, message: '参数缺失' });
    }

    const db = getDb();
    const usersCol = db.collection('users');

    // 1. 获取当前用户（受邀者）
    const invitee = await ensureUser(openid);
    if (!invitee) {
      return res.json({ success: false, message: '记录未找到' });
    }

    // 基础检查：是否已邀请过
    if (invitee.hasUsedInviteCode) {
      return res.json({ success: false, message: '该账户已被他人邀请，无法重复领取奖励' });
    }

    // 2. 找到邀请人 (邀请码现在区分大小写)
    const inviter = await usersCol.findOne({ inviteCode: targetInviteCode });
    if (!inviter) {
      return res.json({ success: false, message: '无效的邀请码' });
    }

    if (inviter.openid === openid) {
      return res.json({ success: false, message: '不能填写自己的邀请码' });
    }

    // 3. 执行奖励逻辑（双方各增加 3 天会员 + 5 点算力）
    const rewardDays = 3;
    const rewardPoints = 5;

    // --- A. 更新受邀者 (需要原子性操作防止重复领取) ---
    let inviteeBaseDate = new Date();
    if (invitee.membership?.expire_at && new Date(invitee.membership.expire_at) > inviteeBaseDate) {
        inviteeBaseDate = new Date(invitee.membership.expire_at);
    }
    const inviteeNewExpireAt = new Date(inviteeBaseDate.getTime() + rewardDays * 24 * 60 * 60 * 1000);

    const currentInviteeLevel = invitee.membership?.level || 0;
    const newInviteeLevel = Math.max(currentInviteeLevel, 1);

    const updateResult = await usersCol.updateOne(
      { 
        openid: invitee.openid, 
        hasUsedInviteCode: { $ne: true } // 原子性锁：只有从未领取过时才更新
      },
      { 
        $set: { 
          hasUsedInviteCode: true,
          invitedBy: inviter.openid, // 审计追踪：记录谁邀请的
          'membership.expire_at': inviteeNewExpireAt,
          'membership.level': newInviteeLevel
        },
        $inc: { 
          'membership.pts_quota.limit': rewardPoints
        }
      }
    );

    // 如果 modifiedCount 为 0，说明在查询和更新之间已经被处理过了（并发冲突）
    if (updateResult.modifiedCount === 0) {
      return res.json({ success: false, message: '该账户已被他人邀请，无法重复领取奖励' });
    }

    // --- B. 更新邀请人 ---
    let inviterBaseDate = new Date();
    if (inviter.membership?.expire_at && new Date(inviter.membership.expire_at) > inviterBaseDate) {
        inviterBaseDate = new Date(inviter.membership.expire_at);
    }
    const inviterNewExpireAt = new Date(inviterBaseDate.getTime() + rewardDays * 24 * 60 * 60 * 1000);

    const currentInviterLevel = inviter.membership?.level || 0;
    const newInviterLevel = Math.max(currentInviterLevel, 1);

    await usersCol.updateOne(
      { openid: inviter.openid },
      { 
        $set: { 
          'membership.expire_at': inviterNewExpireAt,
          'membership.level': newInviterLevel
        },
        $inc: { 
          'membership.pts_quota.limit': rewardPoints
        }
      }
    );

    res.json({
      success: true,
      message: `邀请成功！您与邀请人均已获得 ${rewardDays} 天会员及 ${rewardPoints} 点算力奖励`,
      result: { success: true }
    });

  } catch (error) {
    console.error('applyInviteCode error:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;

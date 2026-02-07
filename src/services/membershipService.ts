import { getDb } from '../db';
import { ObjectId } from 'mongodb';

export const activateMembershipByOrder = async (orderId: string) => {
    const db = getDb();
    const ordersCol = db.collection('orders');
    const schemesCol = db.collection('member_schemes');
    const usersCol = db.collection('users');

    // --- 大厂级核心：CAS (Compare And Swap) 原子锁 ---
    // 1. 尝试原子性地将订单从 pending 更新为 paid
    // 只有这一步争抢成功的请求，才有资格发放权益
    const orderUpdateResult = await ordersCol.findOneAndUpdate(
        { 
            _id: new ObjectId(orderId), 
            status: 'pending' // 乐观锁条件：只有当前是 pending 才可以改
        },
        { 
            $set: { status: 'paid', paidAt: new Date(), activated: true },
            $unset: { expireAt: "" } 
        }
    );

    // orderUpdateResult.value 是更新前的文档状态 (如果匹配成功)
    // 如果为 null，说明订单不存在，或者订单状态已经不是 pending (被其他请求抢先处理了)
    if (!orderUpdateResult) {
        console.log(`[Membership] Order ${orderId} CAS lock failed. Checking if already paid...`);
        // 二次确认：如果是已经支付的，直接返回当前用户态，实现幂等
        const paidOrder = await ordersCol.findOne({ _id: new ObjectId(orderId) });
        if (paidOrder && paidOrder.status === 'paid') {
            const userQuery = paidOrder.userId ? { _id: paidOrder.userId } : { $or: [{ openid: paidOrder.openid }, { openids: paidOrder.openid }] };
            console.log(`[Membership] Order ${orderId} was already paid. Returning idempotency result.`);
            return await usersCol.findOne(userQuery);
        } else {
             // 真的找不到或者是其他状态
             throw new Error('Order invalid or processed');
        }
    }

    const order = orderUpdateResult as any; // 这里的 order 是更新前的（状态为 pending）

    // 2. 虽然上面拿到了 status=pending 的文档，但此刻 DB 里已经是 paid 了
    // 我们获得了“发货权”，下面开始发放权益
    
    // Get Scheme
    const scheme = await schemesCol.findOne({ scheme_id: order.scheme_id });
    if (!scheme) {
        console.error(`[Membership] Scheme ${order.scheme_id} not found for order ${orderId}`);
        // 极端情况：已扣款但方案没了。这里记录严重日志，通常需要人工介入或退款
        // 在这里暂不抛出阻断错误的，而是继续尝试更新用户，或者回滚(MongoDB事务)
        // 为简化，抛出错误供上层捕获
        throw new Error('Scheme not found');
    }
    
    // 3. Update User
    const userQuery = order.userId ? { _id: order.userId } : { $or: [{ openid: order.openid }, { openids: order.openid }] };
    const user = await usersCol.findOne(userQuery);
    
    if (!user) {
        console.error(`[Membership] User ${order.openid} / ${order.userId} not found for order ${orderId}`);
        throw new Error('User not found');
    }

    const update: any = { $set: {}, $inc: {} };
    const now = new Date();
    const currentMembership = (user as any).membership || {};
    
    // --- Activate Logic ---
    const isMemberActive = currentMembership.expire_at && new Date(currentMembership.expire_at) > now;
    const currentLevel = currentMembership.level || 0;
    const targetLevel = scheme.level;
    
    console.log(`[Membership] Activating for user ${user._id}. Current Level: ${currentLevel}, Target: ${targetLevel}`);

    // Fix: db uses 'days' not 'duration_days'
    const durationDays = scheme.days || scheme.duration_days || 30; 
    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    const pointsToAdd = scheme.points || 0;

    let newExpireAt: Date | null = null;

    // Handle Expiration Logic
    if (scheme.type === 'topup') {
        if (durationDays > 0) {
             const currentExpire = (isMemberActive && currentMembership.expire_at) ? new Date(currentMembership.expire_at) : now;
             const baseTime = currentExpire > now ? currentExpire : now;
             newExpireAt = new Date(baseTime.getTime() + durationMs);
        } else {
             newExpireAt = (isMemberActive && currentMembership.expire_at) ? new Date(currentMembership.expire_at) : null;
        }
    } else if (isMemberActive && targetLevel === currentLevel) {
        // Renewal (Same Level) -> Extend
        const currentExpire = new Date(currentMembership.expire_at);
        const baseTime = currentExpire > now ? currentExpire : now;
        newExpireAt = new Date(baseTime.getTime() + durationMs);
    } else {
        // New / Upgrade -> Start Fresh from Now
        newExpireAt = new Date(now.getTime() + durationMs);
    }

    /* Update Membership Object */
    const membershipUpdate: any = {
        'membership.level': (scheme.type === 'topup') ? currentLevel : targetLevel,
        'membership.name': (scheme.type === 'topup') ? (currentMembership.name || 'Standard') : (scheme.name_chinese || scheme.name),
        'membership.type': (scheme.type === 'topup') ? currentMembership.type : scheme.type,
        'membership.updatedAt': now
    };
    
    if (newExpireAt) {
        membershipUpdate['membership.expire_at'] = newExpireAt;
    }
    
    update.$set = membershipUpdate;
    update.$inc = {
        'membership.pts_quota.limit': pointsToAdd
    };

    console.log('[Membership] Executing User Update:', JSON.stringify(update));

    // Update User
    const result = await usersCol.updateOne({ _id: user._id }, update);
    console.log(`[Membership] User update result: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
    
    console.log(`[Membership] Order ${orderId} activation process completed.`);
    return await usersCol.findOne({ _id: user._id });
};

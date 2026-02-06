import { getDb } from '../db';
import { ObjectId } from 'mongodb';

export const activateMembershipByOrder = async (orderId: string) => {
    const db = getDb();
    const ordersCol = db.collection('orders');
    const schemesCol = db.collection('member_schemes');
    const usersCol = db.collection('users');

    // 1. Get Order with state check
    const order = await ordersCol.findOne({ _id: new ObjectId(orderId) });
    if (!order) {
        console.error(`[Membership] Order ${orderId} not found`);
        throw new Error('Order not found');
    }

    // Idempotency check: if order is already paid, don't process again
    if (order.status === 'paid') {
        console.log(`[Membership] Order ${orderId} already processed. Skipping.`);
        // Try to find user by userId first, fallback to openid logic
        const userQuery = order.userId ? { _id: order.userId } : { $or: [{ openid: order.openid }, { openids: order.openid }] };
        return await usersCol.findOne(userQuery);
    }
    
    // 2. Get Scheme
    const scheme = await schemesCol.findOne({ scheme_id: order.scheme_id });
    if (!scheme) {
        console.error(`[Membership] Scheme ${order.scheme_id} not found for order ${orderId}`);
        throw new Error('Scheme not found');
    }
    
    // 3. Update User
    const userQuery = order.userId ? { _id: order.userId } : { $or: [{ openid: order.openid }, { openids: order.openid }] };
    const user = await usersCol.findOne(userQuery);
    
    if (!user) {
        console.error(`[Membership] User ${order.openid} / ${order.userId} not found for order ${orderId}`);
        throw new Error('User not found');
    }

    const update: any = {};
    const now = new Date();
    const currentMembership = (user as any).membership || {};
    
    /* ... (Logic omitted for brevity) ... */

    // Update User
    await usersCol.updateOne({ _id: user._id }, update);
    
    // Update Order Status and REMOVE expireAt to prevent TTL deletion
    await ordersCol.updateOne(
        { _id: new ObjectId(orderId) }, 
        { 
            $set: { status: 'paid', paidAt: new Date() },
            $unset: { expireAt: "" } 
        }
    );

    return await usersCol.findOne({ openid: order.openid });
};

import { MembershipDomainService } from '../services/membershipService';
import { IUser, IScheme } from '../repositories';
import { ObjectId } from 'mongodb';

/**
 * [Big Tech Level Testing Suite]
 * Comprehensive Scenario Matrix for Membership Domain Logic.
 * 
 * Scenarios Covered:
 * 1. New User Acquisitions (Cold Start)
 * 2. Active Member Renewals (Extension)
 * 3. Expired Member Returns (Resurrection)
 * 4. Upgrades (Level Increment)
 * 5. Downgrades (Level Decrement)
 * 6. Top-ups (Add-on Packs - Points/Time)
 * 7. Pricing Engine (Upgrades, Floors, Renewals)
 * 8. Edge Cases (Data Integrity, Boundary Values)
 */

describe('Membership System - Comprehensive Test Suite', () => {
    // Fixed Reference Time: 2026-02-07 12:00:00
    const NOW = new Date('2026-02-07T12:00:00Z');
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // --- Helpers ---
    const mockUser = (level: number, expireAt: Date | null, type: string = 'standard'): IUser => ({
        _id: new ObjectId(),
        openid: `user_l${level}_${Math.random()}`,
        membership: {
            level,
            expire_at: expireAt || undefined,
            name: `Level ${level}`,
            type
        }
    });

    const mockScheme = (level: number, type: string, days?: number, points: number = 0, price: number = 100): IScheme => ({
        scheme_id: level * 10 + (type === 'topup' ? 9 : 0),
        level,
        type,
        days,
        points,
        price,
        name: `Scheme L${level} ${type}`,
    });

    // ==========================================
    // Category 1: New User / Non-Member Scenarios
    // ==========================================
    describe('Category 1: New User Acquisitions', () => {
        test('1.1 Pure New User buys Standard Monthly (30 days)', () => {
            const user = mockUser(0, null); // Level 0
            const scheme = mockScheme(3, 'standard', 30, 100);
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(3);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 30 * ONE_DAY));
            expect(res.pointsToAdd).toBe(100);
        });

        test('1.2 Pure New User buys Premium Yearly (365 days)', () => {
            const user = mockUser(0, null);
            const scheme = mockScheme(4, 'premium', 365, 500);
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(4);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 365 * ONE_DAY));
        });

        test('1.3 Pure New User buys Top-up (Points Only)', () => {
            const user = mockUser(0, null);
            const scheme = mockScheme(0, 'topup', 0, 50); // Level 0 scheme
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            // Should remain level 0, no expiry set
            expect(res.membershipData['membership.level']).toBe(0);
            expect(res.membershipData['membership.expire_at']).toBeUndefined();
            expect(res.pointsToAdd).toBe(50);
        });

        test('1.4 New User with missing membership object', () => {
            const user = { _id: new ObjectId(), openid: 'empty' } as any; // No membership key
            const scheme = mockScheme(3, 'standard', 30);
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(3);
            expect(res.membershipData['membership.expire_at']).toBeDefined();
        });
    });

    // ==========================================
    // Category 2: Active Member Renewals
    // ==========================================
    describe('Category 2: Active Member Renewals', () => {
        test('2.1 Standard Member (Active) renews Standard (Stacking Time)', () => {
            const expiresAvailable = 10 * ONE_DAY; // 10 days left
            const currentExpiry = new Date(NOW.getTime() + expiresAvailable);
            const user = mockUser(3, currentExpiry, 'standard');
            
            const scheme = mockScheme(3, 'standard', 30); // Buy 30 more
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            // Should be Now + 10 + 30 = Now + 40
            expect(res.membershipData['membership.level']).toBe(3);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 40 * ONE_DAY));
        });

        test('2.2 Premium Member (Active) renews Premium', () => {
            const currentExpiry = new Date(NOW.getTime() + 5 * ONE_DAY);
            const user = mockUser(4, currentExpiry, 'premium');
            const scheme = mockScheme(4, 'premium', 365);
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(4);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 370 * ONE_DAY));
        });

        test('2.3 Trial Member (Active) renews Trial (Rare but possible)', () => {
            const currentExpiry = new Date(NOW.getTime() + 1 * ONE_DAY);
            const user = mockUser(1, currentExpiry, 'trial');
            const scheme = mockScheme(1, 'trial', 7);
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(1);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 8 * ONE_DAY));
        });
    });

    // ==========================================
    // Category 3: Expired Member Returns
    // ==========================================
    describe('Category 3: Expired Member Resurrections', () => {
        test('3.1 Expired Standard Member buys Standard (Reset from NOW)', () => {
            const longAgo = new Date(NOW.getTime() - 100 * ONE_DAY); // Expired 100 days ago
            const user = mockUser(3, longAgo, 'standard');
            const scheme = mockScheme(3, 'standard', 30);
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            // Should start from NOW, not append to longAgo
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 30 * ONE_DAY));
            expect(res.membershipData['membership.level']).toBe(3);
        });

        test('3.2 Expired Premium buys Standard (Downgrade + Reset)', () => {
            const yesterday = new Date(NOW.getTime() - 1 * ONE_DAY);
            const user = mockUser(4, yesterday, 'premium');
            const scheme = mockScheme(3, 'standard', 30);
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(3);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 30 * ONE_DAY));
        });
    });

    // ==========================================
    // Category 4 & 5: Upgrades and Downgrades
    // ==========================================
    describe('Category 4 & 5: Grade Changes', () => {
        test('4.1 Active Standard upgrades to Premium (Override/Reset Time)', () => {
            // User has 100 days of Standard left. 
            // Upgrading to Premium usually resets the clock because the value per day is different.
            // (Current logic: Reset from NOW. Pro-ration happens in price, not time)
            const currentExpiry = new Date(NOW.getTime() + 100 * ONE_DAY);
            const user = mockUser(3, currentExpiry, 'standard');
            const scheme = mockScheme(4, 'premium', 30); // Buy 1 month premium
            
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(4);
            expect(res.membershipData['membership.type']).toBe('premium');
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 30 * ONE_DAY));
        });

        test('4.2 Active Trial upgrades to Standard', () => {
            const currentExpiry = new Date(NOW.getTime() + 2 * ONE_DAY);
            const user = mockUser(1, currentExpiry, 'trial');
            const scheme = mockScheme(3, 'standard', 30);
            
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(3);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 30 * ONE_DAY));
        });

        test('5.1 Active Premium downgrades to Standard (Reset)', () => {
            const currentExpiry = new Date(NOW.getTime() + 50 * ONE_DAY);
            const user = mockUser(4, currentExpiry, 'premium');
            const scheme = mockScheme(3, 'standard', 30);
             
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(3);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 30 * ONE_DAY));
        });
    });

    // ==========================================
    // Category 6: Top-ups (Add-ons)
    // ==========================================
    describe('Category 6: Top-up Logic', () => {
        test('6.1 Active Standard buys Point Pack (No Time)', () => {
            const expiry = new Date(NOW.getTime() + 20 * ONE_DAY);
            const user = mockUser(3, expiry, 'standard');
            const scheme = mockScheme(0, 'topup', 0, 500); // 500 pts, 0 days

            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(3); // Unchanged
            expect(res.membershipData['membership.expire_at']).toBeUndefined(); // NOTE: Updated logic returns undefined/null if no time added
            expect(res.pointsToAdd).toBe(500);
        });

        test('6.2 Active Standard buys Time Pack (Extension)', () => {
            const expiry = new Date(NOW.getTime() + 5 * ONE_DAY);
            const user = mockUser(3, expiry, 'standard');
            const scheme = mockScheme(0, 'topup', 7, 0); // 7 days, 0 pts

            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.membershipData['membership.level']).toBe(3);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 12 * ONE_DAY));
        });

        test('6.3 Active Standard buys Combo Pack (Time + Points)', () => {
            const expiry = new Date(NOW.getTime() + 5 * ONE_DAY);
            const user = mockUser(3, expiry, 'standard');
            const scheme = mockScheme(0, 'topup', 10, 100); 

            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            expect(res.pointsToAdd).toBe(100);
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 15 * ONE_DAY));
        });

        test('6.4 Expired User buys Time Topup', () => {
            const expiry = new Date(NOW.getTime() - 10 * ONE_DAY);
            const user = mockUser(3, expiry);
            const scheme = mockScheme(0, 'topup', 7, 0);

            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);

            // Should start from NOW
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 7 * ONE_DAY));
        });
    });

    // ==========================================
    // Category 7: Pricing Engine
    // ==========================================
    describe('Category 7: Pricing Engine', () => {
        // Mock Schemes for Pricing
        const sLevel2 = mockScheme(2, 'sprint', 7, 0, 30);
        const sLevel3 = mockScheme(3, 'standard', 30, 0, 100);
        const sLevel4 = mockScheme(4, 'premium', 30, 0, 200);

        test('7.1 New User pays Full Price', () => {
            const user = mockUser(0, null);
            const { payAmount, orderType } = MembershipDomainService.calculatePrice(user, sLevel3, undefined);
            expect(payAmount).toBe(100);
            expect(orderType).toBe('standard');
        });

        test('7.2 Active Renewal pays Full Price', () => {
            const user = mockUser(3, new Date(NOW.getTime() + ONE_DAY));
            const { payAmount, orderType } = MembershipDomainService.calculatePrice(user, sLevel3, sLevel3);
            expect(payAmount).toBe(100);
            expect(orderType).toBe('standard'); // Not 'upgrade'
        });

        test('7.3 Level 2 upgrading to Level 3 (Pay Difference)', () => {
            const user = mockUser(2, new Date(NOW.getTime() + ONE_DAY));
            // Target: 100, Current Value: 30. Diff: 70
            const { payAmount, orderType } = MembershipDomainService.calculatePrice(user, sLevel3, sLevel2);
            expect(payAmount).toBe(70);
            expect(orderType).toBe('upgrade');
        });

        test('7.4 Level 3 upgrading to Level 4 (Pay Difference)', () => {
            const user = mockUser(3, new Date(NOW.getTime() + ONE_DAY));
            // Target: 200, Current Value: 100. Diff: 100
            const { payAmount } = MembershipDomainService.calculatePrice(user, sLevel4, sLevel3);
            expect(payAmount).toBe(100);
        });

        test('7.5 Upgrade Price Floor (High value current scheme)', () => {
            const user = mockUser(3, new Date(NOW.getTime() + ONE_DAY));
            
            const cheapTarget = mockScheme(4, 'promo', 30, 0, 50); // Target price 50
            const expensiveCurrent = mockScheme(3, 'standard', 30, 0, 100); // Current val 100
            
            // 50 - 100 = -50. Should floor to 1.
            const { payAmount } = MembershipDomainService.calculatePrice(user, cheapTarget, expensiveCurrent);
            expect(payAmount).toBe(1);
        });

        test('7.6 Topup is always full price', () => {
            const user = mockUser(4, new Date(NOW.getTime() + ONE_DAY));
            const topup = mockScheme(5, 'topup', 0, 100, 50);
            const current = sLevel4; // 200

            const { payAmount } = MembershipDomainService.calculatePrice(user, topup, current);
            expect(payAmount).toBe(50); // No deduction for topups
        });

        test('7.7 Expired User pays Full Price even if upgrading level', () => {
            const user = mockUser(2, new Date(NOW.getTime() - ONE_DAY)); // Expired
            // Expired users don't get 'Upgrade' discounts usually, they just resubscribe
            const { payAmount } = MembershipDomainService.calculatePrice(user, sLevel3, sLevel2);
            
            // Logic check: isMemberActive is false.
            expect(payAmount).toBe(100); 
        });
    });

    // ==========================================
    // Category 8: Edge Cases & Boundaries
    // ==========================================
    describe('Category 8: Edge Cases', () => {
        test('8.1 DB Fallback: Scheme uses "duration_days" instead of "days"', () => {
            const user = mockUser(0, null);
            const scheme: any = { level: 3, type: 'standard', duration_days: 15, price: 50 }; // Old DB format
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);
            
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 15 * ONE_DAY));
        });

        test('8.2 DB Fallback: Scheme missing all days fields (Defaults to 30)', () => {
            const user = mockUser(0, null);
            const scheme: any = { level: 3, type: 'standard', price: 50 }; 
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);
            
            expect(res.membershipData['membership.expire_at']).toEqual(new Date(NOW.getTime() + 30 * ONE_DAY));
        });

        test('8.3 Zero duration topup checks explicit falsy values', () => {
            const user = mockUser(3, new Date(NOW.getTime() + ONE_DAY));
            const scheme: any = { level: 3, type: 'topup', days: 0, points: 10 };
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);
            
            // explicit days=0 should result in NO expiry update (undefined in result)
            // The service returns the key only if not null. 
            expect(res.membershipData['membership.expire_at']).toBeUndefined();
        });

        test('8.4 Very short duration (1 second)', () => {
            const user = mockUser(0, null);
            const scheme: any = { level: 1, type: 'trial', days: 1 / (24*60*60) }; // 1 second
            const res = MembershipDomainService.calculateNewState(user, scheme, NOW);
            
            // Should be approx NOW + 1000ms
            const expiryVal = res.membershipData['membership.expire_at'];
            expect(expiryVal).toBeDefined();
            const expiry = new Date(expiryVal!);
            expect(expiry.getTime()).toBeCloseTo(NOW.getTime() + 1000, -2); // within 100ms
        });
    });
});

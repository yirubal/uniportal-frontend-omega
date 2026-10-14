const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Single source of truth for premium access, matching the backend `Student.is_premium` rule:
 * premium status AND a non-null subscription_expiry in the future. A null expiry is not premium.
 */
export function hasActiveSubscriptionExpiry(subscriptionExpiry: string | null | undefined, now = Date.now()): boolean {
    if (!subscriptionExpiry) return false;

    const expiryTime = new Date(subscriptionExpiry).getTime();
    return Number.isFinite(expiryTime) && expiryTime > now;
}

export interface SubscriptionAccess {
    isPremium: boolean;
    /** Whole days left, rounded up. 0 when not premium. */
    daysRemaining: number;
}

export function getSubscriptionAccess(
    student: { is_premium: boolean; subscription_expiry: string | null } | null | undefined,
    now = Date.now()
): SubscriptionAccess {
    const expiry = student?.subscription_expiry;
    const isPremium = Boolean(student?.is_premium && hasActiveSubscriptionExpiry(expiry, now));

    if (!isPremium || !expiry) {
        return { isPremium: false, daysRemaining: 0 };
    }

    return {
        isPremium,
        // At least 1 while active, so a subscription with hours left never reads as "Expires today" (0).
        daysRemaining: Math.max(1, Math.ceil((new Date(expiry).getTime() - now) / DAY_MS)),
    };
}

import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type SubscriptionInfo = {
  plan: string;
  isActive: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

/**
 * Check the current subscription status for an organization.
 * Returns the plan, active status, and period end date.
 */
export async function checkSubscription(orgId: string): Promise<SubscriptionInfo> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
    },
  });

  if (!org) {
    return {
      plan: 'free',
      isActive: false,
      subscriptionStatus: null,
      currentPeriodEnd: null,
    };
  }

  const isActive =
    org.plan !== 'free' &&
    org.subscriptionStatus === 'active' &&
    (org.currentPeriodEnd ? new Date(org.currentPeriodEnd) > new Date() : true);

  return {
    plan: org.plan,
    isActive,
    subscriptionStatus: org.subscriptionStatus,
    currentPeriodEnd: org.currentPeriodEnd,
  };
}

export type SubscriptionLimits = {
  isTrialExpired: boolean;
  canAccessManufactura: boolean;
  daysLeft: number;
};

/**
 * Validates subscription limits and trial status for a given organization object.
 */
export function checkSubscriptionLimits(organization: {
  plan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
}): SubscriptionLimits {
  const now = new Date();
  const periodEnd = organization.currentPeriodEnd ? new Date(organization.currentPeriodEnd) : null;
  
  // Trial is expired if it's 'trialing' or 'past_due' AND we are past the end date
  const isTrialExpired = 
    (organization.subscriptionStatus === 'trialing' || organization.subscriptionStatus === 'past_due') &&
    (periodEnd ? now > periodEnd : false);

  const canAccessManufactura = organization.plan === 'manufactura';

  // Calculate days left (0 if already passed or not trialing)
  let daysLeft = 0;
  if (periodEnd && organization.subscriptionStatus === 'trialing') {
    const diffTime = periodEnd.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    isTrialExpired,
    canAccessManufactura,
    daysLeft: Math.max(0, daysLeft),
  };
}

/**
 * Check if an organization has access to a specific plan level.
 * Plan hierarchy: manufactura > pro > free
 */
export function hasAccess(currentPlan: string, requiredPlan: string): boolean {
  const planHierarchy: Record<string, number> = {
    free: 0,
    pro: 1,
    manufactura: 2,
  };

  const current = planHierarchy[currentPlan] ?? 0;
  const required = planHierarchy[requiredPlan] ?? 0;

  return current >= required;
}

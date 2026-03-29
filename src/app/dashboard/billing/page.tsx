import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { memberships } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkSubscription } from '@/lib/subscription';
import { BillingClient } from './billing-client';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userMembership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
    with: { organization: true },
  });

  if (!userMembership) {
    redirect('/onboarding');
  }

  const subscription = await checkSubscription(userMembership.organizationId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planes y Facturación</h1>
        <p className="text-muted-foreground mt-1">
          Administra tu suscripción y elige el plan que mejor se adapte a tu negocio.
        </p>
      </div>

      <BillingClient
        organizationId={userMembership.organizationId}
        currentPlan={subscription.plan}
        subscriptionStatus={subscription.subscriptionStatus}
        currentPeriodEnd={subscription.currentPeriodEnd?.toISOString() ?? null}
        isTrialExpired={subscription.subscriptionStatus === 'trialing' && subscription.currentPeriodEnd ? new Date() > new Date(subscription.currentPeriodEnd) : false}
      />
    </div>
  );
}

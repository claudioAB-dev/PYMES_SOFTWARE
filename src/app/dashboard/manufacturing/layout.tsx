import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { memberships } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkSubscription, hasAccess } from '@/lib/subscription';

export default async function ManufacturingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Get user's active organization
  const userMembership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
    with: { organization: true },
  });

  if (!userMembership) {
    redirect('/onboarding');
  }

  // 3. Check subscription plan
  const { checkSubscriptionLimits } = await import('@/lib/subscription');
  const { canAccessManufactura } = checkSubscriptionLimits(userMembership.organization);

  if (!canAccessManufactura) {
    redirect('/dashboard/billing?upgrade=manufactura');
  }

  return <>{children}</>;
}

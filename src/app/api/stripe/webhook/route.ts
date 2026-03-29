import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

// Map Stripe Price IDs to plan names.
// Replace these with your actual Stripe Price IDs from your dashboard.
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  // We use the same env var defined in the PlanTab
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_MANUFACTURA || 'price_123456789']: 'manufactura',
};

// Disable Next.js body parsing — Stripe needs the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[STRIPE_WEBHOOK_SIGNATURE_ERROR] ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // ─── New subscription created via Checkout ───────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== 'subscription') break;

        const organizationId = session.metadata?.organizationId;
        if (!organizationId) {
          console.error('[STRIPE_WEBHOOK] Missing organizationId in session metadata');
          break;
        }

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN_MAP[priceId] || 'manufactura'; // Fallback to manufactura if unknown in this specific flow for Axioma

        await db
          .update(organizations)
          .set({
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: session.customer as string,
            stripePriceId: priceId,
            plan: plan,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: new Date((subscription.items.data[0]?.current_period_end ?? 0) * 1000),
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, organizationId));

        console.log(`[STRIPE_WEBHOOK] Organization ${organizationId} upgraded to plan: ${plan}`);
        break;
      }

      // ─── Recurring payment succeeded (renewal) ──────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        // Only handle subscription renewals, not the first payment
        if (invoice.billing_reason !== 'subscription_cycle') break;

        const subscriptionId = (invoice as any).subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN_MAP[priceId] || 'manufactura';

        // Find organization by subscription ID
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.stripeSubscriptionId, subscriptionId),
        });

        if (!org) {
          console.error(`[STRIPE_WEBHOOK] No org found for subscription ${subscriptionId}`);
          break;
        }

        await db
          .update(organizations)
          .set({
            subscriptionStatus: 'active',
            stripePriceId: priceId,
            plan: plan,
            currentPeriodEnd: new Date((subscription.items.data[0]?.current_period_end ?? 0) * 1000),
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, org.id));

        console.log(`[STRIPE_WEBHOOK] Renewed subscription for org ${org.id}`);
        break;
      }

      // ─── Subscription status changes (past_due, canceled, etc.) ─
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        const org = await db.query.organizations.findFirst({
          where: eq(organizations.stripeSubscriptionId, subscriptionId),
        });

        if (!org) {
          console.error(`[STRIPE_WEBHOOK] No org found for subscription ${subscriptionId}`);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN_MAP[priceId] || org.plan;

        await db
          .update(organizations)
          .set({
            subscriptionStatus: subscription.status,
            stripePriceId: priceId,
            plan: subscription.status === 'active' ? plan : org.plan,
            currentPeriodEnd: new Date((subscription.items.data[0]?.current_period_end ?? 0) * 1000),
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, org.id));

        console.log(`[STRIPE_WEBHOOK] Subscription ${subscriptionId} status → ${subscription.status}`);
        break;
      }

      // ─── Subscription deleted ────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        const org = await db.query.organizations.findFirst({
          where: eq(organizations.stripeSubscriptionId, subscriptionId),
        });

        if (!org) break;

        await db
          .update(organizations)
          .set({
            plan: 'free',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
            stripePriceId: null,
            currentPeriodEnd: null,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, org.id));

        console.log(`[STRIPE_WEBHOOK] Subscription canceled for org ${org.id}, reverted to free`);
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[STRIPE_WEBHOOK_HANDLER_ERROR]', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

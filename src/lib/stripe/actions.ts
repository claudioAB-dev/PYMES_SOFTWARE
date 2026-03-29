'use server';

import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function createCheckoutSession(organizationId: string, priceId: string) {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: {
          organizationId: org.id,
        },
      });
      customerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId: customerId })
        .where(eq(organizations.id, org.id));
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?checkout_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?checkout_canceled=true`,
      metadata: {
        organizationId: org.id,
      },
      subscription_data: {
        metadata: {
          organizationId: org.id,
        },
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }

    return { url: session.url };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return { error: error.message };
  }
}

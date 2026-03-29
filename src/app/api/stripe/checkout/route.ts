import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { organizations, memberships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parse request body
    const { priceId, organizationId } = await request.json();

    if (!priceId || !organizationId) {
      return NextResponse.json(
        { error: 'priceId y organizationId son requeridos' },
        { status: 400 }
      );
    }

    // 3. Verify user belongs to this organization
    const membership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, user.id),
        eq(memberships.organizationId, organizationId)
      ),
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No perteneces a esta organización' },
        { status: 403 }
      );
    }

    // 4. Get or create Stripe customer
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    let stripeCustomerId = org.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        email: user.email,
        metadata: {
          organizationId: org.id,
        },
      });

      stripeCustomerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
        .where(eq(organizations.id, organizationId));
    }

    // 5. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        organizationId: organizationId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Error interno al crear la sesión de checkout' },
      { status: 500 }
    );
  }
}

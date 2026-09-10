import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, TIERS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const checkoutSchema = z.object({
  tierName: z.enum(["STARTER", "GROWTH", "SCALE"]),
});

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tier = TIERS.find((t) => t.name === parsed.data.tierName);
  if (!tier || !tier.priceId) {
    return NextResponse.json({ error: "That plan isn't purchasable" }, { status: 400 });
  }

  // Create a Stripe Customer for this org the first time they check out.
  let customerId = staff.organization.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: staff.email,
      name: staff.organization.name,
      metadata: { organizationId: staff.organizationId },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: staff.organizationId },
      data: { stripeCustomerId: customerId },
    });
  }

  // If they already have an active subscription, switch its price instead
  // of starting a second, separate subscription (which would double-bill).
  const existingSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });
  const existingSub = existingSubs.data[0];

  if (existingSub) {
    await stripe.subscriptions.update(existingSub.id, {
      items: [{ id: existingSub.items.data[0].id, price: tier.priceId }],
      proration_behavior: "create_prorations",
    });
    await prisma.organization.update({
      where: { id: staff.organizationId },
      data: { subscriptionTier: tier.name },
    });
    // No Checkout needed — payment method is already on file. Send them
    // straight back with a success flag.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json({ url: `${appUrl}/dashboard/billing?success=true` });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: tier.priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
    metadata: { organizationId: staff.organizationId },
  });

  return NextResponse.json({ url: session.url });
}

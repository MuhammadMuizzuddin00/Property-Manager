import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, TIERS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Stripe needs the RAW request body to verify the webhook signature — do
// not call req.json() anywhere in this route before constructEvent runs.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // Checkout finished — make sure the Customer id is saved (belt-and-braces;
    // it's usually already set from the checkout route, but this covers
    // cases like Stripe-hosted upgrade links created outside our own flow).
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      if (organizationId && session.customer) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: { stripeCustomerId: session.customer as string },
        });
      }
      break;
    }

    // Subscription created, upgraded, downgraded, or cancelled — Stripe is
    // the source of truth here, so mirror whatever it reports.
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (!org) break;

      if (event.type === "customer.subscription.deleted") {
        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionTier: "FREE" },
        });
        break;
      }

      const priceId = subscription.items.data[0]?.price?.id;
      const matchedTier = TIERS.find((t) => t.priceId === priceId);
      if (matchedTier) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionTier: matchedTier.name },
        });
      }
      break;
    }

    default:
      // Ignore other event types.
      break;
  }

  return NextResponse.json({ received: true });
}

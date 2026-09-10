import Stripe from "stripe";
import { prisma } from "./prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Each plan's property limit and matching Stripe Price. Adjust prices to
// your model. Create matching Prices in the Stripe Dashboard and paste the
// IDs below. NOTE: subscriptionTier is now driven by what the org actually
// subscribes to (via Stripe Checkout + webhook) — maxProperties here is
// only used to ENFORCE a limit, not to auto-pick a tier by property count.
export const TIERS = [
  { name: "FREE", maxProperties: 2, priceId: null },
  { name: "STARTER", maxProperties: 10, priceId: "price_xxx_starter" },
  { name: "GROWTH", maxProperties: 50, priceId: "price_xxx_growth" },
  { name: "SCALE", maxProperties: Infinity, priceId: "price_xxx_scale" },
] as const;

export function tierForPropertyCount(count: number) {
  return TIERS.find((t) => count <= t.maxProperties) ?? TIERS[TIERS.length - 1];
}

// Call this before creating a new property, to enforce the org's current
// plan limit. Does NOT change subscriptionTier — Stripe (via the webhook)
// is the only thing allowed to change what plan an org is on.
export async function assertCanAddProperty(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const tier = TIERS.find((t) => t.name === org.subscriptionTier) ?? TIERS[0];
  const currentCount = await prisma.property.count({
    where: { organizationId, archived: false },
  });

  if (currentCount >= tier.maxProperties) {
    return {
      allowed: false as const,
      message: `You've reached the ${tier.maxProperties}-property limit on your ${tier.name} plan. Upgrade on the Billing page to add more.`,
    };
  }

  return { allowed: true as const };
}

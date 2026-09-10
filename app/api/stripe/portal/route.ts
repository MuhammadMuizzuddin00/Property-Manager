import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentStaffUser } from "@/lib/auth";

export async function POST() {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!staff.organization.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account yet — subscribe to a plan first." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: staff.organization.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";
import { sendBankTransferRequestEmail } from "@/lib/email";

const requestSchema = z.object({
  tierName: z.enum(["STARTER", "GROWTH", "SCALE"]),
});

function generateReference() {
  return `PM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (staff.organization.pendingPlanRequest) {
    return NextResponse.json(
      {
        error: `You already have a pending request for ${staff.organization.pendingPlanRequest} (ref ${staff.organization.pendingPlanReference}). Wait for that to be approved, or contact support.`,
      },
      { status: 409 }
    );
  }

  const reference = generateReference();

  await prisma.organization.update({
    where: { id: staff.organizationId },
    data: {
      pendingPlanRequest: parsed.data.tierName,
      pendingPlanReference: reference,
      pendingPlanRequestedAt: new Date(),
    },
  });

  await sendBankTransferRequestEmail({
    organizationName: staff.organization.name,
    requesterEmail: staff.email,
    tierName: parsed.data.tierName,
    reference,
  });

  return NextResponse.json({ reference });
}

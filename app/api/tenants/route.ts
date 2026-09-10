import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const createTenantSchema = z.object({
  unitId: z.string(),
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  leaseStart: z.coerce.date(),
  leaseEnd: z.coerce.date().optional(),
});

async function assertUnitBelongsToOrg(unitId: string, organizationId: string) {
  return prisma.unit.findFirst({
    where: { id: unitId, property: { organizationId } },
  });
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = createTenantSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const unit = await assertUnitBelongsToOrg(parsed.data.unitId, staff.organizationId);
  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  const tenant = await prisma.tenant.create({ data: parsed.data });

  // Invite the tenant to the portal by email. Clerk sends the invite email
  // itself — no email service of our own required. If this fails (e.g. the
  // email already has a Clerk account, or is already invited), we don't
  // fail tenant creation — staff can resend later once that flow exists.
  let inviteStatus: "sent" | "skipped" | "failed" = "skipped";
  if (parsed.data.email) {
    try {
      const client = await clerkClient();
      await client.invitations.createInvitation({
        emailAddress: parsed.data.email,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/portal`,
        ignoreExisting: true,
      });
      inviteStatus = "sent";
    } catch (err) {
      console.error("Failed to send tenant invite:", err);
      inviteStatus = "failed";
    }
  }

  return NextResponse.json({ tenant, inviteStatus }, { status: 201 });
}

// Lists every tenant across the org, with property/unit context for display.
export async function GET() {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const tenants = await prisma.tenant.findMany({
    where: { unit: { property: { organizationId: staff.organizationId } } },
    include: {
      unit: { include: { property: true } },
    },
    orderBy: { leaseStart: "desc" },
  });

  return NextResponse.json({ tenants });
}

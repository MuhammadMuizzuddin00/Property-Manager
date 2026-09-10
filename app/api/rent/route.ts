import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const createPaymentSchema = z.object({
  tenantId: z.string(),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
});

const updatePaymentSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "PAID", "LATE", "PARTIAL"]),
  paidDate: z.coerce.date().optional(),
});

async function assertTenantBelongsToOrg(tenantId: string, organizationId: string) {
  return prisma.tenant.findFirst({
    where: { id: tenantId, unit: { property: { organizationId } } },
  });
}

// Staff schedules a rent payment (e.g. this month's due amount) for a tenant.
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = createPaymentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tenant = await assertTenantBelongsToOrg(parsed.data.tenantId, staff.organizationId);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const payment = await prisma.rentPayment.create({ data: parsed.data });
  return NextResponse.json({ payment }, { status: 201 });
}

// Lists every rent payment across the org, newest due date first.
// Also self-heals: any PENDING payment whose due date has passed gets
// flipped to LATE right here, so the status is always accurate without
// needing a cron job for local development. (The /api/cron/check-overdue
// route does the same thing org-wide for production scheduling.)
export async function GET(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await prisma.rentPayment.updateMany({
    where: {
      status: "PENDING",
      dueDate: { lt: new Date() },
      tenant: { unit: { property: { organizationId: staff.organizationId } } },
    },
    data: { status: "LATE" },
  });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  const payments = await prisma.rentPayment.findMany({
    where: {
      tenant: { unit: { property: { organizationId: staff.organizationId } } },
      status: status as any,
    },
    include: {
      tenant: { include: { unit: { include: { property: true } } } },
    },
    orderBy: { dueDate: "desc" },
  });

  return NextResponse.json({ payments });
}

// Mark a payment as PAID (or any other status change), e.g. when rent comes in
// via bank transfer/check and staff records it manually.
export async function PATCH(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = updatePaymentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.rentPayment.findFirst({
    where: {
      id: parsed.data.id,
      tenant: { unit: { property: { organizationId: staff.organizationId } } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const updated = await prisma.rentPayment.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      paidDate:
        parsed.data.status === "PAID" ? parsed.data.paidDate ?? new Date() : existing.paidDate,
    },
  });

  return NextResponse.json({ payment: updated });
}

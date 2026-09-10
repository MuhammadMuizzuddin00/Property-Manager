import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  leaseStart: z.coerce.date().optional(),
  leaseEnd: z.coerce.date().nullable().optional(),
});

async function getOwnedTenant(id: string, organizationId: string) {
  return prisma.tenant.findFirst({
    where: { id, unit: { property: { organizationId } } },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaffUser();
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const tenant = await getOwnedTenant(id, staff.organizationId);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.tenant.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ tenant: updated });
}

// "Delete" here means ending the tenancy (active = false), not a hard
// delete — this preserves rent payment and maintenance history, and frees
// up the unit to show as vacant again. A true hard delete would fail or
// destroy that history for any tenant with existing records.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaffUser();
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const tenant = await getOwnedTenant(id, staff.organizationId);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const updated = await prisma.tenant.update({
    where: { id },
    data: { active: false, leaseEnd: tenant.leaseEnd ?? new Date() },
  });

  return NextResponse.json({ tenant: updated });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  monthlyRent: z.number().positive().optional(),
  archived: z.boolean().optional(), // used for archive/unarchive
});

async function getOwnedUnit(id: string, organizationId: string) {
  return prisma.unit.findFirst({
    where: { id, property: { organizationId } },
    include: { tenants: { where: { active: true } } },
  });
}

// Also used to archive/unarchive a unit — just pass { archived: true/false }.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaffUser();
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const unit = await getOwnedUnit(id, staff.organizationId);
  if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.archived === true && unit.tenants.length > 0) {
    return NextResponse.json(
      { error: "This unit has an active tenant. End their tenancy before archiving the unit." },
      { status: 400 }
    );
  }

  const updated = await prisma.unit.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ unit: updated });
}

// Hard-deletes a unit — but ONLY if it has zero history (no tenants ever
// assigned, no maintenance requests). Units with history can't be
// hard-deleted without losing that record; archive them instead via PATCH.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaffUser();
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const unit = await getOwnedUnit(id, staff.organizationId);
  if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

  if (unit.tenants.length > 0) {
    return NextResponse.json(
      { error: "This unit has an active tenant. End their tenancy before deleting the unit." },
      { status: 400 }
    );
  }

  const tenantHistoryCount = await prisma.tenant.count({ where: { unitId: id } });
  const maintenanceCount = await prisma.maintenanceRequest.count({ where: { unitId: id } });
  if (tenantHistoryCount > 0 || maintenanceCount > 0) {
    return NextResponse.json(
      {
        error:
          "This unit has history (past tenants, rent payments, and/or maintenance records) and can't be permanently deleted. Archive it instead to hide it while keeping the record.",
      },
      { status: 409 }
    );
  }

  await prisma.unit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

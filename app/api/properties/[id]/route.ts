import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  addressLine1: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  archived: z.boolean().optional(), // used for archive/unarchive (e.g. property sold)
});

async function getOwnedProperty(id: string, organizationId: string) {
  return prisma.property.findFirst({ where: { id, organizationId } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaffUser();
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const property = await getOwnedProperty(id, staff.organizationId);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  return NextResponse.json({ property });
}

// Also used to archive/unarchive a property — pass { archived: true/false }.
// Archiving is how you handle a sold or no-longer-managed property: it's
// hidden from the active list and stops counting toward your plan limit,
// but its Units/Tenants/RentPayment/MaintenanceRequest history is kept.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaffUser();
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const property = await getOwnedProperty(id, staff.organizationId);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.archived === true) {
    const activeTenantCount = await prisma.tenant.count({
      where: { unit: { propertyId: id }, active: true },
    });
    if (activeTenantCount > 0) {
      return NextResponse.json(
        {
          error: `This property still has ${activeTenantCount} active tenant(s). End their tenancy first before archiving.`,
        },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.property.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ property: updated });
}

// Hard-deletes a property — but ONLY if it has zero units left (archived or
// not). A property with any unit history can't be hard-deleted without
// losing that record; archive it instead via PATCH (e.g. when it's sold).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaffUser();
  if (!staff) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const property = await getOwnedProperty(id, staff.organizationId);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const unitCount = await prisma.unit.count({ where: { propertyId: id } });
  if (unitCount > 0) {
    return NextResponse.json(
      {
        error: `This property still has ${unitCount} unit(s) on record (including archived ones) and can't be permanently deleted. Archive it instead — for example when it's been sold.`,
      },
      { status: 409 }
    );
  }

  await prisma.property.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

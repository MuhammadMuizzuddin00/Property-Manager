import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const createUnitSchema = z.object({
  propertyId: z.string(),
  label: z.string().min(1),
  bedrooms: z.number().int().min(0).default(1),
  bathrooms: z.number().min(0).default(1),
  monthlyRent: z.number().positive(),
});

// Verifies the property belongs to the logged-in staff user's org.
// Never trust a propertyId alone — always check ownership first.
async function assertPropertyBelongsToOrg(propertyId: string, organizationId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, organizationId },
  });
  return property;
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = createUnitSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const property = await assertPropertyBelongsToOrg(parsed.data.propertyId, staff.organizationId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const unit = await prisma.unit.create({ data: parsed.data });
  return NextResponse.json({ unit }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const propertyId = req.nextUrl.searchParams.get("propertyId");
  const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";

  if (propertyId) {
    const property = await assertPropertyBelongsToOrg(propertyId, staff.organizationId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    const units = await prisma.unit.findMany({
      where: { propertyId, archived: includeArchived ? undefined : false },
      include: {
        tenants: { where: { active: true } },
        _count: { select: { tenants: true, maintenance: true } },
      },
      orderBy: { label: "asc" },
    });
    return NextResponse.json({ units });
  }

  // No propertyId given — return every non-archived unit across the org
  // (e.g. for a tenant form dropdown — archived units shouldn't be assignable).
  const units = await prisma.unit.findMany({
    where: { property: { organizationId: staff.organizationId }, archived: false },
    include: { property: true, tenants: { where: { active: true } } },
  });
  return NextResponse.json({ units });
}

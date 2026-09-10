import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const createRequestSchema = z.object({
  unitId: z.string(),
  tenantId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  photoUrls: z.array(z.string().url()).optional(),
});

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]),
});

async function assertUnitBelongsToOrg(unitId: string, organizationId: string) {
  return prisma.unit.findFirst({
    where: { id: unitId, property: { organizationId } },
  });
}

// Staff logging a request on a tenant's behalf.
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = createRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const unit = await assertUnitBelongsToOrg(parsed.data.unitId, staff.organizationId);
  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  const request = await prisma.maintenanceRequest.create({
    data: { ...parsed.data, submittedBy: "STAFF" },
  });
  return NextResponse.json({ request }, { status: 201 });
}

// Lists every maintenance request across the org (staff view), newest first.
export async function GET(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  const requests = await prisma.maintenanceRequest.findMany({
    where: {
      unit: { property: { organizationId: staff.organizationId } },
      status: status as any,
    },
    include: {
      unit: { include: { property: true } },
      tenant: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

// Staff updates a request's status (e.g. mark as IN_PROGRESS or DONE).
export async function PATCH(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = updateStatusSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Confirm this request belongs to the staff member's org before touching it.
  const existing = await prisma.maintenanceRequest.findFirst({
    where: {
      id: parsed.data.id,
      unit: { property: { organizationId: staff.organizationId } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      resolvedAt: parsed.data.status === "DONE" ? new Date() : existing.resolvedAt,
    },
  });

  return NextResponse.json({ request: updated });
}

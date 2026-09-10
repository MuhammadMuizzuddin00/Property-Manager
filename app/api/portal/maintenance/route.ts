import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/auth";

const createRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  photoUrls: z.array(z.string().url()).optional(),
});

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Not signed in as a tenant" }, { status: 401 });
  }

  const parsed = createRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const request = await prisma.maintenanceRequest.create({
    data: {
      ...parsed.data,
      unitId: tenant.unitId,
      tenantId: tenant.id,
      submittedBy: "TENANT",
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}

// Tenant sees only requests for their own unit, staff or tenant submitted.
export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Not signed in as a tenant" }, { status: 401 });
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where: { unitId: tenant.unitId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

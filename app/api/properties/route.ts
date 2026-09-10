import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertCanAddProperty } from "@/lib/stripe";
import { getCurrentStaffUser } from "@/lib/auth";

const createPropertySchema = z.object({
  name: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = createPropertySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const limitCheck = await assertCanAddProperty(staff.organizationId);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.message }, { status: 402 });
  }

  const property = await prisma.property.create({
    data: { ...parsed.data, organizationId: staff.organizationId },
  });

  return NextResponse.json({ property }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";

  const properties = await prisma.property.findMany({
    where: { organizationId: staff.organizationId, archived: includeArchived ? undefined : false },
    include: { units: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ properties });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await isPlatformAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const requests = await prisma.organization.findMany({
    where: { pendingPlanRequest: { not: null } },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      pendingPlanRequest: true,
      pendingPlanReference: true,
      pendingPlanRequestedAt: true,
      users: { select: { email: true }, where: { role: "OWNER" }, take: 1 },
    },
    orderBy: { pendingPlanRequestedAt: "asc" },
  });

  return NextResponse.json({ requests });
}

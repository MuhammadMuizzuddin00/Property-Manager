import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/auth";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isPlatformAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org || !org.pendingPlanRequest) {
    return NextResponse.json({ error: "No pending request found" }, { status: 404 });
  }

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      subscriptionTier: parsed.data.action === "approve" ? org.pendingPlanRequest : org.subscriptionTier,
      pendingPlanRequest: null,
      pendingPlanReference: null,
      pendingPlanRequestedAt: null,
    },
  });

  return NextResponse.json({ organization: updated });
}

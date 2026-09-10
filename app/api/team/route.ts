import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStaffUser } from "@/lib/auth";

const inviteSchema = z.object({
  email: z.string().email(),
});

// List everyone in the current staff user's Organization.
export async function GET() {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const members = await prisma.user.findMany({
    where: { organizationId: staff.organizationId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}

// Invite a teammate to join the SAME Organization as the inviter. Sets
// invitedOrganizationId in the invitee's Clerk publicMetadata, which
// getCurrentStaffUser() checks on their first dashboard visit to join
// them to this org instead of creating a brand new one.
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = inviteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const client = await clerkClient();

  try {
    await client.invitations.createInvitation({
      emailAddress: parsed.data.email,
      redirectUrl: `${appUrl}/dashboard`,
      publicMetadata: { invitedOrganizationId: staff.organizationId },
      ignoreExisting: true,
    });
  } catch (err) {
    console.error("Failed to send team invite:", err);
    return NextResponse.json({ error: "Couldn't send that invite. Try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

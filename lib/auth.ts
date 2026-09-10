import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

// Looks up the staff User + Organization tied to the logged-in Clerk user.
// If this is the first time this Clerk user has reached the dashboard,
// provisions a new Organization + User for them automatically.
// Use this at the top of every dashboard page/route — never trust an
// organizationId passed from the client.
export async function getCurrentStaffUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findFirst({
    where: { id: userId },
    include: { organization: true },
  });

  if (user) return user;

  // Safety check: don't provision a staff Organization for someone who
  // signed up through the tenant flow and is linked to a Tenant record.
  const existingTenant = await prisma.tenant.findFirst({ where: { clerkUserId: userId } });
  if (existingTenant) return null;

  // First visit — create an Organization + User for this Clerk account,
  // UNLESS they were invited to join an existing Organization (staff invite
  // flow sets invitedOrganizationId in their Clerk publicMetadata — see
  // app/api/team/route.ts).
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || undefined;

  const invitedOrganizationId = clerkUser.publicMetadata?.invitedOrganizationId as
    | string
    | undefined;

  if (invitedOrganizationId) {
    const org = await prisma.organization.findUnique({ where: { id: invitedOrganizationId } });
    if (org) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          name,
          role: "MANAGER",
          organizationId: org.id,
        },
        include: { organization: true },
      });
      return user;
    }
    // Fall through to creating a new Organization if the invited org
    // somehow no longer exists.
  }

  const organization = await prisma.organization.create({
    data: { name: name ? `${name}'s Organization` : "My Organization" },
  });

  user = await prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      role: "OWNER",
      organizationId: organization.id,
    },
    include: { organization: true },
  });

  return user;
}

// Looks up the Tenant record tied to the logged-in Clerk user.
// If this Clerk account isn't linked yet (first login after accepting an
// invite), auto-links it by matching the Clerk account's email against an
// unlinked Tenant row created by staff. Use this in every tenant portal
// route — never trust a tenantId/unitId passed from the client.
export async function getCurrentTenant() {
  const { userId } = await auth();
  if (!userId) return null;

  let tenant = await prisma.tenant.findFirst({ where: { clerkUserId: userId } });
  if (tenant) return tenant;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const unlinkedTenant = await prisma.tenant.findFirst({
    where: { email, clerkUserId: null },
  });
  if (!unlinkedTenant) return null;

  tenant = await prisma.tenant.update({
    where: { id: unlinkedTenant.id },
    data: { clerkUserId: userId },
  });

  return tenant;
}

// Checks if the logged-in Clerk user is the platform admin (you, the app
// owner) — used to gate the /admin/requests page that approves manual
// bank-transfer plan requests. Set ADMIN_EMAIL in your env to your own
// email address.
export async function isPlatformAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  if (!process.env.ADMIN_EMAIL) return false;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress;

  return email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
}

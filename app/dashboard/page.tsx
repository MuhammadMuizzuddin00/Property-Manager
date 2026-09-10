import { getCurrentStaffUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Home, AlertTriangle, Clock } from "lucide-react";
import RentTrendChart from "./rent-trend-chart";
import PropertyThumbnail from "./property-thumbnail";

export default async function DashboardOverview() {
  const staff = await getCurrentStaffUser();

  if (!staff) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-800">
        This account isn&apos;t set up as a staff (landlord/manager) account.
        If you&apos;re a tenant, use the{" "}
        <a href="/portal" className="underline">
          tenant portal
        </a>{" "}
        instead.
      </div>
    );
  }

  // Self-heal overdue rent right here too, same as the /api/rent GET route,
  // so the "overdue" total below is always accurate even if staff never
  // opens the Rent page first.
  await prisma.rentPayment.updateMany({
    where: {
      status: "PENDING",
      dueDate: { lt: new Date() },
      tenant: { unit: { property: { organizationId: staff.organizationId } } },
    },
    data: { status: "LATE" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    collectedThisMonth,
    overduePayments,
    unitCount,
    occupiedUnitCount,
    recentPaidPayments,
    properties,
    openRequests,
    inProgressRequests,
    doneRequests,
    leasesEndingSoon,
  ] = await Promise.all([
    prisma.rentPayment.aggregate({
      _sum: { amount: true },
      where: {
        status: "PAID",
        paidDate: { gte: startOfMonth },
        tenant: { unit: { property: { organizationId: staff.organizationId } } },
      },
    }),
    prisma.rentPayment.findMany({
      where: {
        status: "LATE",
        tenant: { unit: { property: { organizationId: staff.organizationId } } },
      },
      select: { amount: true },
    }),
    prisma.unit.count({
      where: { archived: false, property: { organizationId: staff.organizationId } },
    }),
    prisma.unit.count({
      where: {
        archived: false,
        property: { organizationId: staff.organizationId },
        tenants: { some: { active: true } },
      },
    }),
    prisma.rentPayment.findMany({
      where: {
        status: "PAID",
        paidDate: { gte: sixMonthsAgo },
        tenant: { unit: { property: { organizationId: staff.organizationId } } },
      },
      select: { amount: true, paidDate: true },
    }),
    prisma.property.findMany({
      where: { organizationId: staff.organizationId, archived: false },
      include: { units: { where: { archived: false }, include: { tenants: { where: { active: true } } } } },
      orderBy: { name: "asc" },
      take: 3,
    }),
    prisma.maintenanceRequest.count({
      where: { status: "OPEN", unit: { property: { organizationId: staff.organizationId } } },
    }),
    prisma.maintenanceRequest.count({
      where: { status: "IN_PROGRESS", unit: { property: { organizationId: staff.organizationId } } },
    }),
    prisma.maintenanceRequest.count({
      where: { status: "DONE", unit: { property: { organizationId: staff.organizationId } } },
    }),
    prisma.tenant.findMany({
      where: {
        active: true,
        leaseEnd: { not: null, lte: thirtyDaysFromNow, gte: now },
        unit: { property: { organizationId: staff.organizationId } },
      },
      select: { id: true, fullName: true, leaseEnd: true, unit: { select: { label: true, property: { select: { name: true } } } } },
      orderBy: { leaseEnd: "asc" },
    }),
  ]);

  const overdueTotal = overduePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const occupancyPct = unitCount > 0 ? Math.round((occupiedUnitCount / unitCount) * 100) : 0;

  // Bucket paid rent into the last 6 calendar months for the trend chart.
  const monthBuckets: { key: string; label: string; collected: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-MY", { month: "short" }),
      collected: 0,
    });
  }
  for (const p of recentPaidPayments) {
    if (!p.paidDate) continue;
    const key = `${p.paidDate.getFullYear()}-${p.paidDate.getMonth()}`;
    const bucket = monthBuckets.find((b) => b.key === key);
    if (bucket) bucket.collected += Number(p.amount);
  }

  return (
    <div>
      <p className="font-display text-2xl font-medium text-gray-900">
        Good to see you, {staff.name?.split(" ")[0] ?? "there"}
      </p>
      <p className="mt-1 text-sm text-gray-500">Here&apos;s how your portfolio is doing</p>

      {overdueTotal > 0 && (
        <Link
          href="/dashboard/rent"
          className="mt-5 flex items-center gap-2 rounded-xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800 hover:bg-coral-100"
        >
          <AlertTriangle size={16} className="shrink-0" />
          RM{overdueTotal.toLocaleString()} overdue across {overduePayments.length} payment
          {overduePayments.length === 1 ? "" : "s"} — click to review
        </Link>
      )}

      {leasesEndingSoon.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-medium">
            <Clock size={16} className="shrink-0" />
            {leasesEndingSoon.length} lease{leasesEndingSoon.length === 1 ? "" : "s"} ending within
            30 days
          </div>
          <ul className="mt-1.5 space-y-0.5 pl-6">
            {leasesEndingSoon.map((t) => (
              <li key={t.id}>
                <Link href="/dashboard/tenants" className="hover:underline">
                  {t.fullName} — {t.unit.property.name} ({t.unit.label}) —{" "}
                  {t.leaseEnd ? new Date(t.leaseEnd).toLocaleDateString() : ""}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-teal-50 p-4">
          <p className="text-sm text-teal-800">Rent collected this month</p>
          <p className="mt-1.5 text-2xl font-semibold text-teal-900">
            RM{Number(collectedThisMonth._sum.amount ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-coral-50 p-4">
          <p className="text-sm text-coral-800">Overdue</p>
          <p className="mt-1.5 text-2xl font-semibold text-coral-900">
            RM{overdueTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-sky-50 p-4">
          <p className="text-sm text-sky-800">Occupancy</p>
          <p className="mt-1.5 text-2xl font-semibold text-sky-900">{occupancyPct}%</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Rent collected, last 6 months</p>
        <div className="mt-2">
          <RentTrendChart data={monthBuckets.map((b) => ({ month: b.label, collected: b.collected }))} />
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <p className="text-base font-medium text-gray-900">Your properties</p>
        <Link href="/dashboard/properties" className="text-sm text-brand-600 hover:underline">
          View all
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {properties.length === 0 ? (
          <p className="text-sm text-gray-500">
            No properties yet —{" "}
            <Link href="/dashboard/properties" className="text-brand-600 hover:underline">
              add your first one
            </Link>
            .
          </p>
        ) : (
          properties.map((p) => {
            const occupied = p.units.filter((u) => u.tenants.length > 0).length;
            return (
              <Link
                key={p.id}
                href={`/dashboard/properties/${p.id}`}
                className="overflow-hidden rounded-xl border border-gray-200 hover:border-brand-500"
              >
                <PropertyThumbnail seed={p.id} />
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {p.units.length} unit{p.units.length === 1 ? "" : "s"} —{" "}
                    {p.units.length === 0
                      ? "no units yet"
                      : occupied === p.units.length
                      ? "all occupied"
                      : `${occupied} occupied`}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Maintenance</p>
          <div className="mt-2.5 flex gap-6">
            <div>
              <p className="text-xl font-semibold text-gray-900">{openRequests}</p>
              <p className="mt-0.5 text-xs text-gray-400">Open</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{inProgressRequests}</p>
              <p className="mt-0.5 text-xs text-gray-400">In progress</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{doneRequests}</p>
              <p className="mt-0.5 text-xs text-gray-400">Done</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="mt-2.5 flex items-center gap-2 text-sm text-gray-900">
            <Home size={16} className="text-gray-400" />
            {staff.organization.subscriptionTier} —{" "}
            <Link href="/dashboard/billing" className="text-brand-600 hover:underline">
              manage billing
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

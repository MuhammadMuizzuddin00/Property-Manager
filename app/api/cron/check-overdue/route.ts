import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOverdueRentEmail, sendLeaseExpiringEmail } from "@/lib/email";

// Called on a schedule (e.g. daily, via Vercel Cron or any external
// scheduler). Does two things:
// 1. Flips overdue PENDING rent to LATE and emails the tenant — once.
// 2. Emails tenants whose lease ends within 30 days — once.
// Protect it with a shared secret so randoms on the internet can't trigger it.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Overdue rent ---
  const overduePayments = await prisma.rentPayment.findMany({
    where: { status: "PENDING", dueDate: { lt: new Date() } },
    include: { tenant: { include: { unit: { include: { property: true } } } } },
  });

  let overdueEmailsSent = 0;
  for (const payment of overduePayments) {
    if (payment.tenant.email && !payment.lateReminderSentAt) {
      const result = await sendOverdueRentEmail({
        to: payment.tenant.email,
        tenantName: payment.tenant.fullName,
        amount: payment.amount.toString(),
        dueDate: payment.dueDate,
        propertyName: payment.tenant.unit.property.name,
        unitLabel: payment.tenant.unit.label,
      });
      if (result.sent) overdueEmailsSent++;
    }
    await prisma.rentPayment.update({
      where: { id: payment.id },
      data: { status: "LATE", lateReminderSentAt: new Date() },
    });
  }

  // --- Leases ending within 30 days ---
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringTenants = await prisma.tenant.findMany({
    where: {
      active: true,
      leaseReminderSentAt: null,
      leaseEnd: { not: null, lte: thirtyDaysFromNow, gte: new Date() },
    },
    include: { unit: { include: { property: true } } },
  });

  let leaseEmailsSent = 0;
  for (const tenant of expiringTenants) {
    if (tenant.email && tenant.leaseEnd) {
      const result = await sendLeaseExpiringEmail({
        to: tenant.email,
        tenantName: tenant.fullName,
        leaseEnd: tenant.leaseEnd,
        propertyName: tenant.unit.property.name,
        unitLabel: tenant.unit.label,
      });
      if (result.sent) leaseEmailsSent++;
    }
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { leaseReminderSentAt: new Date() },
    });
  }

  return NextResponse.json({
    overduePaymentsProcessed: overduePayments.length,
    overdueEmailsSent,
    expiringLeasesProcessed: expiringTenants.length,
    leaseEmailsSent,
  });
}

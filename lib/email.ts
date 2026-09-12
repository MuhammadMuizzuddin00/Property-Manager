import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// From address must be on a domain you've verified in Resend. Until you do
// that, Resend's own onboarding@resend.dev sender works for testing (only
// deliverable to the email you signed up to Resend with).
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Ruang Kita <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped sending "${subject}" to ${to}`);
    return { sent: false as const };
  }

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
    return { sent: true as const };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
    return { sent: false as const };
  }
}

export async function sendOverdueRentEmail(params: {
  to: string;
  tenantName: string;
  amount: string;
  dueDate: Date;
  propertyName: string;
  unitLabel: string;
}) {
  return sendEmail(
    params.to,
    `Rent payment overdue — ${params.propertyName} (${params.unitLabel})`,
    `<p>Hi ${params.tenantName},</p>
     <p>This is a reminder that your rent payment of <strong>RM${params.amount}</strong>,
     due on ${params.dueDate.toLocaleDateString()}, is now overdue for
     ${params.propertyName} (${params.unitLabel}).</p>
     <p>Please arrange payment as soon as possible, or contact your property
     manager if you've already paid.</p>`
  );
}

export async function sendLeaseExpiringEmail(params: {
  to: string;
  tenantName: string;
  leaseEnd: Date;
  propertyName: string;
  unitLabel: string;
}) {
  return sendEmail(
    params.to,
    `Your lease is ending soon — ${params.propertyName} (${params.unitLabel})`,
    `<p>Hi ${params.tenantName},</p>
     <p>Your lease for ${params.propertyName} (${params.unitLabel}) is set to
     end on <strong>${params.leaseEnd.toLocaleDateString()}</strong>.</p>
     <p>Please reach out to your property manager if you'd like to discuss
     renewing.</p>`
  );
}

export async function sendBankTransferRequestEmail(params: {
  organizationName: string;
  requesterEmail: string;
  tierName: string;
  reference: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[email] ADMIN_EMAIL not set — skipped bank transfer notification");
    return { sent: false as const };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const approveUrl = `${appUrl}/admin/requests`;

  return sendEmail(
    adminEmail,
    `New bank transfer request — ${params.organizationName} (${params.tierName})`,
    `<p>Organization: <strong>${params.organizationName}</strong></p>
     <p>Requested by: ${params.requesterEmail}</p>
     <p>Plan: <strong>${params.tierName}</strong></p>
     <p>Reference code: <strong>${params.reference}</strong></p>
     <p>Once you've confirmed the transfer in your bank account, approve it here:</p>
     <p><a href="${approveUrl}">${approveUrl}</a></p>`
  );
}

import Link from "next/link";

export const metadata = { title: "Privacy Policy — PropMan" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#FAF8F4] px-6 py-12">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        ← Back
      </Link>
      <h1 className="font-display mt-4 text-3xl font-medium text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: 12 September 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <p>
          This Privacy Policy explains how PropMan, operated by Ruang Kita (&quot;we&quot;, &quot;us&quot;), collects,
          uses, and protects personal data, in line with Malaysia&apos;s Personal Data Protection
          Act 2010 (PDPA).
        </p>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">1. What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account information: name, email, phone number (staff and tenants)</li>
            <li>Property, unit, and lease information you enter</li>
            <li>Rent payment records and maintenance request details</li>
            <li>Billing information, processed by our payment provider (Stripe) — we do not
              store full card numbers ourselves</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">2. How we use it</h2>
          <p className="mt-2">
            We use this data to operate the Service — showing your properties and tenants,
            sending rent/lease reminder emails, processing subscription payments, and providing
            support. We do not sell personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">3. Tenant data</h2>
          <p className="mt-2">
            If you are a tenant invited by a landlord/manager, your name, email, phone number,
            and lease details are entered by that landlord/manager and are visible to them and
            their team. Contact your landlord/manager directly to correct inaccurate information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">4. Third parties we use</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Clerk — authentication and account management</li>
            <li>Stripe — payment processing</li>
            <li>Resend — sending transactional emails (invites, reminders)</li>
            <li>Supabase — database hosting</li>
          </ul>
          <p className="mt-2">
            Each of these providers processes data under their own privacy policies and security
            standards.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">5. Your rights under the PDPA</h2>
          <p className="mt-2">
            You may request access to, correction of, or deletion of your personal data by
            contacting us at Ruangkita.support@gmail.com. We will respond within a reasonable time as
            required by the PDPA.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">6. Data retention</h2>
          <p className="mt-2">
            We retain account and financial records for as long as your account is active, and
            for a reasonable period after closure to comply with legal and accounting
            obligations.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">7. Security</h2>
          <p className="mt-2">
            We use industry-standard measures (encrypted connections, access controls) to protect
            your data, but no system is 100% secure — please use a strong, unique password.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">8. Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data can be sent to Ruangkita.support@gmail.com.
          </p>
        </section>

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <strong>Note for the site owner:</strong> This is a generic starting template, not legal
          advice. Have a Malaysia-qualified lawyer review this against the actual PDPA
          requirements for your business before accepting real tenant/landlord data at scale.
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export const metadata = { title: "Terms of Service — Ruang Kita" };

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#FAF8F4] px-6 py-12">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        ← Back
      </Link>
      <h1 className="font-display mt-4 text-3xl font-medium text-gray-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: 12 September 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Ruang Kita
          (&quot;Service&quot;, &quot;we&quot;,
          &quot;us&quot;). By creating an account or using the Service, you agree to these Terms.
        </p>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">1. Accounts</h2>
          <p className="mt-2">
            You must provide accurate information when creating an account. You are responsible
            for keeping your login credentials secure and for all activity under your account.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">2. Subscriptions and billing</h2>
          <p className="mt-2">
            Paid plans are billed on a recurring basis via our payment processor (Stripe) or,
            where offered, via manual bank transfer. Fees are non-refundable except where required
            by law. We may change our pricing with reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">3. Your data</h2>
          <p className="mt-2">
            You retain ownership of the property, tenant, and financial data you enter into the
            Service. You are responsible for having the right to store any personal data
            (including tenant information) that you upload — see our{" "}
            <Link href="/privacy" className="text-brand-600 hover:underline">
              Privacy Policy
            </Link>{" "}
            for how we handle that data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">4. Acceptable use</h2>
          <p className="mt-2">
            You agree not to use the Service for unlawful purposes, to store data you do not have
            the right to store, or to attempt to disrupt or reverse-engineer the Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">5. Termination</h2>
          <p className="mt-2">
            You may cancel your subscription at any time from the Billing page. We may suspend or
            terminate accounts that violate these Terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">6. Limitation of liability</h2>
          <p className="mt-2">
            The Service is provided &quot;as is&quot;. To the maximum extent permitted by law, we
            are not liable for indirect, incidental, or consequential damages arising from your
            use of the Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">7. Changes to these Terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time. Continued use of the Service after
            changes take effect constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-gray-900">8. Contact</h2>
          <p className="mt-2">
            Questions about these Terms can be sent to Ruangkita.support@gmail.com.
          </p>
        </section>

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <strong>Note for the site owner:</strong> This is a generic starting template, not legal
          advice. Have a Malaysia-qualified lawyer review this before accepting real payments,
          especially the sections on refunds, liability, and data handling under the PDPA.
        </div>
      </div>
    </div>
  );
}

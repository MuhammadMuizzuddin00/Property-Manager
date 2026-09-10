import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F4] px-6 text-center">
      <h1 className="font-display text-4xl font-medium text-gray-900">PropMan</h1>
      <p className="mt-4 max-w-md text-gray-600">
        Track tenants, rent, and maintenance requests across every property
        you manage — all in one place.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-white hover:bg-brand-700"
        >
          Staff Dashboard
        </Link>
        <Link
          href="/portal"
          className="rounded-lg border border-brand-600 px-5 py-2.5 text-brand-700 hover:bg-brand-50"
        >
          Tenant Portal
        </Link>
      </div>
      <div className="mt-16 flex gap-4 text-xs text-gray-400">
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Building2, Wallet, Wrench, Users, AlertTriangle } from "lucide-react";
import PropertyThumbnail from "./dashboard/property-thumbnail";

const FEATURES = [
  {
    title: "Track every property and unit",
    body: "See occupancy, rent, and tenants for each property at a glance.",
    icon: Building2,
    tint: "bg-teal-50",
    iconColor: "text-teal-700",
  },
  {
    title: "Never lose track of rent",
    body: "Log payments as they come in, and get flagged automatically when one falls overdue.",
    icon: Wallet,
    tint: "bg-coral-50",
    iconColor: "text-coral-700",
  },
  {
    title: "Handle maintenance end to end",
    body: "Tenants report issues from their phone; you track each one through to done.",
    icon: Wrench,
    tint: "bg-sand-50",
    iconColor: "text-sand-600",
  },
  {
    title: "Give tenants their own portal",
    body: "They check their lease, see rent status, and file requests without calling you.",
    icon: Users,
    tint: "bg-sky-50",
    iconColor: "text-sky-700",
  },
];

const PLANS = [
  { name: "Free", price: "RM0/mo", maxProperties: "2" },
  { name: "Basic", price: "RM29/mo", maxProperties: "10" },
  { name: "Standard", price: "RM59/mo", maxProperties: "50" },
  { name: "Premium", price: "RM100/mo", maxProperties: "Unlimited" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF8F4]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
            <Building2 size={15} className="text-white" />
          </div>
          <span className="font-display text-lg font-medium text-gray-900">PropMan</span>
        </div>
        <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
          Log in
        </Link>
      </div>

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-12 sm:px-10 md:grid-cols-2 md:items-center md:py-20">
        <div>
          <h1 className="font-display text-4xl leading-tight text-gray-900 sm:text-5xl">
            Every property, tenant, and ringgit — in one place.
          </h1>
          <p className="mt-5 max-w-md text-gray-600">
            PropMan helps landlords and property managers in Malaysia track units, collect rent,
            and handle maintenance — without a spreadsheet.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-white hover:bg-brand-700"
            >
              Get started free
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
            >
              Log in
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Renting from a landlord who uses PropMan?{" "}
            <Link href="/portal" className="text-brand-600 hover:underline">
              Go to your tenant portal
            </Link>
            .
          </p>
        </div>

        {/* Product glimpse — real component styles from the actual dashboard */}
        <div className="relative">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-teal-50 p-2.5">
                <p className="text-[11px] text-teal-800">Collected</p>
                <p className="mt-0.5 text-sm font-semibold text-teal-900">RM8,450</p>
              </div>
              <div className="rounded-lg bg-coral-50 p-2.5">
                <p className="flex items-center gap-1 text-[11px] text-coral-800">
                  <AlertTriangle size={10} />
                  Overdue
                </p>
                <p className="mt-0.5 text-sm font-semibold text-coral-900">RM1,200</p>
              </div>
              <div className="rounded-lg bg-sky-50 p-2.5">
                <p className="text-[11px] text-sky-800">Occupancy</p>
                <p className="mt-0.5 text-sm font-semibold text-sky-900">82%</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="overflow-hidden rounded-lg">
                <PropertyThumbnail seed="landing-preview-a" compact={false} />
                <p className="mt-1 text-xs font-medium text-gray-700">Sunway Sungai Jernih</p>
                <p className="text-[11px] text-gray-400">4 units — all occupied</p>
              </div>
              <div className="overflow-hidden rounded-lg">
                <PropertyThumbnail seed="landing-preview-b" compact={false} />
                <p className="mt-1 text-xs font-medium text-gray-700">Condo Desa View</p>
                <p className="text-[11px] text-gray-400">6 units — 5 occupied</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className={`rounded-xl p-5 ${f.tint}`}>
              <f.icon size={20} className={f.iconColor} />
              <p className="mt-3 font-medium text-gray-900">{f.title}</p>
              <p className="mt-1 text-sm text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <h2 className="font-display text-2xl text-gray-900">Pricing that scales with your portfolio</h2>
        <p className="mt-1 text-sm text-gray-500">
          Pay for how many properties you manage. Upgrade or cancel any time.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.name} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-500">{plan.name}</p>
              <p className="font-display mt-1 text-xl text-gray-900">{plan.price}</p>
              <p className="mt-1 text-xs text-gray-400">Up to {plan.maxProperties} properties</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-10 text-center sm:px-10">
        <Link
          href="/sign-up"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-white hover:bg-brand-700"
        >
          Get started free
        </Link>
        <div className="mt-4 flex gap-4 text-xs text-gray-400">
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </div>
      </footer>
    </main>
  );
}

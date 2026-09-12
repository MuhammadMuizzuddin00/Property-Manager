import { getCurrentStaffUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SubscribeButton from "./subscribe-button";
import ManageBillingButton from "./manage-billing-button";
import BankTransferOption from "./bank-transfer-option";
import { CheckCircle2, CreditCard, Sparkles, Clock } from "lucide-react";

const PLANS = [
  { name: "FREE" as const, label: "Free", maxProperties: "3", price: "RM0/mo" },
  { name: "STARTER" as const, label: "Basic", maxProperties: "10", price: "RM29/mo" },
  { name: "GROWTH" as const, label: "Standard", maxProperties: "50", price: "RM59/mo" },
  { name: "SCALE" as const, label: "Premium", maxProperties: "Unlimited", price: "RM100/mo" },
];

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const staff = await getCurrentStaffUser();
  if (!staff) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        This account isn&apos;t set up as a staff account.
      </div>
    );
  }

  const params = await searchParams;
  const propertyCount = await prisma.property.count({
    where: { organizationId: staff.organizationId, archived: false },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-gray-900">Billing</h1>
      <p className="mt-1 text-sm text-gray-500">
        You&apos;re managing {propertyCount} propert{propertyCount === 1 ? "y" : "ies"} on the{" "}
        <strong>{staff.organization.subscriptionTier}</strong> plan. Adding a property beyond your
        plan&apos;s limit will ask you to upgrade first.
      </p>

      {params.success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          <CheckCircle2 size={16} />
          Subscription started! It may take a few seconds for your plan to update below.
        </div>
      )}
      {params.canceled && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Checkout was canceled — no changes were made.
        </div>
      )}

      {staff.organization.pendingPlanRequest && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Clock size={16} />
          Bank transfer request pending for <strong>{staff.organization.pendingPlanRequest}</strong>{" "}
          (ref {staff.organization.pendingPlanReference}) — we&apos;ll activate it once confirmed.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = staff.organization.subscriptionTier === plan.name;
          return (
            <div
              key={plan.name}
              className={`rounded-xl border bg-white p-4 ${isCurrent ? "border-brand-500 ring-1 ring-brand-500" : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">{plan.label}</span>
                {isCurrent && <CheckCircle2 size={16} className="text-brand-600" />}
                {plan.name === "SCALE" && !isCurrent && <Sparkles size={15} className="text-sand-600" />}
              </div>
              <div className="mt-1 font-display text-2xl font-medium text-gray-900">{plan.price}</div>
              <div className="mt-1 text-xs text-gray-400">Up to {plan.maxProperties} properties</div>
              <div className="mt-4">
                {plan.name === "FREE" ? (
                  <div className="text-center text-xs text-gray-400">
                    {isCurrent ? "Current plan" : "Cancel your subscription to return to Free"}
                  </div>
                ) : (
                  <>
                    <SubscribeButton
                      tierName={plan.name}
                      disabled={isCurrent || !!staff.organization.pendingPlanRequest}
                    />
                    <BankTransferOption
                      tierName={plan.name}
                      disabled={isCurrent || !!staff.organization.pendingPlanRequest}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {staff.organization.stripeCustomerId && (
        <div className="mt-6">
          <ManageBillingButton />
        </div>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-gray-400">
        <CreditCard size={13} />
        Your plan only changes when you subscribe here (or cancel via &quot;Manage billing&quot;).
      </p>
    </div>
  );
}

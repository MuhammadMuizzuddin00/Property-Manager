"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";

export default function BankTransferOption({
  tierName,
  disabled,
}: {
  tierName: "STARTER" | "GROWTH" | "SCALE";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/billing/bank-transfer-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierName }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setResult({ reference: data.reference });
    } else {
      setError(data.error ?? "Couldn't submit that request.");
    }
  }

  if (disabled) return null;

  if (result) {
    return (
      <p className="mt-2 text-center text-xs text-teal-700">
        Request sent — ref <strong>{result.reference}</strong>. We&apos;ll activate your plan
        once payment is confirmed.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:underline"
      >
        <Landmark size={12} />
        Or pay via bank transfer
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
          <p>Transfer to:</p>
          <p className="mt-1 font-medium text-gray-800">[Your Bank Name] — [Account Number]</p>
          <p>Account name: [Your Name / Company]</p>
          <p className="mt-2">
            We&apos;ll email you a reference code to include in the transfer description once you
            confirm below.
          </p>
          {error && <p className="mt-2 text-coral-700">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-100 disabled:opacity-50"
          >
            {submitting ? "Requesting…" : "Request this plan"}
          </button>
        </div>
      )}
    </div>
  );
}

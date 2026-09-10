"use client";

import { useState } from "react";

export default function SubscribeButton({
  tierName,
  disabled,
}: {
  tierName: "STARTER" | "GROWTH" | "SCALE";
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierName }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Something went wrong starting checkout.");
        setLoading(false);
      }
    } catch (err) {
      alert("Something went wrong starting checkout.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Redirecting…" : disabled ? "Current plan" : "Subscribe"}
    </button>
  );
}

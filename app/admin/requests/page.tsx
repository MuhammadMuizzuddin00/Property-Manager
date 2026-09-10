"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Building2 } from "lucide-react";

type Req = {
  id: string;
  name: string;
  subscriptionTier: string;
  pendingPlanRequest: string;
  pendingPlanReference: string;
  pendingPlanRequestedAt: string;
  users: { email: string }[];
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/requests");
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Not authorized");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setBusyId(id);
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (res.ok) load();
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-gray-500">{error}</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-[#FAF8F4] p-8">
      <h1 className="font-display text-2xl font-medium text-gray-900">Pending bank transfer requests</h1>
      <p className="mt-1 text-sm text-gray-500">
        Approve once you've confirmed the transfer in your bank account, using the reference code
        below to match it.
      </p>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
            <Building2 size={22} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No pending requests.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{r.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.pendingPlanRequestedAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Requesting <strong>{r.pendingPlanRequest}</strong> (currently{" "}
                  {r.subscriptionTier}) — ref <strong>{r.pendingPlanReference}</strong>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{r.users[0]?.email}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAction(r.id, "approve")}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "reject")}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1.5 rounded-lg border border-coral-200 px-3 py-1.5 text-xs text-coral-800 hover:bg-coral-50 disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

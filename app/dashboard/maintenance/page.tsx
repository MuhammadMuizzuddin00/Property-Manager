"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, CheckCircle2, XCircle, Wrench } from "lucide-react";

type Request = {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  submittedBy: "STAFF" | "TENANT";
  createdAt: string;
  unit: { label: string; property: { name: string } };
  tenant: { fullName: string } | null;
};

const STATUS_STYLES: Record<Request["status"], string> = {
  OPEN: "bg-coral-50 text-coral-800 border-l-coral-400",
  IN_PROGRESS: "bg-sand-50 text-sand-600 border-l-amber-400",
  DONE: "bg-teal-50 text-teal-800 border-l-teal-400",
  CANCELLED: "bg-gray-100 text-gray-500 border-l-gray-300",
};

const STATUS_ICON = {
  OPEN: AlertCircle,
  IN_PROGRESS: Loader2,
  DONE: CheckCircle2,
  CANCELLED: XCircle,
};

const NEXT_STATUS: Record<Request["status"], Request["status"] | null> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: null,
  CANCELLED: null,
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  async function load(status?: string) {
    setLoading(true);
    const url = status ? `/api/maintenance?status=${status}` : "/api/maintenance";
    const res = await fetch(url);
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load(filter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function advanceStatus(req: Request) {
    const next = NEXT_STATUS[req.status];
    if (!next) return;
    const res = await fetch("/api/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: req.id, status: next }),
    });
    if (res.ok) load(filter || undefined);
  }

  async function cancel(req: Request) {
    const res = await fetch("/api/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: req.id, status: "CANCELLED" }),
    });
    if (res.ok) load(filter || undefined);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-gray-900">Maintenance</h1>
        <select
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
            <Wrench size={22} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No maintenance requests.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => {
              const StatusIcon = STATUS_ICON[r.status];
              return (
                <li
                  key={r.id}
                  className={`rounded-xl border border-l-[3px] border-gray-200 bg-white p-4 ${STATUS_STYLES[r.status].split(" ").find((c) => c.startsWith("border-l"))}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{r.title}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {r.unit.property.name} ({r.unit.label})
                        {r.tenant ? ` · ${r.tenant.fullName}` : ""} · filed by{" "}
                        {r.submittedBy === "TENANT" ? "tenant" : "staff"} ·{" "}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{r.description}</p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${STATUS_STYLES[r.status]}`}
                    >
                      <StatusIcon size={12} className={r.status === "IN_PROGRESS" ? "animate-spin" : ""} />
                      {r.status.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                  {(r.status === "OPEN" || r.status === "IN_PROGRESS") && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => advanceStatus(r)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Mark as {NEXT_STATUS[r.status]?.replace("_", " ").toLowerCase()}
                      </button>
                      <button
                        onClick={() => cancel(r)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-coral-800 hover:bg-coral-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

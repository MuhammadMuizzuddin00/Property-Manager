"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, CircleDot, Search, Plus, Wallet } from "lucide-react";

type Tenant = {
  id: string;
  fullName: string;
  unit: { label: string; property: { name: string } };
};

type Payment = {
  id: string;
  amount: string;
  dueDate: string;
  paidDate: string | null;
  status: "PENDING" | "PAID" | "LATE" | "PARTIAL";
  tenant: Tenant;
};

const STATUS_STYLES: Record<Payment["status"], string> = {
  PENDING: "bg-gray-100 text-gray-700",
  PAID: "bg-teal-50 text-teal-800",
  LATE: "bg-coral-50 text-coral-800",
  PARTIAL: "bg-sand-50 text-sand-600",
};

const STATUS_BORDER: Record<Payment["status"], string> = {
  PENDING: "border-l-gray-300",
  PAID: "border-l-teal-400",
  LATE: "border-l-coral-400",
  PARTIAL: "border-l-amber-400",
};

const STATUS_ICON = {
  PENDING: Clock,
  PAID: CheckCircle2,
  LATE: AlertCircle,
  PARTIAL: CircleDot,
};

export default function RentPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ tenantId: "", amount: "", dueDate: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Payment["status"]>("");

  async function load() {
    setLoading(true);
    const [paymentsRes, tenantsRes] = await Promise.all([
      fetch("/api/rent"),
      fetch("/api/tenants"),
    ]);
    const paymentsData = await paymentsRes.json();
    const tenantsData = await tenantsRes.json();
    setPayments(paymentsData.payments ?? []);
    setTenants(tenantsData.tenants ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.tenant.fullName.toLowerCase().includes(q) ||
      p.tenant.unit.property.name.toLowerCase().includes(q) ||
      p.tenant.unit.label.toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/rent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: form.tenantId,
        amount: Number(form.amount),
        dueDate: form.dueDate,
      }),
    });
    if (res.ok) {
      setForm({ tenantId: "", amount: "", dueDate: "" });
      load();
    }
  }

  async function markPaid(id: string) {
    const res = await fetch("/api/rent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "PAID" }),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-gray-900">Rent</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Wallet size={16} className="text-brand-600" />
          Add a payment record
        </div>
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.tenantId}
          onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
          required
        >
          <option value="">Select a tenant…</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName} — {t.unit.property.name} ({t.unit.label})
            </option>
          ))}
        </select>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Amount (RM)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <input
            type="date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            required
          />
        </div>
        <button className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
          <Plus size={15} />
          Add payment record
        </button>
      </form>

      <div className="mt-8">
        {payments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative w-full max-w-md">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tenant or property…"
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="LATE">Late</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        )}
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
            <Wallet size={22} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No rent records yet — add one above.</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <p className="text-sm text-gray-500">No rent records match your filters.</p>
        ) : (
          <ul className="space-y-2">
            {filteredPayments.map((p) => {
              const StatusIcon = STATUS_ICON[p.status];
              return (
                <li
                  key={p.id}
                  className={`flex items-center justify-between rounded-xl border border-l-[3px] border-gray-200 bg-white p-4 ${STATUS_BORDER[p.status]}`}
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {p.tenant.fullName} — RM{p.amount}
                    </div>
                    <div className="text-xs text-gray-400">
                      {p.tenant.unit.property.name} ({p.tenant.unit.label}) · Due{" "}
                      {new Date(p.dueDate).toLocaleDateString()}
                      {p.paidDate ? ` · Paid ${new Date(p.paidDate).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[p.status]}`}
                    >
                      <StatusIcon size={12} />
                      {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                    </span>
                    {p.status !== "PAID" && (
                      <button
                        onClick={() => markPaid(p.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Mark as paid
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

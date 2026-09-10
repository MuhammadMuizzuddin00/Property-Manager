"use client";

import { useEffect, useState } from "react";
import { Search, Mail, Phone, Pencil, UserX, UserPlus } from "lucide-react";

type Unit = {
  id: string;
  label: string;
  property: { name: string };
  tenants: { id: string }[];
};

type Tenant = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  leaseStart: string;
  leaseEnd: string | null;
  active: boolean;
  unit: { label: string; property: { name: string } };
};

const emptyAddForm = { unitId: "", fullName: "", email: "", phone: "", leaseStart: "", leaseEnd: "" };

function isLeaseEndingSoon(leaseEnd: string | null) {
  if (!leaseEnd) return false;
  const end = new Date(leaseEnd);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  return end >= now && end <= thirtyDaysFromNow;
}

function friendlyError(data: any, fallback: string) {
  if (typeof data?.error === "string") return data.error;
  const fieldErrors = data?.error?.fieldErrors;
  if (fieldErrors) {
    const firstField = Object.keys(fieldErrors)[0];
    const msg = fieldErrors[firstField]?.[0];
    if (msg) return `${firstField}: ${msg}`;
  }
  return fallback;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyAddForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", leaseEnd: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  async function load() {
    setLoading(true);
    const [tenantsRes, unitsRes] = await Promise.all([
      fetch("/api/tenants"),
      fetch("/api/units"), // no propertyId → returns every unit in the org
    ]);
    const tenantsData = await tenantsRes.json();
    const unitsData = await unitsRes.json();
    setTenants(tenantsData.tenants ?? []);
    setUnits(unitsData.units ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredTenants = tenants.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.fullName.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.unit.property.name.toLowerCase().includes(q) ||
      t.unit.label.toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviteMessage(null);
    setFormError(null);
    setSubmitting(true);
    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId: form.unitId,
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        leaseStart: form.leaseStart,
        leaseEnd: form.leaseEnd || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      if (data.inviteStatus === "sent") {
        setInviteMessage(`Portal invite emailed to ${form.email}.`);
      } else if (data.inviteStatus === "failed") {
        setInviteMessage(
          `Tenant added, but the portal invite email couldn't be sent (check the terminal for details).`
        );
      }
      setForm(emptyAddForm);
      load();
    } else {
      setFormError(friendlyError(data, "Couldn't add that tenant — check the fields and try again."));
    }
  }

  function startEdit(t: Tenant) {
    setEditingId(t.id);
    setEditError(null);
    setEditForm({
      fullName: t.fullName,
      email: t.email ?? "",
      phone: t.phone ?? "",
      leaseEnd: t.leaseEnd ? t.leaseEnd.slice(0, 10) : "",
    });
  }

  async function saveEdit(tenantId: string) {
    setEditError(null);
    const res = await fetch(`/api/tenants/${tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: editForm.fullName,
        email: editForm.email || null,
        phone: editForm.phone || null,
        leaseEnd: editForm.leaseEnd || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setEditingId(null);
      load();
    } else {
      setEditError(friendlyError(data, "Couldn't save changes."));
    }
  }

  async function endTenancy(tenantId: string, name: string) {
    if (!confirm(`End ${name}'s tenancy? Their unit will become vacant. Payment and maintenance history is kept.`))
      return;
    setActionError(null);
    const res = await fetch(`/api/tenants/${tenantId}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      setActionError(friendlyError(data, "Couldn't end this tenancy."));
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-gray-900">Tenants</h1>
      <p className="mt-1 text-sm text-gray-500">
        Add an email to automatically send the tenant a portal invite.
      </p>
      {inviteMessage && (
        <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {inviteMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <UserPlus size={16} className="text-brand-600" />
          Add a tenant
        </div>
        {formError && (
          <div className="rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
            {formError}
          </div>
        )}
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.unitId}
          onChange={(e) => setForm({ ...form, unitId: e.target.value })}
          required
        >
          <option value="">Select a unit…</option>
          {units.map((u) => (
            <option key={u.id} value={u.id} disabled={u.tenants.length > 0}>
              {u.property.name} — {u.label} {u.tenants.length > 0 ? "(occupied)" : ""}
            </option>
          ))}
        </select>
        <input
          placeholder="Tenant full name"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            placeholder="Email (optional)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Phone (optional)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-gray-500">Lease start</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={form.leaseStart}
              onChange={(e) => setForm({ ...form, leaseStart: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Lease end (optional)</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={form.leaseEnd}
              onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })}
            />
          </div>
        </div>
        <button
          disabled={submitting}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <UserPlus size={15} />
          {submitting ? "Adding…" : "Add tenant"}
        </button>
      </form>

      <div className="mt-8">
        {actionError && (
          <div className="mb-3 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
            {actionError}
          </div>
        )}
        {tenants.length > 0 && (
          <div className="relative mb-4 max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or property…"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : tenants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
            <UserPlus size={22} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No tenants yet — add your first one above.</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <p className="text-sm text-gray-500">No tenants match &quot;{searchQuery}&quot;.</p>
        ) : (
          <ul className="space-y-2">
            {filteredTenants.map((t) =>
              editingId === t.id ? (
                <li key={t.id} className="rounded-xl border-2 border-brand-500 bg-white p-4">
                  {editError && (
                    <div className="mb-2 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
                      {editError}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <input
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        placeholder="Email"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                      <input
                        placeholder="Phone"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Lease end</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                        value={editForm.leaseEnd}
                        onChange={(e) => setEditForm({ ...editForm, leaseEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => saveEdit(t.id)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ) : (
                <li key={t.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
                        {t.fullName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{t.fullName}</span>
                          {!t.active && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              Inactive
                            </span>
                          )}
                          {t.active && isLeaseEndingSoon(t.leaseEnd) && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              Lease ending soon
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {t.unit.property.name} — {t.unit.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between pl-12">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      <span>
                        Lease: {new Date(t.leaseStart).toLocaleDateString()}
                        {t.leaseEnd ? ` – ${new Date(t.leaseEnd).toLocaleDateString()}` : " – ongoing"}
                      </span>
                      {t.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {t.email}
                        </span>
                      )}
                      {t.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {t.phone}
                        </span>
                      )}
                    </span>
                    {t.active && (
                      <div className="flex shrink-0 gap-3 text-xs">
                        <button onClick={() => startEdit(t)} className="flex items-center gap-1 text-gray-600 hover:underline">
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => endTenancy(t.id, t.fullName)}
                          className="flex items-center gap-1 text-coral-800 hover:underline"
                        >
                          <UserX size={13} />
                          End tenancy
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

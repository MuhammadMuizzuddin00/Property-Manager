"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PropertyThumbnail from "../property-thumbnail";
import { Building2, Search, Pencil, Archive, ArchiveRestore, Trash2, Plus } from "lucide-react";

type Property = {
  id: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  archived: boolean;
  units: { id: string }[];
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/properties${showArchived ? "?includeArchived=true" : ""}`);
    const data = await res.json();
    setProperties(data.properties ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.addressLine1.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q)
    );
  });

  function apiErrorMessage(data: any, fallback: string) {
    if (typeof data?.error === "string") return data.error;
    if (data?.error?.fieldErrors) {
      const firstField = Object.keys(data.error.fieldErrors)[0];
      const fieldMsg = data.error.fieldErrors[firstField]?.[0];
      if (fieldMsg) return `${firstField}: ${fieldMsg}`;
    }
    return fallback;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setForm({ name: "", addressLine1: "", city: "", state: "", postalCode: "" });
      load();
    } else {
      setFormError(apiErrorMessage(data, "Couldn't add that property — check the fields and try again."));
    }
  }

  function startEdit(p: Property) {
    setEditingId(p.id);
    setRowError(null);
    setEditForm({
      name: p.name,
      addressLine1: p.addressLine1,
      city: p.city,
      state: p.state,
      postalCode: p.postalCode,
    });
  }

  async function saveEdit(id: string) {
    setRowError(null);
    setRowBusyId(id);
    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setRowBusyId(null);
    if (res.ok) {
      setEditingId(null);
      load();
    } else {
      setRowError(apiErrorMessage(data, "Couldn't save those changes."));
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This can't be undone.`)) return;
    setRowError(null);
    setRowBusyId(id);
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    const data = await res.json();
    setRowBusyId(null);
    if (res.ok) {
      load();
    } else {
      setRowError(apiErrorMessage(data, "Couldn't delete that property."));
    }
  }

  async function handleArchive(id: string, name: string) {
    if (!confirm(`Archive "${name}"? Use this when a property is sold or no longer managed — it'll be hidden but its history is kept.`)) return;
    setRowError(null);
    setRowBusyId(id);
    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    const data = await res.json();
    setRowBusyId(null);
    if (res.ok) {
      load();
    } else {
      setRowError(apiErrorMessage(data, "Couldn't archive that property."));
    }
  }

  async function handleUnarchive(id: string) {
    setRowError(null);
    setRowBusyId(id);
    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: false }),
    });
    const data = await res.json();
    setRowBusyId(null);
    if (res.ok) {
      load();
    } else {
      setRowError(apiErrorMessage(data, "Couldn't unarchive that property."));
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-gray-900">Properties</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Building2 size={16} className="text-brand-600" />
          Add a property
        </div>
        {formError && (
          <div className="rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
            {formError}
          </div>
        )}
        <input
          placeholder="Property name"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Address line 1"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.addressLine1}
          onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            placeholder="City"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
          <input
            placeholder="State"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            required
          />
          <input
            placeholder="Postal code"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            required
          />
        </div>
        <button
          disabled={submitting}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus size={15} />
          {submitting ? "Adding…" : "Add property"}
        </button>
      </form>

      {rowError && (
        <div className="mt-4 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
          {rowError}
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {properties.filter((p) => !p.archived).length} active propert
            {properties.filter((p) => !p.archived).length === 1 ? "y" : "ies"}
          </span>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived properties
          </label>
        </div>
        {properties.length > 0 && (
          <div className="relative mb-4 max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, city, or address…"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
            <Building2 size={22} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No properties yet — add your first one above.</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <p className="text-sm text-gray-500">No properties match &quot;{searchQuery}&quot;.</p>
        ) : (
          <ul className="space-y-2">
            {filteredProperties.map((p) =>
              editingId === p.id ? (
                <li key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Property name"
                    />
                    <input
                      className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.addressLine1}
                      onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                      placeholder="Address line 1"
                    />
                    <input
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="City"
                    />
                    <input
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="State"
                    />
                    <input
                      className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      placeholder="Postal code"
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => saveEdit(p.id)}
                      disabled={rowBusyId === p.id}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {rowBusyId === p.id ? "Saving…" : "Save"}
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
                <li
                  key={p.id}
                  className={`rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-500 ${p.archived ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/dashboard/properties/${p.id}`} className="flex flex-1 gap-3">
                      <PropertyThumbnail seed={p.id} compact />
                      <div>
                        <div className="font-medium">
                          {p.name}
                          {p.archived && (
                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {p.addressLine1}, {p.city}, {p.state}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">{p.units.length} unit(s)</div>
                      </div>
                    </Link>
                    <div className="flex shrink-0 gap-1.5">
                      {p.archived ? (
                        <button
                          onClick={() => handleUnarchive(p.id)}
                          disabled={rowBusyId === p.id}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-brand-600 hover:bg-brand-50 disabled:opacity-50"
                        >
                          <ArchiveRestore size={13} />
                          {rowBusyId === p.id ? "Working…" : "Unarchive"}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(p)}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          {p.units.length > 0 ? (
                            <button
                              onClick={() => handleArchive(p.id, p.name)}
                              disabled={rowBusyId === p.id}
                              className="flex items-center gap-1 rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            >
                              <Archive size={13} />
                              {rowBusyId === p.id ? "Working…" : "Archive"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              disabled={rowBusyId === p.id}
                              className="flex items-center gap-1 rounded-lg border border-coral-200 px-2 py-1 text-xs text-coral-800 hover:bg-coral-50 disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              {rowBusyId === p.id ? "Working…" : "Delete"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PropertyThumbnail from "../../property-thumbnail";
import { ArrowLeft, Bed, Bath, Wallet, Home, Pencil, Archive, ArchiveRestore, Trash2, Plus } from "lucide-react";

type Property = {
  id: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
};

type Unit = {
  id: string;
  label: string;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: string;
  archived: boolean;
  tenants: { id: string; fullName: string }[];
  _count: { tenants: number; maintenance: number };
};

const emptyForm = { label: "", bedrooms: "1", bathrooms: "1", monthlyRent: "" };

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [editingProperty, setEditingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  const [propertySaving, setPropertySaving] = useState(false);
  const [propertyDeleteError, setPropertyDeleteError] = useState<string | null>(null);

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [busyUnitId, setBusyUnitId] = useState<string | null>(null);

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

  async function loadProperty() {
    const res = await fetch(`/api/properties/${propertyId}`);
    if (res.ok) {
      const data = await res.json();
      setProperty(data.property);
      setPropertyForm({
        name: data.property.name,
        addressLine1: data.property.addressLine1,
        city: data.property.city,
        state: data.property.state,
        postalCode: data.property.postalCode,
      });
    }
  }

  async function saveProperty() {
    setPropertyError(null);
    setPropertySaving(true);
    const res = await fetch(`/api/properties/${propertyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propertyForm),
    });
    const data = await res.json();
    setPropertySaving(false);
    if (res.ok) {
      setEditingProperty(false);
      loadProperty();
    } else {
      setPropertyError(friendlyError(data, "Couldn't save changes."));
    }
  }

  async function deleteProperty() {
    if (!confirm("Delete this property? This can't be undone.")) return;
    setPropertyDeleteError(null);
    const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/properties");
    } else {
      const data = await res.json();
      setPropertyDeleteError(friendlyError(data, "Couldn't delete this property."));
    }
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/units?propertyId=${propertyId}${showArchived ? "&includeArchived=true" : ""}`);
    const data = await res.json();
    setUnits(data.units ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadProperty();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, showArchived]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        label: form.label,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        monthlyRent: Number(form.monthlyRent),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setForm(emptyForm);
      load();
    } else {
      setFormError(friendlyError(data, "Couldn't add that unit — check the fields and try again."));
    }
  }

  function startEdit(unit: Unit) {
    setEditingId(unit.id);
    setEditError(null);
    setEditForm({
      label: unit.label,
      bedrooms: String(unit.bedrooms),
      bathrooms: String(unit.bathrooms),
      monthlyRent: unit.monthlyRent,
    });
  }

  async function saveEdit(unitId: string) {
    setEditError(null);
    const res = await fetch(`/api/units/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: editForm.label,
        bedrooms: Number(editForm.bedrooms),
        bathrooms: Number(editForm.bathrooms),
        monthlyRent: Number(editForm.monthlyRent),
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

  async function deleteUnit(unitId: string) {
    if (!confirm("Permanently delete this unit? This can't be undone.")) return;
    setDeleteError(null);
    setBusyUnitId(unitId);
    const res = await fetch(`/api/units/${unitId}`, { method: "DELETE" });
    setBusyUnitId(null);
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      setDeleteError(friendlyError(data, "Couldn't delete that unit."));
    }
  }

  async function archiveUnit(unitId: string) {
    if (!confirm("Archive this unit? It will be hidden from your active list, but its history is kept.")) return;
    setDeleteError(null);
    setBusyUnitId(unitId);
    const res = await fetch(`/api/units/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    setBusyUnitId(null);
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      setDeleteError(friendlyError(data, "Couldn't archive that unit."));
    }
  }

  async function unarchiveUnit(unitId: string) {
    setDeleteError(null);
    setBusyUnitId(unitId);
    const res = await fetch(`/api/units/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: false }),
    });
    setBusyUnitId(null);
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      setDeleteError(friendlyError(data, "Couldn't unarchive that unit."));
    }
  }

  return (
    <div>
      <Link href="/dashboard/properties" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={14} />
        Back to properties
      </Link>

      <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {property && (
          <div className="h-24">
            <PropertyThumbnail seed={property.id} />
          </div>
        )}
        <div className="p-4">
        {propertyError && (
          <div className="mb-3 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
            {propertyError}
          </div>
        )}
        {propertyDeleteError && (
          <div className="mb-3 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
            {propertyDeleteError}
          </div>
        )}
        {editingProperty ? (
          <div className="grid gap-2">
            <input
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="Property name"
              value={propertyForm.name}
              onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
            />
            <input
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="Address line 1"
              value={propertyForm.addressLine1}
              onChange={(e) => setPropertyForm({ ...propertyForm, addressLine1: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="City"
                value={propertyForm.city}
                onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
              />
              <input
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="State"
                value={propertyForm.state}
                onChange={(e) => setPropertyForm({ ...propertyForm, state: e.target.value })}
              />
              <input
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="Postal code"
                value={propertyForm.postalCode}
                onChange={(e) => setPropertyForm({ ...propertyForm, postalCode: e.target.value })}
              />
            </div>
            <div className="mt-1 flex gap-2">
              <button
                onClick={saveProperty}
                disabled={propertySaving}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {propertySaving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setEditingProperty(false)}
                className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-xl font-medium text-gray-900">{property?.name}</div>
              <div className="text-sm text-gray-500">
                {property?.addressLine1}, {property?.city}, {property?.state} {property?.postalCode}
              </div>
            </div>
            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setEditingProperty(true)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-50"
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                onClick={deleteProperty}
                className="flex items-center gap-1 rounded-lg border border-coral-200 px-2 py-1 text-coral-800 hover:bg-coral-50"
              >
                <Trash2 size={13} />
                Delete property
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      <h1 className="font-display mt-6 text-2xl font-medium text-gray-900">Units</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border border-gray-200 bg-white p-4">
        <div className="col-span-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Home size={16} className="text-brand-600" />
          Add a unit
        </div>
        {formError && (
          <div className="col-span-2 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
            {formError}
          </div>
        )}
        <input
          placeholder="Unit label (e.g. Unit 2B)"
          className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          required
        />
        <input
          type="number"
          min={0}
          placeholder="Bedrooms"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.bedrooms}
          onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
        />
        <input
          type="number"
          min={0}
          step="0.5"
          placeholder="Bathrooms"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.bathrooms}
          onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Monthly rent (RM)"
          className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.monthlyRent}
          onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
          required
        />
        <button
          disabled={submitting}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus size={15} />
          {submitting ? "Adding…" : "Add unit"}
        </button>
      </form>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {units.filter((u) => !u.archived).length} active unit(s)
          </span>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived units
          </label>
        </div>
        {deleteError && (
          <div className="mb-3 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
            {deleteError}
          </div>
        )}
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : units.length === 0 ? (
          <p className="text-sm text-gray-500">No units yet — add your first one above.</p>
        ) : (
          <ul className="space-y-2">
            {units.map((u) =>
              editingId === u.id ? (
                <li key={u.id} className="rounded-xl border-2 border-brand-500 bg-white p-4">
                  {editError && (
                    <div className="mb-2 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
                      {editError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    />
                    <input
                      type="number"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.bedrooms}
                      onChange={(e) => setEditForm({ ...editForm, bedrooms: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.5"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.bathrooms}
                      onChange={(e) => setEditForm({ ...editForm, bathrooms: e.target.value })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      value={editForm.monthlyRent}
                      onChange={(e) => setEditForm({ ...editForm, monthlyRent: e.target.value })}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => saveEdit(u.id)}
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
                <li
                  key={u.id}
                  className={`rounded-xl border border-gray-200 bg-white p-4 ${u.archived ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      {u.label}
                      {u.archived ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          Archived
                        </span>
                      ) : u.tenants.length > 0 ? (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                          Occupied
                        </span>
                      ) : (
                        <span className="rounded-full bg-sand-50 px-2 py-0.5 text-xs text-sand-600">
                          Vacant
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Bed size={13} />{u.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath size={13} />{u.bathrooms}</span>
                      <span className="flex items-center gap-1"><Wallet size={13} />RM{u.monthlyRent}/mo</span>
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {u.tenants.length > 0 ? u.tenants.map((t) => t.fullName).join(", ") : "—"}
                    </span>
                    <div className="flex gap-3 text-xs">
                      {u.archived ? (
                        <button
                          onClick={() => unarchiveUnit(u.id)}
                          disabled={busyUnitId === u.id}
                          className="flex items-center gap-1 text-brand-600 hover:underline disabled:opacity-50"
                        >
                          <ArchiveRestore size={13} />
                          {busyUnitId === u.id ? "Working…" : "Unarchive"}
                        </button>
                      ) : (
                        <>
                          <button onClick={() => startEdit(u)} className="flex items-center gap-1 text-gray-600 hover:underline">
                            <Pencil size={13} />
                            Edit
                          </button>
                          {u._count.tenants > 0 || u._count.maintenance > 0 ? (
                            <button
                              onClick={() => archiveUnit(u.id)}
                              disabled={busyUnitId === u.id}
                              className="flex items-center gap-1 text-amber-700 hover:underline disabled:opacity-50"
                            >
                              <Archive size={13} />
                              {busyUnitId === u.id ? "Working…" : "Archive"}
                            </button>
                          ) : (
                            <button
                              onClick={() => deleteUnit(u.id)}
                              disabled={busyUnitId === u.id}
                              className="flex items-center gap-1 text-coral-800 hover:underline disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              {busyUnitId === u.id ? "Working…" : "Delete"}
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

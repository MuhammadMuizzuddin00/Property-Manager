"use client";

import { useEffect, useRef, useState } from "react";
import { Wrench, Plus, AlertCircle, Loader2, CheckCircle2, XCircle, Camera, X } from "lucide-react";

type Request = {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  photoUrls: string[];
  createdAt: string;
};

const STATUS_STYLES: Record<Request["status"], string> = {
  OPEN: "bg-coral-50 text-coral-800",
  IN_PROGRESS: "bg-sand-50 text-sand-600",
  DONE: "bg-teal-50 text-teal-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const STATUS_ICON = {
  OPEN: AlertCircle,
  IN_PROGRESS: Loader2,
  DONE: CheckCircle2,
  CANCELLED: XCircle,
};

export default function PortalHome() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/portal/maintenance");
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);

    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setPhotoUrls((prev) => [...prev, data.url]);
    } else {
      setUploadError(data.error ?? "Couldn't upload that photo.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/portal/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, photoUrls }),
    });
    if (res.ok) {
      setForm({ title: "", description: "" });
      setPhotoUrls([]);
      load();
    }
  }

  return (
    <div>
      <h1 className="font-display text-xl font-medium text-gray-900">Maintenance requests</h1>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Wrench size={16} className="text-brand-600" />
          Report an issue
        </div>
        <input
          placeholder="What's the issue? (e.g. Leaking faucet)"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Describe the issue in more detail"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />

        {photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photoUrls.map((url) => (
              <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Uploaded issue photo" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  aria-label="Remove photo"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadError && <p className="text-xs text-coral-700">{uploadError}</p>}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Camera size={13} />
            {uploading ? "Uploading…" : "Add a photo"}
          </label>
        </div>

        <button className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
          <Plus size={15} />
          Submit request
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center">
            <Wrench size={20} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No requests yet.</p>
          </div>
        ) : (
          requests.map((r) => {
            const StatusIcon = STATUS_ICON[r.status];
            return (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">{r.title}</span>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${STATUS_STYLES[r.status]}`}
                  >
                    <StatusIcon size={12} className={r.status === "IN_PROGRESS" ? "animate-spin" : ""} />
                    {r.status.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{r.description}</p>
                {r.photoUrls?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.photoUrls.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt="Maintenance issue photo"
                        className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

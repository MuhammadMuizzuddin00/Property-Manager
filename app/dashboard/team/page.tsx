"use client";

import { useEffect, useState } from "react";
import { UserPlus, Send } from "lucide-react";

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: "OWNER" | "MANAGER" | "STAFF";
  createdAt: string;
};

const ROLE_STYLES: Record<Member["role"], string> = {
  OWNER: "bg-teal-50 text-teal-800",
  MANAGER: "bg-sky-50 text-sky-800",
  STAFF: "bg-gray-100 text-gray-700",
};

function initials(nameOrEmail: string) {
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  return base
    .split(/[\s._]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/team");
    const data = await res.json();
    setMembers(data.members ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setMessage(`Invite sent to ${email}. They'll join your organization once they sign up.`);
      setEmail("");
    } else {
      setError(typeof data?.error === "string" ? data.error : "Couldn't send that invite.");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-gray-900">Team</h1>
      <p className="mt-1 text-sm text-gray-500">
        Invite other landlords or managers to access this same organization&apos;s properties,
        tenants, and rent records.
      </p>

      <form onSubmit={handleInvite} className="mt-6 flex max-w-lg gap-2">
        <input
          type="email"
          placeholder="teammate@email.com"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Send size={14} />
          {submitting ? "Sending…" : "Invite"}
        </button>
      </form>

      {message && (
        <div className="mt-3 max-w-lg rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-3 max-w-lg rounded-lg border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-800">
          {error}
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
            <UserPlus size={22} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No teammates yet — invite one above.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
                    {initials(m.name || m.email)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{m.name || m.email}</div>
                    <div className="text-xs text-gray-400">{m.email}</div>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${ROLE_STYLES[m.role]}`}>
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

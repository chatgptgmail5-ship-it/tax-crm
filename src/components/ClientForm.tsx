"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Agent = { agentId: number; name: string | null };
type Clerk = { clerkId: number; name: string | null };
type Client = {
  clientId: number;
  clientName: string | null;
  lastName: string | null;
  tz: string | null;
  birthDay: Date | null;
  mobile: string | null;
  maritalStatus: string | null;
  migdar: string | null;
  clientNameSub: string | null;
  tzSub: string | null;
  birthDaySub: Date | null;
  mobileSub: string | null;
  migdarSub: string | null;
  address: string | null;
  city: string | null;
  addressPost: string | null;
  phoneHome: string | null;
  phoneWork: string | null;
  email: string | null;
  notes: string | null;
  clerkId: number | null;
  agentId: number | null;
  cp: number | null;
  cp2: number | null;
};

export function ClientForm({
  client,
  agents,
  clerks,
}: {
  client?: Client;
  agents: Agent[];
  clerks: Clerk[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toLocalDate = (d: Date | string | null) => {
    if (!d) return "";
    const x = new Date(d);
    return x.toISOString().slice(0, 10);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, unknown> = {
      clientName: fd.get("clientName") || null,
      lastName: fd.get("lastName") || null,
      tz: fd.get("tz") || null,
      birthDay: (() => {
        const s = ((fd.get("birthDay") as string) ?? "").trim();
        return s ? new Date(s).toISOString() : null;
      })(),
      mobile: fd.get("mobile") || null,
      maritalStatus: fd.get("maritalStatus") || null,
      migdar: fd.get("migdar") || null,
      clientNameSub: fd.get("clientNameSub") || null,
      tzSub: fd.get("tzSub") || null,
      birthDaySub: (() => {
        const s = ((fd.get("birthDaySub") as string) ?? "").trim();
        return s ? new Date(s).toISOString() : null;
      })(),
      mobileSub: fd.get("mobileSub") || null,
      migdarSub: fd.get("migdarSub") || null,
      address: fd.get("address") || null,
      city: fd.get("city") || null,
      addressPost: fd.get("addressPost") || null,
      phoneHome: fd.get("phoneHome") || null,
      phoneWork: fd.get("phoneWork") || null,
      email: fd.get("email") || null,
      notes: fd.get("notes") || null,
      clerkId: fd.get("clerkId") ? parseInt(fd.get("clerkId") as string) : null,
      agentId: fd.get("agentId") ? parseInt(fd.get("agentId") as string) : null,
      cp: fd.get("cp") ? parseFloat(fd.get("cp") as string) : null,
      cp2: fd.get("cp2") ? parseFloat(fd.get("cp2") as string) : null,
    };

    const url = client ? `/api/clients/${client.clientId}` : "/api/clients";
    const res = await fetch(url, {
      method: client ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "שמירה נכשלה");
      return;
    }
    router.push(`/clients/${data.clientId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="clientName" className="label block mb-1">שם פרטי</label>
          <input id="clientName" name="clientName" className="input" defaultValue={client?.clientName ?? ""} />
        </div>
        <div>
          <label htmlFor="lastName" className="label block mb-1">שם משפחה</label>
          <input id="lastName" name="lastName" className="input" defaultValue={client?.lastName ?? ""} />
        </div>
        <div>
          <label htmlFor="tz" className="label block mb-1">ת.ז.</label>
          <input id="tz" name="tz" className="input" defaultValue={client?.tz ?? ""} />
        </div>
        <div>
          <label htmlFor="birthDay" className="label block mb-1">תאריך לידה</label>
          <input
            id="birthDay"
            name="birthDay"
            type="date"
            className="input"
            defaultValue={toLocalDate(client?.birthDay ?? null)}
          />
        </div>
        <div>
          <label htmlFor="mobile" className="label block mb-1">נייד</label>
          <input id="mobile" name="mobile" className="input" defaultValue={client?.mobile ?? ""} />
        </div>
        <div>
          <label htmlFor="email" className="label block mb-1">אימייל</label>
          <input id="email" name="email" type="email" className="input" defaultValue={client?.email ?? ""} />
        </div>
        <div>
          <label htmlFor="maritalStatus" className="label block mb-1">מצב משפחתי</label>
          <input id="maritalStatus" name="maritalStatus" className="input" defaultValue={client?.maritalStatus ?? ""} />
        </div>
        <div>
          <label htmlFor="agentId" className="label block mb-1">סוכן</label>
          <select id="agentId" name="agentId" className="input" defaultValue={client?.agentId ?? ""}>
            <option value="">—</option>
            {agents.map((a) => (
              <option key={a.agentId} value={a.agentId}>{a.name ?? "—"}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="clerkId" className="label block mb-1">פקיד</label>
          <select id="clerkId" name="clerkId" className="input" defaultValue={client?.clerkId ?? ""}>
            <option value="">—</option>
            {clerks.map((c) => (
              <option key={c.clerkId} value={c.clerkId}>{c.name ?? "—"}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="address" className="label block mb-1">כתובת</label>
          <input id="address" name="address" className="input" defaultValue={client?.address ?? ""} />
        </div>
        <div>
          <label htmlFor="city" className="label block mb-1">עיר</label>
          <input id="city" name="city" className="input" defaultValue={client?.city ?? ""} />
        </div>
        <div>
          <label htmlFor="phoneHome" className="label block mb-1">טלפון בית</label>
          <input id="phoneHome" name="phoneHome" className="input" defaultValue={client?.phoneHome ?? ""} />
        </div>
        <div>
          <label htmlFor="phoneWork" className="label block mb-1">טלפון עבודה</label>
          <input id="phoneWork" name="phoneWork" className="input" defaultValue={client?.phoneWork ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="label block mb-1">הערות</label>
          <textarea id="notes" name="notes" rows={3} className="input" defaultValue={client?.notes ?? ""} />
        </div>
        <div>
          <label htmlFor="cp" className="label block mb-1">עמלה (cp)</label>
          <input id="cp" name="cp" type="number" step="0.01" className="input" defaultValue={client?.cp ?? ""} />
        </div>
        <div>
          <label htmlFor="cp2" className="label block mb-1">עמלה 2 (cp2)</label>
          <input id="cp2" name="cp2" type="number" step="0.01" className="input" defaultValue={client?.cp2 ?? ""} />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "שומר…" : client ? "עדכן לקוח" : "צור לקוח"}
        </button>
        {client && (
          <a href={`/clients/${client.clientId}`} className="btn btn-secondary">
            ביטול
          </a>
        )}
      </div>
    </form>
  );
}

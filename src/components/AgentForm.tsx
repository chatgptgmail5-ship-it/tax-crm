"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Agent = {
  agentId: number;
  name: string | null;
  contact: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  fax: string | null;
  cp: number | null;
  cp2: number | null;
};

export function AgentForm({ agent }: { agent?: Agent }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      name: fd.get("name") || null,
      contact: fd.get("contact") || null,
      mobile: fd.get("mobile") || null,
      email: fd.get("email") || null,
      address: fd.get("address") || null,
      city: fd.get("city") || null,
      phone: fd.get("phone") || null,
      fax: fd.get("fax") || null,
      cp: fd.get("cp") ? parseFloat(fd.get("cp") as string) : null,
      cp2: fd.get("cp2") ? parseFloat(fd.get("cp2") as string) : null,
    };

    const url = agent ? `/api/agents/${agent.agentId}` : "/api/agents";
    const res = await fetch(url, {
      method: agent ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "שמירה נכשלה");
      return;
    }
    router.push(`/agents/${data.agentId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label block mb-1">שם</label>
          <input id="name" name="name" className="input" required defaultValue={agent?.name ?? ""} />
        </div>
        <div>
          <label htmlFor="contact" className="label block mb-1">איש קשר</label>
          <input id="contact" name="contact" className="input" defaultValue={agent?.contact ?? ""} />
        </div>
        <div>
          <label htmlFor="mobile" className="label block mb-1">נייד</label>
          <input id="mobile" name="mobile" className="input" defaultValue={agent?.mobile ?? ""} />
        </div>
        <div>
          <label htmlFor="email" className="label block mb-1">אימייל</label>
          <input id="email" name="email" type="email" className="input" defaultValue={agent?.email ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="label block mb-1">כתובת</label>
          <input id="address" name="address" className="input" defaultValue={agent?.address ?? ""} />
        </div>
        <div>
          <label htmlFor="city" className="label block mb-1">עיר</label>
          <input id="city" name="city" className="input" defaultValue={agent?.city ?? ""} />
        </div>
        <div>
          <label htmlFor="phone" className="label block mb-1">טלפון</label>
          <input id="phone" name="phone" className="input" defaultValue={agent?.phone ?? ""} />
        </div>
        <div>
          <label htmlFor="fax" className="label block mb-1">פקס</label>
          <input id="fax" name="fax" className="input" defaultValue={agent?.fax ?? ""} />
        </div>
        <div>
          <label htmlFor="cp" className="label block mb-1">עמלת פתיחת תיק</label>
          <div className="flex items-center gap-2">
            <input id="cp" name="cp" type="number" step="0.01" min="0" className="input" defaultValue={agent?.cp ?? ""} />
            <span className="text-ink-600 shrink-0">₪</span>
          </div>
        </div>
        <div>
          <label htmlFor="cp2" className="label block mb-1">עמלת החזר</label>
          <div className="flex items-center gap-2">
            <input id="cp2" name="cp2" type="number" step="0.01" min="0" max="100" className="input" defaultValue={agent?.cp2 ?? ""} />
            <span className="text-ink-600 shrink-0">%</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "שומר…" : agent ? "עדכן סוכן" : "צור סוכן"}
        </button>
        {agent && <a href={`/agents/${agent.agentId}`} className="btn btn-secondary">ביטול</a>}
      </div>
    </form>
  );
}

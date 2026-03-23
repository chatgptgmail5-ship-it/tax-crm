"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Clerk = {
  clerkId: number;
  name: string | null;
  contact: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  squad: number | null;
};

export function ClerkForm({ clerk }: { clerk?: Clerk }) {
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
      phone: fd.get("phone") || null,
      fax: fd.get("fax") || null,
      squad: fd.get("squad") ? parseInt(fd.get("squad") as string) : null,
    };

    const url = clerk ? `/api/clerks/${clerk.clerkId}` : "/api/clerks";
    const res = await fetch(url, {
      method: clerk ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "שמירה נכשלה");
      return;
    }
    router.push(`/clerks/${data.clerkId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label block mb-1">שם</label>
          <input id="name" name="name" className="input" required defaultValue={clerk?.name ?? ""} />
        </div>
        <div>
          <label htmlFor="contact" className="label block mb-1">איש קשר</label>
          <input id="contact" name="contact" className="input" defaultValue={clerk?.contact ?? ""} />
        </div>
        <div>
          <label htmlFor="mobile" className="label block mb-1">נייד</label>
          <input id="mobile" name="mobile" className="input" defaultValue={clerk?.mobile ?? ""} />
        </div>
        <div>
          <label htmlFor="email" className="label block mb-1">אימייל</label>
          <input id="email" name="email" type="email" className="input" defaultValue={clerk?.email ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="label block mb-1">כתובת</label>
          <input id="address" name="address" className="input" defaultValue={clerk?.address ?? ""} />
        </div>
        <div>
          <label htmlFor="phone" className="label block mb-1">טלפון</label>
          <input id="phone" name="phone" className="input" defaultValue={clerk?.phone ?? ""} />
        </div>
        <div>
          <label htmlFor="fax" className="label block mb-1">פקס</label>
          <input id="fax" name="fax" className="input" defaultValue={clerk?.fax ?? ""} />
        </div>
        <div>
          <label htmlFor="squad" className="label block mb-1">צוות/קבוצה</label>
          <input id="squad" name="squad" type="number" className="input" defaultValue={clerk?.squad ?? ""} />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "שומר…" : clerk ? "עדכן פקיד" : "צור פקיד"}
        </button>
        {clerk && <a href={`/clerks/${clerk.clerkId}`} className="btn btn-secondary">ביטול</a>}
      </div>
    </form>
  );
}

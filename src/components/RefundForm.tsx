"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Client = { clientId: number; clientName: string | null; lastName: string | null };
type Refund = {
  refundId: number;
  clientId: number;
  yearId: number;
  dateSubmission: Date | null;
  amountRefund: number | null;
  dateRefund: Date | null;
  statusId: number | null;
  status?: { statusName: string | null } | null;
  notes: string | null;
};

const STATUS_OPTIONS = [
  "נפתחה בקשה",
  "ממתין לקבלת טופסי ייצוג חתומים",
  "ממתין להגשת טופסי ייצוג",
  "ממתין לקליטת ייצוג",
  "איסוף מסמכים",
  "ממתין לבדיקת מייצג",
  "ממתין לשידור דוחות לשעמ",
  "ממתין לחתימת הלקוח על הדוח",
  "ממתין להגשה למס הכנסה",
  "הוגש",
  "ממתין לעדכון חשבון בנק",
  "ממתין לקבלת ההחזר",
  "ממתין לתשלום שכר טרחה",
  "תהליך הסתיים בהצלחה",
  "לא נוכה מס",
  "הלקוח הגיש בעבר",
  "קיים חוב בשנה זו",
  "ממתין לתיקון שומה",
  "לא הוגש",
  "החזר נמוך",
  "לא נמצא החזר",
] as const;

export function RefundForm({
  refund,
  clients,
  defaultYear,
  defaultClientId,
}: {
  refund?: Refund;
  clients: Client[];
  defaultYear: number;
  defaultClientId?: number | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toLocalDate = (d: Date | string | null) => {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const dateSubmissionRaw = ((fd.get("dateSubmission") as string) ?? "").trim();
    const dateRefundRaw = ((fd.get("dateRefund") as string) ?? "").trim();
    const body = {
      clientId: parseInt(fd.get("clientId") as string),
      yearId: parseInt(fd.get("yearId") as string),
      dateSubmission: dateSubmissionRaw || null,
      amountRefund: fd.get("amountRefund") ? parseFloat(fd.get("amountRefund") as string) : null,
      dateRefund: dateRefundRaw || null,
      statusName: (fd.get("statusName") as string) || null,
      notes: (fd.get("notes") as string) || null,
    };

    const url = refund ? `/api/refunds/${refund.refundId}` : "/api/refunds";
    const res = await fetch(url, {
      method: refund ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "שמירה נכשלה");
      return;
    }
    router.push(`/refunds/${data.refundId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="clientId" className="label block mb-1">לקוח</label>
          <select
            id="clientId"
            name="clientId"
            className="input"
            required
            defaultValue={refund?.clientId ?? defaultClientId ?? ""}
          >
            <option value="">בחר לקוח</option>
            {clients.map((c) => (
              <option key={c.clientId} value={c.clientId}>
                {c.clientName} {c.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="yearId" className="label block mb-1">שנת מס</label>
          <input
            id="yearId"
            name="yearId"
            type="number"
            min="2000"
            max="2100"
            className="input"
            required
            defaultValue={refund?.yearId ?? defaultYear}
          />
        </div>
        <div>
          <label htmlFor="amountRefund" className="label block mb-1">סכום</label>
          <input
            id="amountRefund"
            name="amountRefund"
            type="number"
            step="0.01"
            className="input"
            defaultValue={refund?.amountRefund ?? ""}
          />
        </div>
        <div>
          <label htmlFor="statusName" className="label block mb-1">סטטוס</label>
          <select
            id="statusName"
            name="statusName"
            className="input"
            defaultValue={refund?.status?.statusName ?? ""}
          >
            <option value="">—</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dateSubmission" className="label block mb-1">תאריך הגשה</label>
          <input
            id="dateSubmission"
            name="dateSubmission"
            type="date"
            className="input"
            defaultValue={toLocalDate(refund?.dateSubmission ?? null)}
          />
        </div>
        <div>
          <label htmlFor="dateRefund" className="label block mb-1">תאריך החזר</label>
          <input
            id="dateRefund"
            name="dateRefund"
            type="date"
            className="input"
            defaultValue={toLocalDate(refund?.dateRefund ?? null)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="label block mb-1">הערות</label>
          <textarea id="notes" name="notes" rows={3} className="input" defaultValue={refund?.notes ?? ""} />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "שומר…" : refund ? "עדכן החזר" : "צור החזר"}
        </button>
        {refund && (
          <a href={`/refunds/${refund.refundId}`} className="btn btn-secondary">ביטול</a>
        )}
      </div>
    </form>
  );
}

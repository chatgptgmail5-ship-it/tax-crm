"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

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

const STATUS_COLORS: Record<string, string> = {
  חדש: "bg-slate-100 text-slate-700",
  "חסרים מסמכים": "bg-amber-100 text-amber-700",
  "בבדיקה": "bg-blue-100 text-blue-700",
  "מוכן להגשה": "bg-cyan-100 text-cyan-700",
  "הוגש למס הכנסה": "bg-violet-100 text-violet-700",
  הסתיים: "bg-emerald-100 text-emerald-700",
  בוטל: "bg-red-100 text-red-700",
};

type TaxCase = {
  id: number;
  taxYear: number;
  dateSubmission: Date | null;
  amountRefund: number | null;
  dateRefund: Date | null;
  notes: string | null;
  status: { id: number; statusName: string | null; color: string | null } | null;
};

type Props = {
  householdId: number;
  taxCases: TaxCase[];
  readOnly?: boolean;
};

export function TaxCasesSection({ householdId, taxCases, readOnly }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newStatusName, setNewStatusName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    const res = await fetch("/api/tax-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        householdId,
        taxYear: newYear,
        caseStatusName: newStatusName || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setAdding(false);
      router.refresh();
    }
  }

  return (
    <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200 bg-primary-50/40 px-6 py-4">
        <h3 className="font-semibold text-ink-900">תיקי מס לפי שנה</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setAdding(!adding)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            הוסף שנת מס
          </button>
        )}
      </div>

      {!readOnly && adding && (
        <div className="flex flex-wrap items-end gap-4 border-b border-ink-200 p-6">
          <div>
            <label className="label block mb-1">שנה</label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={newYear}
              onChange={(e) => setNewYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="input w-24"
            />
          </div>
          <div>
            <label className="label block mb-1">סטטוס</label>
            <select
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              className="input w-44"
            >
              <option value="">—</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "מוסיף…" : "הוסף"}
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="btn btn-secondary"
          >
            ביטול
          </button>
        </div>
      )}

      <div className="divide-y divide-ink-100">
        {taxCases.length === 0 ? (
          <p className="p-6 text-center text-ink-500">אין עדיין תיקי מס. הוסף שנת מס.</p>
        ) : (
          taxCases.map((tc) => (
            <div key={tc.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-ink-900">{tc.taxYear}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[tc.status?.statusName ?? ""] ?? "bg-ink-100 text-ink-600"
                  }`}
                >
                  {tc.status?.statusName ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-ink-600">
                <span>הגשה: {formatDate(tc.dateSubmission)}</span>
                <span>סכום: {formatCurrency(tc.amountRefund)}</span>
                <span>החזר: {formatDate(tc.dateRefund)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

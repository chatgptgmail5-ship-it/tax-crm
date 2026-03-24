"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Pencil } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ID_FIELDS, OPTIONS, GENDER_OPTIONS, MARITAL_OPTIONS, QUESTION_FIELDS } from "@/lib/questionnaire-fields";
import { calculateResult } from "@/lib/questionnaire-scoring";
import { InlineSpinner, SkeletonBlock } from "@/components/InlineSpinner";

const PHONE_ERROR = "לא נמצא מספר טלפון ללקוח";

function getClientPhone(household: { persons: { phone: string | null }[] }): string | null {
  for (const p of household.persons) {
    const raw = p.phone?.trim();
    if (raw) return raw;
  }
  return null;
}

/** Normalize phone for wa.me: 052xxxxxxx → 97252xxxxxxx */
function normalizePhone(rawPhone: string): string | null {
  let phone = rawPhone.replace(/\D/g, "");
  if (!phone) return null;
  if (phone.startsWith("0")) {
    phone = "972" + phone.slice(1);
  } else if (!phone.startsWith("972") && phone.length >= 9) {
    phone = "972" + phone;
  }
  if (phone.length < 10 || phone.length > 12) return null;
  return phone;
}

type Questionnaire = {
  id: number;
  token: string;
  dateSent: string;
  dateReceived: string | null;
  answers: Record<string, string> | null;
  result: string | null;
};

type Props = {
  householdId: number;
  household: { persons: { firstName: string | null; lastName: string | null; phone: string | null }[] };
};

function getResultColorClass(result: string | null): string {
  if (!result) return "text-ink-900";
  const trimmed = result.trim();
  if (trimmed === "לא מגיע") return "text-red-600";
  const match = trimmed.match(/(\d{1,3})\s*%/);
  if (!match) return "text-ink-900";
  const pct = Number(match[1]);
  if (pct <= 20) return "text-red-600";
  if (pct <= 70) return "text-amber-600";
  return "text-emerald-600";
}

export function RefundQuestionnaireSection({ householdId, household }: Props) {
  const [q, setQ] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editAnswers, setEditAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchLatest = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/questionnaire/latest?householdId=${householdId}`);
      if (res.ok) {
        const data = await res.json();
        setQ(data);
        setEditAnswers(data?.answers ?? {});
      }
    } catch {
      if (!silent) setQ(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  async function handleSend() {
    const clientPhone = getClientPhone(household);
    if (!clientPhone) {
      alert(PHONE_ERROR);
      return;
    }
    const phone = normalizePhone(clientPhone);
    if (!phone) {
      alert(PHONE_ERROR);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/questionnaire/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Send questionnaire API error:", { status: res.status, data });
        alert(`שגיאה בשליחת השאלון: ${data?.error ?? res.status}`);
        return;
      }
      const token = data?.token;
      if (!token) {
        console.error("Send questionnaire: no token in response", data);
        alert("שגיאה: לא התקבל קישור לשאלון");
        return;
      }
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${baseUrl}/questionnaire/${token}`;
      const message = `שלום,
מצורף שאלון לבדיקת החזר מס:

${link}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
      void fetchLatest({ silent: true });
    } catch (error) {
      console.error("Send questionnaire error:", error);
      alert("שגיאה בשליחת השאלון. בדוק קונסול.");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveEdit() {
    if (!q) return;
    const prevQ = q;
    const prevAnswers = editAnswers;
    const result = calculateResult(editAnswers);
    setQ((cur) => (cur ? { ...cur, answers: { ...editAnswers }, result } : null));
    setSaving(true);
    try {
      const res = await fetch("/api/questionnaire/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, answers: editAnswers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setQ(prevQ);
        setEditAnswers(prevAnswers);
        alert((data as { error?: string })?.error ?? "שגיאה בשמירה");
        return;
      }
      if (typeof (data as { result?: string }).result === "string") {
        setQ((cur) => (cur ? { ...cur, result: (data as { result: string }).result } : null));
      }
      setEditing(false);
    } catch (error) {
      console.error("Update questionnaire error:", error);
      setQ(prevQ);
      setEditAnswers(prevAnswers);
      alert("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
    void fetchLatest({ silent: true });
  }

  const answers = editing ? editAnswers : (q?.answers ?? {});
  const isReadOnly = q?.dateReceived != null && !editing;

  if (loading) {
    return (
      <div className="flex gap-6 flex-wrap lg:flex-nowrap" dir="rtl">
        <div className="flex-1 min-w-0 order-2 lg:order-1">
          <div className="card p-6 space-y-4">
            <SkeletonBlock className="h-10 w-40" />
            <SkeletonBlock className="h-6 w-full" />
            <SkeletonBlock className="h-32 w-full" />
            <SkeletonBlock className="h-32 w-full" />
          </div>
        </div>
        <div className="w-full lg:w-[30%] min-w-0 order-1 lg:order-2">
          <div className="card p-6 space-y-4">
            <SkeletonBlock className="h-6 w-24" />
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 flex-wrap lg:flex-nowrap" dir="rtl">
      {/* RIGHT — questionnaire (~70%) */}
      <div className="flex-1 min-w-0 order-2 lg:order-1">
        <div className="card p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !getClientPhone(household) || !normalizePhone(getClientPhone(household) ?? "")}
              className="btn btn-primary flex items-center gap-2"
            >
              {sending ? <InlineSpinner className="size-4 text-white" /> : <MessageCircle className="h-4 w-4" />}
              {sending ? "שולח…" : "שלח"}
            </button>
            {q && isReadOnly && (
              <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                ערוך
              </button>
            )}
            {editing && (
              <>
                <button type="button" onClick={handleSaveEdit} disabled={saving} className="btn btn-primary">
                  {saving ? <InlineSpinner className="size-4 text-white" /> : null}
                  {saving ? "שומר…" : "שמור"}
                </button>
                <button type="button" onClick={() => { setEditing(false); setEditAnswers(q?.answers ?? {}); }} className="btn btn-ghost">
                  ביטול
                </button>
              </>
            )}
          </div>

          <h3 className="font-semibold text-ink-800 mb-4">שאלון החזר מס</h3>

          {/* Identification — not numbered */}
          <div className="space-y-4 pb-6 border-b border-ink-200 mb-6">
            {ID_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="block font-medium text-ink-700">{f.label}</label>
                {f.sublabel && <span className="block text-xs text-ink-500">{f.sublabel}</span>}
                {f.type === "text" && (
                  <input
                    type="text"
                    value={answers[f.key] ?? ""}
                    onChange={(e) => editing && setEditAnswers((p) => ({ ...p, [f.key]: e.target.value }))}
                    readOnly={!editing}
                    className="input w-full"
                  />
                )}
                {f.type === "date" && (
                  <input
                    type="date"
                    value={answers[f.key] ?? ""}
                    onChange={(e) => editing && setEditAnswers((p) => ({ ...p, [f.key]: e.target.value }))}
                    readOnly={!editing}
                    className="input w-full"
                  />
                )}
                {f.type === "gender" && (
                  <div className="flex flex-wrap gap-4">
                    {GENDER_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={f.key}
                          value={opt}
                          checked={answers[f.key] === opt}
                          onChange={() => editing && setEditAnswers((p) => ({ ...p, [f.key]: opt }))}
                          disabled={!editing}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {f.type === "marital" && (
                  <div className="flex flex-wrap gap-4">
                    {MARITAL_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={f.key}
                          value={opt}
                          checked={answers[f.key] === opt}
                          onChange={() => editing && setEditAnswers((p) => ({ ...p, [f.key]: opt }))}
                          disabled={!editing}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Questions 1–16 — numbered */}
          {QUESTION_FIELDS.map((q, idx) => (
            <div key={q.key} className="space-y-2 pb-4 border-b border-ink-100 last:border-0 mb-4 last:mb-0">
              <label className="block font-medium text-ink-700">{idx + 1}. {q.question}</label>
              <p className="text-xs text-ink-500 whitespace-pre-line">* {q.note}</p>
              <div className="flex flex-col">
                {OPTIONS.map((opt) => {
                  const isSelected = answers[q.key] === opt;
                  return (
                    <label
                      key={opt}
                      className={`mb-2 block last:mb-0 ${editing ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div
                        className={`flex items-center gap-3 rounded-[10px] border-2 px-3 py-3 transition-colors ${
                          isSelected
                            ? "border-[#1d4ed8] bg-[#dbeafe]"
                            : "border-black bg-white hover:bg-blue-50/70"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.key}
                          value={opt}
                          checked={isSelected}
                          onChange={() => editing && setEditAnswers((p) => ({ ...p, [q.key]: opt }))}
                          disabled={!editing}
                          style={isSelected ? { accentColor: "#2563eb" } : undefined}
                          className="min-h-[1.25rem] min-w-[1.25rem] shrink-0"
                        />
                        <span
                          className={`text-ink-900 ${isSelected ? "font-semibold" : "font-normal"}`}
                        >
                          {opt}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LEFT — summary panel (~30%) */}
      <div className="w-full lg:w-[30%] min-w-0 order-1 lg:order-2">
        <div className="card p-6">
          <h3 className="font-semibold text-ink-900 mb-4">סיכום</h3>
          <dl className="space-y-4 text-sm" dir="rtl">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="m-0 shrink-0 text-ink-500">תאריך שליחה</dt>
              <dd className="m-0 font-medium tabular-nums text-ink-800">
                {q?.dateSent ? formatDateTime(q.dateSent) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="m-0 shrink-0 text-ink-500">תאריך קבלה</dt>
              <dd className="m-0 font-medium tabular-nums text-ink-800">
                {q?.dateReceived ? formatDateTime(q.dateReceived) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="m-0 shrink-0 text-ink-500">מגיע / לא מגיע החזר</dt>
              <dd className={`m-0 font-semibold tabular-nums ${getResultColorClass(q?.result ?? null)}`}>
                {q?.result ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

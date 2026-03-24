"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ID_FIELDS, OPTIONS, GENDER_OPTIONS, MARITAL_OPTIONS, QUESTION_FIELDS } from "@/lib/questionnaire-fields";
import { calculateResult } from "@/lib/questionnaire-scoring";
import { InlineSpinner, SkeletonBlock } from "@/components/InlineSpinner";
import { useCanEdit } from "@/hooks/useCanEdit";

const PHONE_ERROR = "לא נמצא מספר טלפון ללקוח";

const FINAL_STATUS_OPTIONS = ["קיבל", "לא קיבל"] as const;

function getClientPhone(household: { persons: { phone: string | null }[] }): string | null {
  for (const p of household.persons) {
    const raw = p.phone?.trim();
    if (raw) return raw;
  }
  return null;
}

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

type ArchiveRow = {
  id: number;
  householdId: number;
  fullName: string;
  submittedAt: string;
  resultText: string | null;
  finalStatus: string | null;
  answers: Record<string, string>;
};

type Props = {
  householdId: number;
  household: {
    persons: { firstName: string | null; lastName: string | null; phone: string | null; role: string | null }[];
  };
};

function getHouseholdDisplayName(household: Props["household"]): string {
  const husband = household.persons.find((p) => p.role === "husband");
  const wife = household.persons.find((p) => p.role === "wife");
  const primary = husband ?? household.persons[0];
  const a = primary ? `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() : "";
  const b = wife ? `${wife.firstName ?? ""} ${wife.lastName ?? ""}`.trim() : "";
  if (a && b) return `${a} / ${b}`;
  return a || b || "—";
}

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

/** ISO datetime → yyyy-mm-dd for `<input type="date" />` (local calendar date). */
function submittedAtToDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateInputValueToIso(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [ys, ms, ds] = trimmed.split("-");
  const y = parseInt(ys, 10);
  const m = parseInt(ms, 10);
  const day = parseInt(ds, 10);
  const d = new Date(y, m - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type InlineArchiveDraft = {
  fullName: string;
  submittedDate: string;
  resultText: string;
  finalStatus: string;
};

export function RefundQuestionnaireSection({ householdId, household }: Props) {
  const canEdit = useCanEdit();
  const [q, setQ] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editAnswers, setEditAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [archives, setArchives] = useState<ArchiveRow[]>([]);
  const [archiving, setArchiving] = useState(false);
  const [focus, setFocus] = useState<"live" | "archive">("live");
  const [selectedArchive, setSelectedArchive] = useState<ArchiveRow | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineDraft, setInlineDraft] = useState<InlineArchiveDraft | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<ArchiveRow | null>(null);
  const [archiveDeletingId, setArchiveDeletingId] = useState<number | null>(null);

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

  const fetchArchives = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/questionnaire-archive?householdId=${householdId}`);
      if (res.ok) {
        const data = await res.json();
        setArchives(Array.isArray(data) ? data : []);
      }
    } catch {
      setArchives([]);
    }
  }, [householdId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  useEffect(() => {
    void fetchArchives();
  }, [fetchArchives]);

  function backToLive() {
    setFocus("live");
    setSelectedArchive(null);
    setInlineEditingId(null);
    setInlineDraft(null);
  }

  function cancelInlineArchiveEdit() {
    setInlineEditingId(null);
    setInlineDraft(null);
  }

  function startInlineArchiveEdit(row: ArchiveRow) {
    setInlineEditingId(row.id);
    setInlineDraft({
      fullName: row.fullName,
      submittedDate: submittedAtToDateInputValue(row.submittedAt),
      resultText: row.resultText ?? "",
      finalStatus: row.finalStatus === "קיבל" || row.finalStatus === "לא קיבל" ? row.finalStatus : "",
    });
  }

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

  async function handleAddToArchive() {
    if (!q?.dateReceived || !q.answers || Object.keys(q.answers).length === 0) {
      alert("אין שאלון שהוגש לשמירה בארכיון.");
      return;
    }
    setArchiving(true);
    try {
      const res = await fetch("/api/crm/questionnaire-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          fullName: getHouseholdDisplayName(household),
          submittedAt: q.dateReceived,
          resultText: q.result ?? calculateResult(q.answers),
          answers: q.answers,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string })?.error ?? "שגיאה בשמירת ארכיון");
        return;
      }
      await fetchArchives();

      const resetRes = await fetch("/api/questionnaire/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, householdId, resetForNewEntry: true }),
      });
      const resetData = (await resetRes.json().catch(() => ({}))) as { error?: string };
      if (!resetRes.ok) {
        alert(resetData?.error ?? "הארכיון נשמר אך ניקוי השאלון נכשל. נסו שוב או רעננו את הדף.");
        return;
      }
      await fetchLatest({ silent: true });
      setEditAnswers({});
      setEditing(true);
    } catch {
      alert("שגיאה בשמירת ארכיון");
    } finally {
      setArchiving(false);
    }
  }

  async function confirmArchiveDelete() {
    if (!pendingDeleteRow) return;
    const row = pendingDeleteRow;
    setPendingDeleteRow(null);
    setArchiveDeletingId(row.id);
    try {
      const res = await fetch(`/api/crm/questionnaire-archive/${row.id}?householdId=${householdId}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        alert(data?.error ?? "שגיאה במחיקה");
        return;
      }
      setArchives((prev) => prev.filter((r) => r.id !== row.id));
      if (selectedArchive?.id === row.id) {
        backToLive();
      }
      if (inlineEditingId === row.id) {
        cancelInlineArchiveEdit();
      }
    } catch {
      alert("שגיאה במחיקה");
    } finally {
      setArchiveDeletingId(null);
    }
  }

  async function handleInlineArchiveSave() {
    if (inlineEditingId == null || !inlineDraft) return;
    const row = archives.find((r) => r.id === inlineEditingId);
    if (!row) return;
    const submittedIso = dateInputValueToIso(inlineDraft.submittedDate);
    if (!submittedIso) {
      alert("תאריך לא תקין");
      return;
    }
    setInlineSaving(true);
    try {
      const res = await fetch(`/api/crm/questionnaire-archive/${inlineEditingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          answers: row.answers,
          fullName: inlineDraft.fullName,
          submittedAt: submittedIso,
          resultText: inlineDraft.resultText.trim() || null,
          finalStatus: inlineDraft.finalStatus === "קיבל" || inlineDraft.finalStatus === "לא קיבל" ? inlineDraft.finalStatus : null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<ArchiveRow> & { error?: string };
      if (!res.ok) {
        alert(data?.error ?? "שגיאה בשמירה");
        return;
      }
      const updated: ArchiveRow = {
        id: data.id ?? row.id,
        householdId: data.householdId ?? householdId,
        fullName: data.fullName ?? inlineDraft.fullName,
        submittedAt: data.submittedAt ?? submittedIso,
        resultText: data.resultText ?? null,
        finalStatus: data.finalStatus ?? null,
        answers: (data.answers as Record<string, string>) ?? row.answers,
      };
      setSelectedArchive((cur) => (cur?.id === updated.id ? updated : cur));
      cancelInlineArchiveEdit();
      await fetchArchives();
    } catch {
      alert("שגיאה בשמירה");
    } finally {
      setInlineSaving(false);
    }
  }

  const isReadOnly = q?.dateReceived != null && !editing;
  const fieldEditable = focus === "live" && editing;
  const displayAnswers = focus === "live" ? (editing ? editAnswers : (q?.answers ?? {})) : (selectedArchive?.answers ?? {});

  const summaryDateSent = focus === "live" ? q?.dateSent : null;
  const summaryDateReceived = focus === "live" ? q?.dateReceived : selectedArchive?.submittedAt ?? null;
  const summaryResult = focus === "live" ? q?.result ?? null : selectedArchive?.resultText ?? null;

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
        <div className="w-full lg:w-[40%] min-w-0 order-1 lg:order-2">
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
    <>
      <div className="flex gap-6 flex-wrap lg:flex-nowrap" dir="rtl">
      <div className="flex-1 min-w-0 order-2 lg:order-1">
        <div className="card p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              type="button"
              onClick={handleSend}
              disabled={
                focus !== "live" ||
                sending ||
                !getClientPhone(household) ||
                !normalizePhone(getClientPhone(household) ?? "")
              }
              className="btn btn-primary flex items-center gap-2"
            >
              {sending ? <InlineSpinner className="size-4 text-white" /> : <MessageCircle className="h-4 w-4" />}
              {sending ? "שולח…" : "שלח"}
            </button>
            {focus === "live" && q && isReadOnly && (
              <>
                {canEdit && (
                  <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    ערוך
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void handleAddToArchive()}
                    disabled={archiving}
                    className="btn btn-secondary flex items-center gap-2 text-sm"
                  >
                    {archiving ? <InlineSpinner className="size-4" /> : null}
                    הכנס לרשימה
                  </button>
                )}
              </>
            )}
            {focus === "live" && editing && canEdit && (
              <>
                <button type="button" onClick={handleSaveEdit} disabled={saving} className="btn btn-primary">
                  {saving ? <InlineSpinner className="size-4 text-white" /> : null}
                  {saving ? "שומר…" : "שמור"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditAnswers(q?.answers ?? {});
                  }}
                  className="btn btn-ghost"
                >
                  ביטול
                </button>
              </>
            )}
            {focus === "archive" && (
              <button type="button" onClick={backToLive} className="btn btn-ghost text-sm">
                חזרה לשאלון נוכחי
              </button>
            )}
          </div>

          <h3 className="font-semibold text-ink-800 mb-4">
            שאלון החזר מס
            {focus === "archive" ? (
              <span className="me-2 text-sm font-normal text-amber-700">(צפייה בארכיון)</span>
            ) : null}
          </h3>

          <div className="space-y-4 pb-6 border-b border-ink-200 mb-6">
            {ID_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="block font-medium text-ink-700">{f.label}</label>
                {f.sublabel && <span className="block text-xs text-ink-500">{f.sublabel}</span>}
                {f.type === "text" && (
                  <input
                    type="text"
                    value={displayAnswers[f.key] ?? ""}
                    onChange={(e) => {
                      if (!fieldEditable) return;
                      setEditAnswers((p) => ({ ...p, [f.key]: e.target.value }));
                    }}
                    readOnly={!fieldEditable}
                    className="input w-full"
                  />
                )}
                {f.type === "date" && (
                  <input
                    type="date"
                    value={displayAnswers[f.key] ?? ""}
                    onChange={(e) => {
                      if (!fieldEditable) return;
                      setEditAnswers((p) => ({ ...p, [f.key]: e.target.value }));
                    }}
                    readOnly={!fieldEditable}
                    className="input w-full"
                  />
                )}
                {f.type === "gender" && (
                  <div className="flex flex-wrap gap-4">
                    {GENDER_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`${focus}-${f.key}`}
                          value={opt}
                          checked={displayAnswers[f.key] === opt}
                          onChange={() => {
                            if (!fieldEditable) return;
                            setEditAnswers((p) => ({ ...p, [f.key]: opt }));
                          }}
                          disabled={!fieldEditable}
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
                          name={`${focus}-${f.key}`}
                          value={opt}
                          checked={displayAnswers[f.key] === opt}
                          onChange={() => {
                            if (!fieldEditable) return;
                            setEditAnswers((p) => ({ ...p, [f.key]: opt }));
                          }}
                          disabled={!fieldEditable}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {QUESTION_FIELDS.map((qf, idx) => (
            <div key={qf.key} className="space-y-2 pb-4 border-b border-ink-100 last:border-0 mb-4 last:mb-0">
              <label className="block font-medium text-ink-700">
                {idx + 1}. {qf.question}
              </label>
              <p className="text-xs text-ink-500 whitespace-pre-line">* {qf.note}</p>
              <div className="flex flex-col">
                {OPTIONS.map((opt) => {
                  const isSelected = displayAnswers[qf.key] === opt;
                  return (
                    <label
                      key={opt}
                      className={`mb-2 block last:mb-0 ${fieldEditable ? "cursor-pointer" : "cursor-default"}`}
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
                          name={`${focus}-${qf.key}`}
                          value={opt}
                          checked={isSelected}
                          onChange={() => {
                            if (!fieldEditable) return;
                            setEditAnswers((p) => ({ ...p, [qf.key]: opt }));
                          }}
                          disabled={!fieldEditable}
                          style={isSelected ? { accentColor: "#2563eb" } : undefined}
                          className="min-h-[1.25rem] min-w-[1.25rem] shrink-0"
                        />
                        <span className={`text-ink-900 ${isSelected ? "font-semibold" : "font-normal"}`}>{opt}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-[40%] min-w-0 order-1 lg:order-2 space-y-4">
        <div className="card p-6">
          <h3 className="font-semibold text-ink-900 mb-4">סיכום</h3>
          <dl className="space-y-4 text-sm" dir="rtl">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="m-0 shrink-0 text-ink-500">תאריך שליחה</dt>
              <dd className="m-0 font-medium tabular-nums text-ink-800">
                {summaryDateSent ? formatDateTime(summaryDateSent) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="m-0 shrink-0 text-ink-500">תאריך קבלה</dt>
              <dd className="m-0 font-medium tabular-nums text-ink-800">
                {summaryDateReceived ? formatDateTime(summaryDateReceived) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="m-0 shrink-0 text-ink-500">מגיע / לא מגיע החזר</dt>
              <dd className={`m-0 font-semibold tabular-nums ${getResultColorClass(summaryResult)}`}>
                {summaryResult ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-6 min-w-0">
          <h4 className="font-semibold text-ink-900 mb-3 text-sm">ארכיון שאלונים</h4>
          {archives.length === 0 ? (
            <p className="text-sm text-ink-500">אין רשומות בארכיון.</p>
          ) : (
            <table className="w-full text-xs text-center">
              <thead>
                <tr className="border-b border-ink-200">
                  <th className="px-2 py-2 font-medium text-ink-700 text-center align-middle">שם</th>
                  <th className="px-2 py-2 font-medium text-ink-700 text-center align-middle">תאריך</th>
                  <th className="px-2 py-2 font-medium text-ink-700 text-center align-middle">מגיע / לא מגיע</th>
                  <th className="px-2 py-2 font-medium text-ink-700 text-center align-middle">סופי</th>
                  <th className="px-2 py-2 font-medium text-ink-700 text-center align-middle">פעולה</th>
                </tr>
              </thead>
              <tbody>
                {archives.map((row) => {
                  const isRowEditing = inlineEditingId === row.id && inlineDraft != null;
                  const finalView =
                    row.finalStatus === "קיבל" || row.finalStatus === "לא קיבל" ? row.finalStatus : "—";
                  return (
                    <tr key={row.id} className="border-b border-ink-100">
                      {isRowEditing && inlineDraft ? (
                        <>
                          <td className="px-2 py-2 align-middle">
                            <input
                              type="text"
                              value={inlineDraft.fullName}
                              onChange={(e) => setInlineDraft((d) => (d ? { ...d, fullName: e.target.value } : d))}
                              className="input w-full max-w-[11rem] mx-auto py-1.5 text-xs text-center"
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <input
                              type="date"
                              value={inlineDraft.submittedDate}
                              onChange={(e) => setInlineDraft((d) => (d ? { ...d, submittedDate: e.target.value } : d))}
                              className="input w-full max-w-[10.5rem] mx-auto py-1.5 text-xs text-center"
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <input
                              type="text"
                              value={inlineDraft.resultText}
                              onChange={(e) => setInlineDraft((d) => (d ? { ...d, resultText: e.target.value } : d))}
                              className="input w-full max-w-[9rem] mx-auto py-1.5 text-xs text-center"
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <select
                              value={inlineDraft.finalStatus}
                              onChange={(e) => setInlineDraft((d) => (d ? { ...d, finalStatus: e.target.value } : d))}
                              className="input w-full max-w-[7.5rem] mx-auto py-1.5 text-xs text-center"
                            >
                              <option value="">—</option>
                              {FINAL_STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 align-middle whitespace-nowrap">
                            <button
                              type="button"
                              className="text-primary-600 hover:underline ms-1"
                              disabled={inlineSaving}
                              onClick={() => void handleInlineArchiveSave()}
                            >
                              {inlineSaving ? "שומר…" : "שמור"}
                            </button>
                            <button
                              type="button"
                              className="text-ink-600 hover:underline ms-2"
                              disabled={inlineSaving}
                              onClick={cancelInlineArchiveEdit}
                            >
                              ביטול
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-2 text-ink-800 text-center align-middle">{row.fullName}</td>
                          <td className="px-2 py-2 tabular-nums text-ink-600 text-center align-middle">
                            {formatDateTime(row.submittedAt)}
                          </td>
                          <td
                            className={`px-2 py-2 font-medium text-center align-middle ${getResultColorClass(row.resultText)}`}
                          >
                            {row.resultText ?? "—"}
                          </td>
                          <td className="px-2 py-2 text-ink-800 text-center align-middle font-medium">{finalView}</td>
                          <td className="px-2 py-2 whitespace-nowrap text-center align-middle">
                            <button
                              type="button"
                              className="text-primary-600 hover:underline ms-1"
                              onClick={() => {
                                cancelInlineArchiveEdit();
                                setFocus("archive");
                                setSelectedArchive(row);
                              }}
                            >
                              צפה
                            </button>
                            {canEdit ? (
                              <button
                                type="button"
                                className="text-primary-600 hover:underline ms-2"
                                onClick={() => startInlineArchiveEdit(row)}
                              >
                                ערוך
                              </button>
                            ) : null}
                            {canEdit ? (
                              <button
                                type="button"
                                className="inline-flex items-center justify-center ms-2 p-1 rounded text-ink-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 align-middle"
                                title="מחק"
                                disabled={archiveDeletingId === row.id}
                                aria-label="מחק רשומת ארכיון"
                                onClick={() => setPendingDeleteRow(row)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>

      {pendingDeleteRow ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-delete-confirm-title"
        >
          <div className="card p-6 max-w-md w-full shadow-lg">
            <p id="archive-delete-confirm-title" className="text-sm text-ink-800">
              האם אתה בטוח שברצונך למחוק את הרשומה?
            </p>
            <div className="flex flex-wrap gap-2 justify-end mt-6">
              <button type="button" className="btn btn-ghost" onClick={() => setPendingDeleteRow(null)}>
                ביטול
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={archiveDeletingId != null}
                onClick={() => void confirmArchiveDelete()}
              >
                כן
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

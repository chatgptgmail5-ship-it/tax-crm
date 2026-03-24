"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useCanEdit } from "@/hooks/useCanEdit";
import { formatDate } from "@/lib/utils";

type ImportantDate = {
  id: number;
  date: string;
  performerId: number | null;
  subject: string | null;
  details: string | null;
  performer: { id: number; name: string | null } | null;
};

type UserOption = { id: number; name: string | null };

type Props = {
  householdId: number;
  readOnly?: boolean;
};

function getFirstFiveWords(text: string | null): { preview: string; hasMore: boolean } {
  if (!text || !text.trim()) return { preview: "—", hasMore: false };
  const words = text.trim().split(/\s+/);
  if (words.length <= 5) return { preview: text.trim(), hasMore: false };
  return { preview: words.slice(0, 5).join(" "), hasMore: true };
}

export function ImportantDatesSection({ householdId, readOnly }: Props) {
  const canEdit = useCanEdit();
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedDetailsIds, setExpandedDetailsIds] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    performerId: "" as string | number,
    subject: "",
    details: "",
  });

  const fetchDates = useCallback(async () => {
    const res = await fetch(`/api/households/${householdId}/important-dates`);
    if (res.ok) {
      const data = await res.json();
      setDates(Array.isArray(data) ? data : []);
    }
  }, [householdId]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchDates(), fetchUsers()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchDates, fetchUsers]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/households/${householdId}/important-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        performerId: form.performerId ? Number(form.performerId) : null,
        subject: form.subject.trim() || null,
        details: form.details.trim() || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const today = new Date().toISOString().slice(0, 10);
      setForm({ date: today, performerId: "", subject: "", details: "" });
      setShowForm(false);
      fetchDates();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק את התאריך?")) return;
    const res = await fetch(`/api/important-dates/${id}`, { method: "DELETE" });
    if (res.ok) fetchDates();
  }

  function toggleDetailsExpanded(id: number) {
    setExpandedDetailsIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-ink-900">תאריכים חשובים</h3>
        <p className="text-center text-ink-500">טוען...</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-200 bg-primary-50/40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-semibold text-ink-900">תאריכים חשובים</h3>
        {!readOnly && canEdit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            הוסף תאריך
          </button>
        )}
      </div>

      {!readOnly && canEdit && showForm && (
        <form onSubmit={handleAdd} className="p-6 border-b border-ink-200 bg-primary-50/30">
          <h4 className="mb-4 font-medium text-ink-800">הוסף תאריך חשוב</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label block mb-1 text-xs">תאריך</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">שם המבצע</label>
              <select
                value={String(form.performerId)}
                onChange={(e) => setForm((p) => ({ ...p, performerId: e.target.value }))}
                className="input"
              >
                <option value="">—</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1 text-xs">נושא</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className="input"
                placeholder="3–5 מילים"
                maxLength={80}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label block mb-1 text-xs">פרטים</label>
            <textarea
              value={form.details}
              onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
              className="input min-h-[80px] w-full"
              rows={3}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "שומר…" : "הוסף"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right" dir="rtl">
          <thead>
            <tr className="border-b border-ink-200 bg-primary-50/40">
              <th className="px-6 py-4 font-medium text-ink-700 text-center">תאריך</th>
              <th className="px-6 py-4 font-medium text-ink-700 text-center">שם המבצע</th>
              <th className="px-6 py-4 font-medium text-ink-700 text-center">נושא</th>
              <th className="px-6 py-4 font-medium text-ink-700 text-center">פרטים</th>
              {!readOnly && canEdit && (
                <th className="px-6 py-4 font-medium text-ink-700 text-center">פעולה</th>
              )}
            </tr>
          </thead>
          <tbody>
            {dates.length === 0 ? (
              <tr>
                <td colSpan={!readOnly && canEdit ? 5 : 4} className="px-6 py-8 text-center text-ink-500">
                  אין תאריכים. השתמש בכפתור &quot;הוסף תאריך&quot; להוספה.
                </td>
              </tr>
            ) : (
              dates.map((d) => (
                <tr key={d.id} className="border-b border-ink-100 transition-colors hover:bg-primary-50/50">
                  <td className="px-6 py-4 text-center">{formatDate(d.date)}</td>
                  <td className="px-6 py-4 text-center">{d.performer?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-center">{d.subject ?? "—"}</td>
                  <td className="px-6 py-4 text-right align-top">
                    {expandedDetailsIds.has(d.id) ? (
                      <div className="space-y-1">
                        <div className="whitespace-pre-wrap break-words">{d.details ?? "—"}</div>
                        <button
                          type="button"
                          onClick={() => toggleDetailsExpanded(d.id)}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          צמצם
                        </button>
                      </div>
                    ) : (() => {
                      const { preview, hasMore } = getFirstFiveWords(d.details);
                      return (
                        <div className="space-y-1">
                          <div className="whitespace-pre-wrap break-words">{preview}</div>
                          {hasMore && (
                            <button
                              type="button"
                              onClick={() => toggleDetailsExpanded(d.id)}
                              className="text-primary-600 hover:underline text-sm"
                            >
                              המשך קריאה
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  {!readOnly && canEdit && (
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="מחק"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

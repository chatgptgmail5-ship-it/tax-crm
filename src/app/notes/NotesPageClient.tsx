"use client";

import { useCallback, useEffect, useState } from "react";
import { useCanEdit } from "@/hooks/useCanEdit";

type Priority = "low" | "medium" | "high";

type NoteDto = {
  id: number;
  content: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "עדיפות נמוכה",
  medium: "עדיפות בינונית",
  high: "עדיפות גבוהה",
};

const PRIORITIES: Priority[] = ["low", "medium", "high"];

function priorityBadgeClass(priority: string): string {
  if (priority === "low") {
    return "rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700";
  }
  if (priority === "medium") {
    return "rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800";
  }
  if (priority === "high") {
    return "rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700";
  }
  return "rounded-full bg-ink-100 px-2 py-0.5 text-ink-700";
}

/** Vertical strip on card inline-start (physical right in RTL). */
function priorityStripClass(priority: string): string {
  if (priority === "low") return "bg-emerald-500";
  if (priority === "medium") return "bg-amber-500";
  if (priority === "high") return "bg-red-500";
  return "bg-ink-300";
}

function notifyNotesChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notes-changed"));
  }
}

export function NotesPageClient() {
  const canEdit = useCanEdit();
  const [view, setView] = useState<"main" | "archive">("main");
  const [notesOpen, setNotesOpen] = useState<NoteDto[]>([]);
  const [notesArchived, setNotesArchived] = useState<NoteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [filterPickerOpen, setFilterPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [pendingRestoreId, setPendingRestoreId] = useState<number | null>(null);
  const [pendingArchiveDeleteId, setPendingArchiveDeleteId] = useState<number | null>(null);

  const fetchOpen = useCallback(async () => {
    const res = await fetch("/api/notes?status=open");
    if (!res.ok) return;
    const data = (await res.json()) as NoteDto[];
    setNotesOpen(Array.isArray(data) ? data : []);
  }, []);

  const fetchArchived = useCallback(async () => {
    const res = await fetch("/api/notes?status=archived");
    if (!res.ok) return;
    const data = (await res.json()) as NoteDto[];
    setNotesArchived(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchOpen();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOpen]);

  useEffect(() => {
    if (view !== "archive") return;
    void fetchArchived();
  }, [view, fetchArchived]);

  const displayedOpen =
    filterPriority === null ? notesOpen : notesOpen.filter((n) => n.priority === filterPriority);

  function cancelCreateDraft() {
    setCreating(false);
    setDraftContent("");
    setShowPriorityModal(false);
  }

  function handleToggleCreate() {
    if (!creating) {
      setCreating(true);
      return;
    }
    const trimmed = draftContent.trim();
    if (!trimmed) {
      alert("הזן תוכן להערה");
      return;
    }
    setShowPriorityModal(true);
  }

  async function createWithPriority(priority: Priority) {
    const trimmed = draftContent.trim();
    if (!trimmed) return;
    setShowPriorityModal(false);
    setSavingId(-1);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, priority }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error ?? "שגיאה ביצירת הערה");
        return;
      }
      const note = data as NoteDto;
      setNotesOpen((prev) => [note, ...prev]);
      setDraftContent("");
      setCreating(false);
      notifyNotesChanged();
    } catch {
      alert("שגיאה ביצירת הערה");
    } finally {
      setSavingId(null);
    }
  }

  async function saveEdit(id: number) {
    const trimmed = editDraft.trim();
    if (!trimmed) {
      alert("תוכן לא יכול להיות ריק");
      return;
    }
    setSavingId(id);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error ?? "שגיאה בשמירה");
        return;
      }
      const updated = data as NoteDto;
      setNotesOpen((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setEditingId(null);
      notifyNotesChanged();
    } catch {
      alert("שגיאה בשמירה");
    } finally {
      setSavingId(null);
    }
  }

  async function confirmArchive() {
    if (pendingArchiveId == null) return;
    const id = pendingArchiveId;
    setPendingArchiveId(null);
    setSavingId(id);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error ?? "שגיאה");
        return;
      }
      const updated = data as NoteDto;
      setNotesOpen((prev) => prev.filter((n) => n.id !== id));
      setNotesArchived((prev) => [updated, ...prev]);
      if (editingId === id) setEditingId(null);
      notifyNotesChanged();
    } catch {
      alert("שגיאה");
    } finally {
      setSavingId(null);
    }
  }

  async function confirmRestore() {
    if (pendingRestoreId == null) return;
    const id = pendingRestoreId;
    setPendingRestoreId(null);
    setSavingId(id);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error ?? "שגיאה בשחזור");
        return;
      }
      const updated = data as NoteDto;
      setNotesArchived((prev) => prev.filter((n) => n.id !== id));
      setNotesOpen((prev) => [updated, ...prev]);
      notifyNotesChanged();
    } catch {
      alert("שגיאה בשחזור");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteNoteById(id: number) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error ?? "שגיאה במחיקה");
        return;
      }
      setNotesOpen((prev) => prev.filter((n) => n.id !== id));
      setNotesArchived((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) setEditingId(null);
      notifyNotesChanged();
    } catch {
      alert("שגיאה במחיקה");
    } finally {
      setSavingId(null);
    }
  }

  async function runDelete(id: number) {
    setPendingDeleteId(null);
    await deleteNoteById(id);
  }

  async function confirmArchiveDelete() {
    if (pendingArchiveDeleteId == null) return;
    const id = pendingArchiveDeleteId;
    setPendingArchiveDeleteId(null);
    await deleteNoteById(id);
  }

  function startEdit(n: NoteDto) {
    setEditingId(n.id);
    setEditDraft(n.content);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ink-900">הערות</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && view === "main" ? (
            <button type="button" className="btn btn-primary text-sm" onClick={handleToggleCreate}>
              {creating ? "סגור הערה" : "צור הערה"}
            </button>
          ) : null}
          {view === "main" ? (
            filterPriority === null ? (
              <div className="relative">
                <button
                  type="button"
                  className="btn btn-secondary text-sm"
                  onClick={() => setFilterPickerOpen((v) => !v)}
                >
                  סנן לפי עדיפות
                </button>
                {filterPickerOpen ? (
                  <div className="absolute end-0 top-full z-20 mt-1 flex min-w-[12rem] flex-col gap-1 rounded-lg border border-ink-200 bg-white p-2 shadow-md">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="rounded px-3 py-2 text-start text-sm text-ink-800 hover:bg-primary-50"
                        onClick={() => {
                          setFilterPriority(p);
                          setFilterPickerOpen(false);
                        }}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary text-sm"
                onClick={() => setFilterPriority(null)}
              >
                חזור לרשימה הרגילה
              </button>
            )
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => {
              setView((v) => (v === "archive" ? "main" : "archive"));
              setFilterPickerOpen(false);
              setCreating(false);
              setDraftContent("");
              setShowPriorityModal(false);
            }}
          >
            {view === "archive" ? "חזרה להערות הפתוחות" : "ארכיון הערות"}
          </button>
        </div>
      </div>

      {canEdit && view === "main" && creating ? (
        <div className="card space-y-3 p-4">
          <textarea
            className="input min-h-[8rem] w-full resize-y py-2"
            placeholder="כתוב כאן את ההערה…"
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            dir="rtl"
          />
          <button type="button" className="btn btn-ghost text-sm" onClick={cancelCreateDraft}>
            בטל
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="card p-6 text-center text-ink-500">טוען…</div>
      ) : view === "archive" ? (
        notesArchived.length === 0 ? (
          <div className="card p-6">
            <p className="text-center text-ink-500">אין הערות בארכיון</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {notesArchived.map((n) => (
              <li key={n.id} className="card flex min-w-0 overflow-hidden p-0">
                <div
                  className={`w-1.5 shrink-0 self-stretch rounded-s-lg ${priorityStripClass(n.priority)}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 p-4">
                  <p className="text-sm whitespace-pre-wrap text-ink-900">{n.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className={priorityBadgeClass(n.priority)}>
                      {(PRIORITY_LABELS as Record<string, string>)[n.priority] ?? n.priority}
                    </span>
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-ink-600">סגורה</span>
                  </div>
                  {canEdit ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary text-sm"
                        disabled={savingId === n.id}
                        onClick={() => setPendingRestoreId(n.id)}
                      >
                        שחזור
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-sm text-red-600 hover:text-red-700"
                        disabled={savingId === n.id}
                        onClick={() => setPendingArchiveDeleteId(n.id)}
                      >
                        מחק
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : displayedOpen.length === 0 ? (
        <div className="card p-6">
          <p className="text-center text-ink-500">
            {filterPriority != null && notesOpen.length > 0
              ? "אין הערות התואמות לסינון"
              : "אין הערות עדיין"}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {displayedOpen.map((n) => (
            <li key={n.id} className="card flex min-w-0 overflow-hidden p-0">
              <div
                className={`w-1.5 shrink-0 self-stretch rounded-s-lg ${priorityStripClass(n.priority)}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1 p-4">
                {editingId === n.id ? (
                  <div className="space-y-3">
                    <textarea
                      className="input min-h-[6rem] w-full resize-y py-2"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      dir="rtl"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary text-sm"
                        disabled={savingId === n.id}
                        onClick={() => void saveEdit(n.id)}
                      >
                        שמור
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-sm"
                        disabled={savingId === n.id}
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft("");
                        }}
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap text-ink-900">{n.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className={priorityBadgeClass(n.priority)}>
                        {(PRIORITY_LABELS as Record<string, string>)[n.priority] ?? n.priority}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">פתוחה</span>
                    </div>
                    {canEdit ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost text-sm"
                          disabled={savingId === n.id}
                          onClick={() => startEdit(n)}
                        >
                          ערוך
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost text-sm text-red-600 hover:text-red-700"
                          disabled={savingId === n.id}
                          onClick={() => setPendingDeleteId(n.id)}
                        >
                          מחק
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary text-sm"
                          disabled={savingId === n.id}
                          onClick={() => setPendingArchiveId(n.id)}
                        >
                          הערה סגורה
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showPriorityModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="card p-6 max-w-md w-full shadow-lg space-y-4">
            <p className="text-sm text-ink-800">בחר רמת עדיפות לפני סגירת ההערה</p>
            <div className="flex flex-col gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="btn btn-secondary w-full justify-center text-sm"
                  disabled={savingId === -1}
                  onClick={() => void createWithPriority(p)}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost w-full text-sm"
              onClick={() => setShowPriorityModal(false)}
            >
              ביטול
            </button>
          </div>
        </div>
      ) : null}

      {pendingArchiveId != null ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="card p-6 max-w-md w-full shadow-lg space-y-4">
            <p className="text-sm text-ink-800">להעביר אותה לארכיון ההערות?</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setPendingArchiveId(null)}>
                לא
              </button>
              <button type="button" className="btn btn-primary text-sm" onClick={() => void confirmArchive()}>
                כן
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteId != null ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="card p-6 max-w-md w-full shadow-lg space-y-4">
            <p className="text-sm text-ink-800">למחוק את ההערה לצמיתות?</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setPendingDeleteId(null)}>
                ביטול
              </button>
              <button
                type="button"
                className="btn btn-primary text-sm"
                onClick={() => void runDelete(pendingDeleteId)}
              >
                כן
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingRestoreId != null ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="card p-6 max-w-md w-full shadow-lg space-y-4">
            <p className="text-sm text-ink-800">לשחזר הערה?</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setPendingRestoreId(null)}>
                לא
              </button>
              <button type="button" className="btn btn-primary text-sm" onClick={() => void confirmRestore()}>
                כן
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingArchiveDeleteId != null ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="card p-6 max-w-md w-full shadow-lg space-y-4">
            <p className="text-sm text-ink-800">למחוק הערה?</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setPendingArchiveDeleteId(null)}>
                לא
              </button>
              <button type="button" className="btn btn-primary text-sm" onClick={() => void confirmArchiveDelete()}>
                כן
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

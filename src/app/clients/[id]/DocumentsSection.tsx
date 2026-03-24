"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const DOCUMENT_TYPES = [
  "אישור נטול יכולת / ועדת השמה",
  "אישור פריסת מס",
  "אישור תושב ספר",
  "אישורי מס ביטוחים",
  "הסכם גירושין",
  "הסכם שכר טרחה",
  "חשבונית עמלת פתיחת תיק",
  "חשבונית שכר טרחה",
  "ייפוי כוח ביטוח לאומי – בן הזוג הרשום",
  "ייפוי כוח ביטוח לאומי – בן/בת הזוג",
  "ייפוי כוח מס הכנסה",
  "פטור ממס הכנסה",
  "צילום שיק / אישור ניהול חשבון בנק",
  "שאלון שכיר",
  "שומת מס שבח מקרקעין",
  "שונות",
  "סיכום החזרים",
  "תעודת זכאות לתואר אקדמי",
  "תעודת זהות וספח – בן הזוג הרשום",
  "תעודת זהות וספח – בן/בת הזוג",
  "תעודת עולה חדש",
  "תעודת שחרור מצה״ל",
  "תצהיר עובדות לשכיר",
  "תצהיר פרודים",
  "טופס 867 – ניירות ערך / פיקדונות",
].sort((a, b) => a.localeCompare(b, "he"));

type Doc = {
  id: number;
  customName: string | null;
  fileName: string | null;
  filePath: string | null;
  notes: string | null;
  documentCreatedAt: Date | null;
  uploadedAt: Date;
};

type Props = {
  householdId: number;
  documents: Doc[];
  readOnly?: boolean;
};

export function DocumentsSection({ householdId, documents, readOnly }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [promptType, setPromptType] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUploadClick() {
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
    setSelectedType(DOCUMENT_TYPES[0] ?? "");
    setPromptType(true);
  }

  async function handleTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = pendingFile;
    const customName = selectedType.trim() || null;
    if (!file) {
      setPromptType(false);
      setPendingFile(null);
      return;
    }
    setUploading(true);
    setPromptType(false);
    setPendingFile(null);
    setSelectedType("");

    const form = new FormData();
    form.append("file", file);
    form.append("customName", customName ?? "");
    if (file.lastModified) {
      form.append(
        "documentCreatedAt",
        new Date(file.lastModified).toISOString().slice(0, 10)
      );
    }
    const res = await fetch(`/api/households/${householdId}/documents`, {
      method: "POST",
      body: form,
    });
    setUploading(false);
    if (res.ok) router.refresh();
  }

  function handleCancelType() {
    setPromptType(false);
    setPendingFile(null);
    setSelectedType("");
  }

  async function handleNotesBlur(docId: number, notes: string) {
    const res = await fetch(
      `/api/households/${householdId}/documents/${docId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || null }),
      }
    );
    if (res.ok) router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק את המסמך?")) return;
    setDeleting(id);
    const res = await fetch(`/api/households/${householdId}/documents/${id}`, {
      method: "DELETE",
    });
    setDeleting(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-200 bg-primary-50/40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-semibold text-ink-900">מסמכים</h3>
        {!readOnly && (
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="*/*"
            />
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="btn btn-primary"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "מעלה…" : "העלה"}
            </button>
          </div>
        )}
      </div>

      {!readOnly && promptType && (
        <div className="border-b border-ink-200 bg-primary-50/30 px-6 py-4">
          <form onSubmit={handleTypeSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="doc-type" className="label block mb-1 text-sm">
                סוג מסמך
              </label>
              <select
                id="doc-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input"
                dir="rtl"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              הוסף מסמך
            </button>
            <button type="button" onClick={handleCancelType} className="btn btn-ghost">
              ביטול
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right" dir="rtl">
          <thead>
            <tr className="border-b border-ink-200 bg-primary-50/40">
              <th className="px-4 py-3 font-semibold text-ink-900 text-center">שם</th>
              <th className="px-4 py-3 font-semibold text-ink-900 text-center">מסמך</th>
              <th className="px-4 py-3 font-semibold text-ink-900 text-center">הערות</th>
              <th className="px-4 py-3 font-semibold text-ink-900 text-center">נוצר ב:</th>
              <th className="px-4 py-3 font-semibold text-ink-900 text-center">הועלה ב:</th>
              {!readOnly && <th className="px-4 py-3 font-semibold text-ink-900 text-center">פעולה</th>}
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="px-6 py-8 text-center text-ink-500">
                  אין מסמכים — לחץ על הכפתור &quot;העלה&quot; להוספה
                </td>
              </tr>
            ) : (
              documents.map((d) => (
                <tr key={d.id} className="border-b border-ink-100 transition-colors hover:bg-primary-50/50">
                  <td className="px-4 py-3 text-center">{d.customName ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {d.filePath ? (
                      <a
                        href={`/api/uploads/${d.filePath
                          .split("/")
                          .map(encodeURIComponent)
                          .join("/")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {d.fileName ?? "קובץ"}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {readOnly ? (
                      d.notes ?? "—"
                    ) : (
                      <input
                        type="text"
                        defaultValue={d.notes ?? ""}
                        onBlur={(e) =>
                          handleNotesBlur(d.id, e.target.value.trim())
                        }
                        className="input py-1.5 text-xs min-w-[120px] max-w-[200px]"
                        placeholder="הערות…"
                        dir="rtl"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{formatDateTime(d.documentCreatedAt)}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{formatDateTime(d.uploadedAt)}</td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        disabled={deleting === d.id}
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

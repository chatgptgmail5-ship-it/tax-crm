"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { CanEditGate } from "@/components/CanEditGate";
import { formatDate } from "@/lib/utils";

type Row = { id: number; clientName: string; templateType: string; createdAt: Date };

type Props = { rows: Row[] };

export function GeneratedDocumentsTable({ rows }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("למחוק את המסמך?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/generated-documents/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm" dir="rtl">
        <thead>
          <tr className="border-b border-ink-200 bg-primary-50/40">
            <th className="px-6 py-4 font-medium text-ink-700 text-center">שם הלקוח</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">סוג המסמך</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">תאריך יצירה</th>
            <th className="px-6 py-4 text-center">פעולה</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-ink-500">
                אין מסמכים. השתמש ב&quot;מחולל מסמכים&quot; ליצירת מסמך.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-ink-100 transition-colors hover:bg-primary-50/50">
                <td className="px-6 py-4 text-center">{r.clientName}</td>
                <td className="px-6 py-4 text-center">{r.templateType}</td>
                <td className="px-6 py-4 text-center">{formatDate(r.createdAt)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-2">
                    <Link href={`/documents/${r.id}`} className="text-primary-600 hover:underline">
                      צפה
                    </Link>
                    <CanEditGate>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="מחק"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CanEditGate>
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

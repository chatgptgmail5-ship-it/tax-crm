"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CanEditGate } from "@/components/CanEditGate";
import { formatDate, isoToDdMmYyyy, parseDdMmYyyyToIso } from "@/lib/utils";

export type FieldsData = {
  firstName?: string;
  lastName?: string;
  idNumber?: string;
  fileNumber?: string;
  date?: string;
  fullName?: string;
  address?: string;
  phone?: string;
  [key: string]: string | undefined;
};

const DEFAULT_FIELDS: FieldsData = {
  firstName: "",
  lastName: "",
  idNumber: "",
  fileNumber: "",
  date: "",
  fullName: "",
  address: "",
  phone: "",
};

type Props = {
  documentId: number;
  initialFieldsData: string | null;
  clientName: string;
  documentType: string;
  canEdit: boolean;
};

export function DocumentTemplateForm({
  documentId,
  initialFieldsData,
  clientName,
  documentType,
  canEdit,
}: Props) {
  const router = useRouter();
  const [fields, setFields] = useState<FieldsData>(() => {
    try {
      if (initialFieldsData) {
        const parsed = JSON.parse(initialFieldsData) as Record<string, string>;
        return { ...DEFAULT_FIELDS, ...parsed };
      }
    } catch (_) {}
    return { ...DEFAULT_FIELDS };
  });
  const [saving, setSaving] = useState(false);
  const [dateInputStr, setDateInputStr] = useState("");

  useEffect(() => {
    try {
      if (initialFieldsData) {
        const parsed = JSON.parse(initialFieldsData) as Record<string, string>;
        setFields((prev) => ({ ...prev, ...parsed }));
      }
    } catch (_) {}
    setDateInputStr("");
  }, [initialFieldsData]);

  function setField(key: keyof FieldsData, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/generated-documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldsData: fields }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/documents" className="btn btn-ghost inline-flex">
          <ArrowLeft className="h-4 w-4 rotate-180" />
          חזרה לסוגי מסמכים
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handlePrint} className="btn btn-ghost text-sm">
            הדפס
          </button>
          <button type="button" onClick={handlePrint} className="btn btn-ghost text-sm">
            הורד PDF
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "שומר…" : "שמור"}
            </button>
          )}
        </div>
      </div>

      {/* A4 container — print-root scopes browser print to this block only */}
      <div
        className="print-root mx-auto bg-white shadow-lg rounded-sm overflow-hidden"
        style={{ width: "210mm", minHeight: "297mm", maxWidth: "100%" }}
        dir="rtl"
      >
        <div className="p-10 text-ink-900" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          <header className="text-center border-b border-ink-800 pb-4 mb-6">
            <h1 className="text-xl font-bold">טופס בקשה / מסמך</h1>
            <p className="text-sm text-ink-600 mt-1">{documentType}</p>
            <p className="text-xs text-ink-500 mt-1">לקוח: {clientName}</p>
          </header>

          <table className="w-full text-right border-collapse" style={{ fontSize: "14px" }}>
            <tbody>
              <tr>
                <td className="border border-ink-300 py-2 px-3 w-32 font-medium">שם פרטי</td>
                <td className="border border-ink-300 py-1 px-2">
                  {canEdit ? (
                    <input
                      type="text"
                      value={fields.firstName ?? ""}
                      onChange={(e) => setField("firstName", e.target.value)}
                      className="w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                    />
                  ) : (
                    <span>{fields.firstName || "—"}</span>
                  )}
                </td>
                <td className="border border-ink-300 py-2 px-3 w-28 font-medium">שם משפחה</td>
                <td className="border border-ink-300 py-1 px-2">
                  {canEdit ? (
                    <input
                      type="text"
                      value={fields.lastName ?? ""}
                      onChange={(e) => setField("lastName", e.target.value)}
                      className="w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                    />
                  ) : (
                    <span>{fields.lastName || "—"}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-ink-300 py-2 px-3 font-medium">ת&quot;ז</td>
                <td className="border border-ink-300 py-1 px-2">
                  {canEdit ? (
                    <input
                      type="text"
                      value={fields.idNumber ?? ""}
                      onChange={(e) => setField("idNumber", e.target.value)}
                      className="w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                    />
                  ) : (
                    <span>{fields.idNumber || "—"}</span>
                  )}
                </td>
                <td className="border border-ink-300 py-2 px-3 font-medium">מספר תיק</td>
                <td className="border border-ink-300 py-1 px-2">
                  {canEdit ? (
                    <input
                      type="text"
                      value={fields.fileNumber ?? ""}
                      onChange={(e) => setField("fileNumber", e.target.value)}
                      className="w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                    />
                  ) : (
                    <span>{fields.fileNumber || "—"}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-ink-300 py-2 px-3 font-medium">תאריך</td>
                <td className="border border-ink-300 py-1 px-2" colSpan={3}>
                  {canEdit ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/MM/yyyy"
                      value={dateInputStr !== "" ? dateInputStr : isoToDdMmYyyy(fields.date ?? "")}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDateInputStr(raw);
                        const iso = parseDdMmYyyyToIso(raw);
                        if (iso) setField("date", iso);
                      }}
                      className="border-0 bg-transparent py-0.5 px-1 text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                    />
                  ) : (
                    <span>{fields.date ? formatDate(fields.date) : "—"}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-ink-300 py-2 px-3 font-medium">שם מלא</td>
                <td className="border border-ink-300 py-1 px-2" colSpan={3}>
                  {canEdit ? (
                    <input
                      type="text"
                      value={fields.fullName ?? ""}
                      onChange={(e) => setField("fullName", e.target.value)}
                      className="w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                    />
                  ) : (
                    <span>{fields.fullName || "—"}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-ink-300 py-2 px-3 font-medium">כתובת</td>
                <td className="border border-ink-300 py-1 px-2" colSpan={3}>
                  {canEdit ? (
                    <input
                      type="text"
                      value={fields.address ?? ""}
                      onChange={(e) => setField("address", e.target.value)}
                      className="w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                    />
                  ) : (
                    <span>{fields.address || "—"}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-ink-300 py-2 px-3 font-medium">טלפון</td>
                <td className="border border-ink-300 py-1 px-2" colSpan={3}>
                  {canEdit ? (
                    <input
                      type="text"
                      value={fields.phone ?? ""}
                      onChange={(e) => setField("phone", e.target.value)}
                      className="w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                    />
                  ) : (
                    <span>{fields.phone || "—"}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 text-sm text-ink-600">
            <p>המסמך הופק ממערכת ניהול לקוחות.</p>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-center print:hidden">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "שומר…" : "שמור"}
          </button>
        </div>
      )}
    </div>
  );
}

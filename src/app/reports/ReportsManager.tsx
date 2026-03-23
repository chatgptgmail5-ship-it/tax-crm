"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown } from "lucide-react";
import { formatCurrency, formatDate, isoToDdMmYyyy, parseDdMmYyyyToIso } from "@/lib/utils";

type ReportType = "1" | "2" | "3";
type Report2Mode = "submitted" | "received";

type ReportRow = {
  clientName: string;
  idNumber?: string;
  phone?: string;
  city?: string;
  year: number | null;
  amountRefund: number | null;
  status: string;
  dateSubmission: string | null;
  dateRefund: string | null;
  intakeDate?: string | null;
};

const REPORTS = [
  { id: "1" as ReportType, label: "דוח לקוחות חדשים לפי תאריך קליטה" },
  { id: "2" as ReportType, label: "דוח החזרים שהוגשו או שהתקבלו" },
  { id: "3" as ReportType, label: "דוח החזרים לפי סטטוס טיפול" },
];

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

export function ReportsManager() {
  const router = useRouter();
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [report2Mode, setReport2Mode] = useState<Report2Mode>("submitted");
  const [statusName, setStatusName] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  const printableRef = useRef<HTMLDivElement | null>(null);

  const exportHref = useMemo(() => {
    if (!reportType) return "";
    const qs = new URLSearchParams();
    qs.set("reportType", reportType);
    if (fromDate) qs.set("fromDate", fromDate);
    if (toDate) qs.set("toDate", toDate);
    if (reportType === "2") qs.set("report2Mode", report2Mode);
    if (reportType === "3" && statusName) qs.set("statusName", statusName);
    return `/api/reports/export?${qs.toString()}`;
  }, [reportType, fromDate, toDate, report2Mode, statusName]);

  async function runReport() {
    if (!reportType) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("reportType", reportType);
      if (fromDate) qs.set("fromDate", fromDate);
      if (toDate) qs.set("toDate", toDate);
      if (reportType === "2") qs.set("report2Mode", report2Mode);
      if (reportType === "3" && statusName) qs.set("statusName", statusName);
      const res = await fetch(`/api/reports?${qs.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { rows: ReportRow[] };
      setRows(data.rows ?? []);
      setHasSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  const reportTitle = useMemo(() => {
    const from = fromDate ? isoToDdMmYyyy(fromDate) : "—";
    const to = toDate ? isoToDdMmYyyy(toDate) : "—";
    if (reportType === "1") return `דוח לקוחות חדשים לפי תאריך קליטה מ: ${from} עד: ${to}`;
    if (reportType === "2") return `דוח החזרים ${report2Mode === "received" ? "שהתקבלו" : "שהוגשו"} מ: ${from} עד: ${to}`;
    if (reportType === "3") return `דוח החזרים לפי סטטוס טיפול: ${statusName || "—"} מ: ${from} עד: ${to}`;
    return "דוח";
  }, [reportType, report2Mode, fromDate, toDate, statusName]);

  const pdfFileName = useMemo(() => {
    if (reportType === "1") return "דוח לקוחות חדשים.pdf";
    if (reportType === "2") return report2Mode === "received" ? "דוח החזרים שהתקבלו.pdf" : "דוח החזרים שהוגשו.pdf";
    return "דוח החזרים לפי סטטוס.pdf";
  }, [reportType, report2Mode]);

  async function handleDownloadPdf() {
    if (!printableRef.current) return;
    const mod = await import("html2pdf.js");
    const html2pdf = (mod as { default?: unknown }).default ?? mod;
    (html2pdf as any)()
      .from(printableRef.current)
      .set({
        margin: [0, 0, 0, 0],
        filename: pdfFileName,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save();
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">דוחות</h1>
        <div className="flex items-center gap-2">
          {hasSubmitted && reportType ? (
            <button type="button" className="btn btn-secondary" onClick={() => setShowReportView(true)}>
              הצג כדוח
            </button>
          ) : (
            <button type="button" className="btn btn-secondary opacity-60" disabled>
              הצג כדוח
            </button>
          )}
          {hasSubmitted && rows.length > 0 && reportType ? (
            <Link href={exportHref} className="btn btn-secondary flex items-center gap-2" download>
              <FileDown className="h-4 w-4" />
              ייצוא לאקסל
            </Link>
          ) : (
            <button type="button" className="btn btn-secondary flex items-center gap-2 opacity-60" disabled>
              <FileDown className="h-4 w-4" />
              ייצוא לאקסל
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink-900">בחר דוח להציג:</h3>
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-ink-200">
                <th className="px-2 py-2 text-right">מספר הדוח</th>
                <th className="px-2 py-2 text-right">שם הדוח</th>
              </tr>
            </thead>
            <tbody>
              {REPORTS.map((r) => (
                <tr
                  key={r.id}
                  className={`cursor-pointer border-b border-ink-100 hover:bg-primary-50/50 ${
                    reportType === r.id ? "bg-primary-50" : ""
                  }`}
                  onClick={() => setReportType(r.id)}
                >
                  <td className="px-2 py-2">{r.id}</td>
                  <td className="px-2 py-2">{r.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink-900">טווח תאריכים / אפשרויות דוח</h3>
          <div className="space-y-4">
            <div>
              <label className="label block mb-1" htmlFor="fromDate">
                מתאריך
              </label>
              <input
                id="fromDate"
                name="fromDate"
                type="text"
                inputMode="numeric"
                placeholder="dd/MM/yyyy"
                className="input w-full"
                value={fromDateInput !== "" ? fromDateInput : isoToDdMmYyyy(fromDate)}
                onChange={(e) => {
                  const v = e.target.value;
                  setFromDateInput(v);
                  const iso = parseDdMmYyyyToIso(v);
                  if (iso) setFromDate(iso);
                  else if (!v.trim()) setFromDate("");
                }}
              />
            </div>
            <div>
              <label className="label block mb-1" htmlFor="toDate">
                עד תאריך
              </label>
              <input
                id="toDate"
                name="toDate"
                type="text"
                inputMode="numeric"
                placeholder="dd/MM/yyyy"
                className="input w-full"
                value={toDateInput !== "" ? toDateInput : isoToDdMmYyyy(toDate)}
                onChange={(e) => {
                  const v = e.target.value;
                  setToDateInput(v);
                  const iso = parseDdMmYyyyToIso(v);
                  if (iso) setToDate(iso);
                  else if (!v.trim()) setToDate("");
                }}
              />
            </div>

            {reportType === "2" && (
              <div>
                <label className="label block mb-1">סוג דוח</label>
                <select
                  value={report2Mode}
                  onChange={(e) => setReport2Mode(e.target.value as Report2Mode)}
                  className="input"
                >
                  <option value="submitted">הוגשו</option>
                  <option value="received">התקבלו</option>
                </select>
              </div>
            )}

            {reportType === "3" && (
              <div>
                <label className="label block mb-1">סטטוס</label>
                <select value={statusName} onChange={(e) => setStatusName(e.target.value)} className="input">
                  <option value="">—</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="button" onClick={runReport} className="btn btn-primary" disabled={loading}>
              {loading ? "טוען…" : "הצג תוצאות"}
            </button>
          </div>
        </div>

      </div>

      <div className="card w-full p-5">
        <h3 className="mb-4 font-semibold text-ink-900">תוצאות / רשימת לקוחות</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-ink-200 bg-primary-50/40">
                <th className="px-2 py-2 text-right">שם לקוח</th>
                <th className="px-2 py-2 text-right">שנה</th>
                <th className="px-2 py-2 text-right">סכום ההחזר</th>
                <th className="px-2 py-2 text-right">סטטוס</th>
                <th className="px-2 py-2 text-right">ת. הגשה</th>
                <th className="px-2 py-2 text-right">ת. קבלת ההחזר</th>
              </tr>
            </thead>
            <tbody>
              {!hasSubmitted ? (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-ink-500">
                    בחר דוח והצג תוצאות
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-ink-500">
                    אין תוצאות בטווח שנבחר
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={`${row.clientName}-${row.year ?? "-"}-${idx}`} className="border-b border-ink-100">
                    <td className="px-2 py-2">{row.clientName}</td>
                    <td className="px-2 py-2">{row.year ?? "—"}</td>
                    <td className="px-2 py-2">{row.amountRefund != null ? formatCurrency(row.amountRefund) : "—"}</td>
                    <td className="px-2 py-2">{row.status || "—"}</td>
                    <td className="px-2 py-2">{formatDate(row.dateSubmission)}</td>
                    <td className="px-2 py-2">{formatDate(row.dateRefund)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReportView && hasSubmitted && reportType && (
        <div className="report-print-root fixed inset-0 z-50 bg-black/40 p-4 print:bg-transparent print:p-0">
          <div className="mx-auto max-w-[230mm]">
            <div className="mb-3 flex items-center justify-end gap-2 print:hidden">
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                חזור
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                הדפס
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleDownloadPdf}>
                הורד PDF
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowReportView(false)}>
                סגור
              </button>
            </div>

            <div ref={printableRef} className="print-root report-a4 bg-white" dir="rtl">
              <header className="mb-4 border-b border-ink-200 pb-3">
                <div className="grid grid-cols-3 items-center">
                  <div className="text-sm text-ink-700 text-left">{formatDate(new Date().toISOString())}</div>
                  <div className="flex justify-center">
                    <img src="/logo.png" alt="logo" className="h-14 w-14 object-contain" />
                  </div>
                  <div className="text-sm leading-5 text-right">
                    <div className="font-semibold">א. פרץ ניהול חשבונות בע"מ</div>
                    <div>טלפון: 077-4140451</div>
                    <div>רחובות</div>
                  </div>
                </div>
                <h2 className="mt-3 text-center text-base font-bold">{reportTitle}</h2>
              </header>

              <table className="w-full border-collapse text-sm">
                <thead>
                  {reportType === "1" ? (
                    <tr>
                      <th className="report-th">מס'</th>
                      <th className="report-th">שם לקוח</th>
                      <th className="report-th">ת.ז</th>
                      <th className="report-th">טלפון</th>
                      <th className="report-th">עיר</th>
                      <th className="report-th">תאריך קליטה</th>
                    </tr>
                  ) : reportType === "2" ? (
                    <tr>
                      <th className="report-th">מס'</th>
                      <th className="report-th">שם לקוח</th>
                      <th className="report-th">שנה</th>
                      <th className="report-th">סכום החזר</th>
                      <th className="report-th">סטטוס</th>
                      <th className="report-th">{report2Mode === "received" ? "ת. קבלה" : "ת. הגשה"}</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="report-th">מס'</th>
                      <th className="report-th">שם לקוח</th>
                      <th className="report-th">שנה</th>
                      <th className="report-th">סכום</th>
                      <th className="report-th">סטטוס</th>
                      <th className="report-th">ת. הגשה</th>
                      <th className="report-th">ת. קבלה</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {rows.map((row, idx) =>
                    reportType === "1" ? (
                      <tr key={`print-${idx}`}>
                        <td className="report-td">{idx + 1}</td>
                        <td className="report-td">{row.clientName}</td>
                        <td className="report-td">{row.idNumber || "—"}</td>
                        <td className="report-td">{row.phone || "—"}</td>
                        <td className="report-td">{row.city || "—"}</td>
                        <td className="report-td">{formatDate(row.intakeDate || row.dateSubmission)}</td>
                      </tr>
                    ) : reportType === "2" ? (
                      <tr key={`print-${idx}`}>
                        <td className="report-td">{idx + 1}</td>
                        <td className="report-td">{row.clientName}</td>
                        <td className="report-td">{row.year ?? "—"}</td>
                        <td className="report-td">{row.amountRefund != null ? formatCurrency(row.amountRefund) : "—"}</td>
                        <td className="report-td">{row.status || "—"}</td>
                        <td className="report-td">
                          {report2Mode === "received" ? formatDate(row.dateRefund) : formatDate(row.dateSubmission)}
                        </td>
                      </tr>
                    ) : (
                      <tr key={`print-${idx}`}>
                        <td className="report-td">{idx + 1}</td>
                        <td className="report-td">{row.clientName}</td>
                        <td className="report-td">{row.year ?? "—"}</td>
                        <td className="report-td">{row.amountRefund != null ? formatCurrency(row.amountRefund) : "—"}</td>
                        <td className="report-td">{row.status || "—"}</td>
                        <td className="report-td">{formatDate(row.dateSubmission)}</td>
                        <td className="report-td">{formatDate(row.dateRefund)}</td>
                      </tr>
                    )
                  )}
                  {rows.length === 0 && (
                    <tr>
                      <td className="report-td" colSpan={reportType === "3" ? 7 : 6}>
                        אין נתונים להצגה
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <footer className="mt-5 flex items-center justify-between border-t border-ink-200 pt-3 text-sm">
                <span>תאריך הפקה: {formatDate(new Date().toISOString())}</span>
                <span>עמוד 1 מתוך 1</span>
              </footer>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .report-a4 {
          width: 210mm;
          min-height: 297mm;
          margin: 10mm auto;
          padding: 12mm;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .report-th,
        .report-td {
          border: 1px solid #cbd5e1;
          text-align: center;
          padding: 4px 6px;
          vertical-align: middle;
        }
        @media print {
          :global(.report-print-root) {
            position: static !important;
            inset: auto !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .report-a4 {
            margin: 0;
            box-shadow: none;
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}


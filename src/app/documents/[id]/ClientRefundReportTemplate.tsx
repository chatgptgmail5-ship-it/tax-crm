"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/** e.g. ראשון 14 באפריל 2026 — uses the machine’s current calendar date at render time */
const HEBREW_WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function formatHebrewDateWords(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const weekday = date.getDay();
  return `${HEBREW_WEEKDAYS[weekday]} ${day} ב${HEBREW_MONTHS[month]} ${year}`;
}

/**
 * Literal 1:1 visual replica of "דוח החזרים ללקוח.pdf".
 * Tables only where original has tables. Plain text where original is plain.
 * Match borders, underlines, bold, alignment exactly.
 */

const CHECKLIST_TOPICS = [
  "שאלון אישי",
  "תעודות זהות",
  "תעודות תואר",
  'מס הכנסה ומע"מ',
  "מס הכנסה",
  "מס הכנסה",
  "מס הכנסה",
  "ביטוח לאומי",
  "ביטוח לאומי",
  "חברות ביטוח",
  "ישוב ספר",
  'שכ"ט',
  "תרומות",
];

/** Category rowspan groups: כללי (3), מוסדות (7), אישורים (3) */
const QUESTIONNAIRE_GROUPS: { category: string; topics: string[] }[] = [
  { category: "כללי", topics: ["שאלון אישי", "תעודות זהות", "תעודות תואר"] },
  { category: "מוסדות", topics: ['מס הכנסה ומע"מ', "מס הכנסה", "מס הכנסה", "מס הכנסה", "ביטוח לאומי", "ביטוח לאומי", "חברות ביטוח"] },
  { category: "אישורים", topics: ["ישוב ספר", 'שכ"ט', "תרומות"] },
];

/** פירוט column values — exact text per נושא row */
const DETAIL_DEFAULTS: string[] = [
  "בדיקת סעיפי השאלון",
  "בדיקת סטאטוס מצב משפחתי וילדים",
  "בדיקת קיום תואר",
  "בדיקת יתרת הקיימות במצב חשבון",
  "בדיקת הגשת דוחות שנים קודמות",
  "טופס 106",
  "בדיקת שמות מס שבח מקרקעין",
  "פירוט מעסיקים",
  "אישור גמלאות",
  "אישור מס ביטוח חיים ומשכנתא",
  "אישור מגורים ביישוב ספר",
  "חשבוניות שכ״ל",
  "אישור מס בגין תרומות",
];

const TREATMENT_TOPICS = [
  "כללי",
  "מוסדות",
  "אישורים",
  "פירוט מעסיקים",
  "אישורי גמלאות",
  "אישור מגורים בישוב ספר",
  "בדיקת יתרות הקיימות במצב חשבון",
  "אישורי מס בגין תרומות",
  "106 טופסי",
  "בדיקת הגשת דוחות שנים קודמות",
  'אישורי מס ביטוחי חיים ומשכנתא',
  'חשבונית שכ"ט',
  "בדיקת שומות מס שבח מקרקעין",
  "הערות המייצג )פנימי(",
  "בדיקת סעיפי השאלון",
  "בדיקת סטאטוס מצב משפחתי וילדים",
  "בדיקת קיום תואר",
];

function buildDefaultFields(): Record<string, string> {
  const o: Record<string, string> = {
    clientFirstName: "",
    idNumber: "",
    taxAssessor: "",
    spouseFirstName: "",
    spouseIdNumber: "",
    holiya: "",
    familyName: "",
    addressCityPart: "",
    addressStreetPart: "",
    addressLine: "",
    agentName: "",
    totalAmount: "₪ 0.00",
    notesBlock: "",
    internalRepNotes: "",
    checkDate: "",
    agentSignature: "",
    footerDateLine: "",
    footerTitle: 'דו"ח פרטי החזר ללקוח',
    detailHeader: "פירוט",
    repConfirmHeader: "אישור המייצג",
    repCheckDate: "",
    repSignature: "",
  };
  CHECKLIST_TOPICS.forEach((_, i) => {
    o[`chk_${i}_status`] = "";
    o[`chk_${i}_notes`] = "";
    o[`chk_${i}_category`] = "";
    o[`chk_${i}_detail`] = DETAIL_DEFAULTS[i] ?? "";
  });
  TREATMENT_TOPICS.forEach((_, i) => {
    o[`tr_${i}_notes`] = "";
  });
  o.year_2019 = "";
  o.year_2020 = "הוגש בעבר";
  o.year_2021 = "-";
  o.year_2021_sym = "₪";
  o.year_2022 = "-";
  o.year_2022_sym = "₪";
  o.year_2023 = "-";
  o.year_2023_sym = "₪";
  o.year_2024 = "₪ 0.00";
  return o;
}

const DEFAULT_FIELDS = buildDefaultFields();

function normalizeYearTriplets(f: Record<string, string>): Record<string, string> {
  const out = { ...f };
  for (const y of ["2021", "2022", "2023"] as const) {
    const k = `year_${y}`;
    const sk = `year_${y}_sym`;
    const v = out[k];
    if (v != null && (out[sk] === undefined || out[sk] === "") && /\t/.test(String(v))) {
      const parts = String(v).split(/\t/);
      out[k] = (parts[0] ?? "").trim();
      out[sk] = (parts[1] ?? "₪").trim();
    }
  }
  return out;
}

export type ClientRefundReportFields = Record<string, string>;

/** One row for the refund-years table — from household TaxCase (server). */
export type RefundYearRow = {
  year: number;
  amount: number | null;
  statusName: string | null;
};

type Props = {
  documentId: number;
  initialFieldsData: string | null;
  clientName: string;
  canEdit: boolean;
  clientDefaults?: Record<string, string>;
  /** Latest tax years for the current household (max 6), from TaxCase */
  refundYearRows?: RefundYearRow[];
};

const F = 'Arial, "Segoe UI", "Noto Sans Hebrew", sans-serif';
const FS = "10pt";
const FB = "11pt";
const BD = "1px solid #000";
const PX = "2px 4px";
const HG = "#d9d9d9";
const W = "190mm";

const cell: React.CSSProperties = {
  border: BD,
  padding: PX,
  verticalAlign: "middle",
  fontSize: FB,
  lineHeight: 1.2,
  fontFamily: F,
};

const head: React.CSSProperties = {
  ...cell,
  backgroundColor: HG,
  fontWeight: 700,
  textAlign: "center",
};

const t: React.CSSProperties = {
  width: W,
  borderCollapse: "collapse",
  tableLayout: "fixed",
  margin: 0,
};

function Inp({
  value,
  onChange,
  canEdit,
  textAlign,
  inputStyle,
}: {
  value: string;
  onChange: (v: string) => void;
  canEdit: boolean;
  textAlign?: "center" | "right" | "left";
  /** Optional; use for row alignment (e.g. אישור המייצג lines) */
  inputStyle?: React.CSSProperties;
}) {
  if (!canEdit) return <span style={{ lineHeight: inputStyle?.lineHeight, ...(textAlign ? { textAlign } : {}) }}>{value || "\u00A0"}</span>;
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        font: "inherit",
        padding: 0,
        margin: 0,
        ...(textAlign && { textAlign }),
        ...inputStyle,
      }}
      dir="rtl"
    />
  );
}

export function ClientRefundReportTemplate({
  documentId,
  initialFieldsData,
  clientName,
  canEdit,
  clientDefaults,
  refundYearRows = [],
}: Props) {
  const router = useRouter();
  const [fields, setFields] = useState<ClientRefundReportFields>(() => {
    try {
      if (initialFieldsData) {
        const p = JSON.parse(initialFieldsData) as Record<string, string>;
        if (p.addressLine && !p.addressStreetPart) p.addressStreetPart = String(p.addressLine);
        return normalizeYearTriplets({ ...DEFAULT_FIELDS, ...p });
      }
    } catch (_) {}
    return { ...DEFAULT_FIELDS };
  });
  const [saving, setSaving] = useState(false);
  const [checkDateInputStr, setCheckDateInputStr] = useState("");

  useEffect(() => {
    try {
      if (initialFieldsData) {
        const p = JSON.parse(initialFieldsData) as Record<string, string>;
        if (p.addressLine && !p.addressStreetPart) p.addressStreetPart = String(p.addressLine);
        setFields((prev) => normalizeYearTriplets({ ...prev, ...p }));
      }
    } catch (_) {}
    setCheckDateInputStr("");
  }, [initialFieldsData]);

  useEffect(() => {
    if (!clientDefaults || Object.keys(clientDefaults).length === 0) return;
    setFields((prev) => {
      const n = { ...prev };
      let c = false;
      for (const k of Object.keys(clientDefaults)) {
        const d = clientDefaults[k];
        if (d != null && String(d).trim() !== "" && (n[k] == null || String(n[k]).trim() === "")) {
          n[k] = String(d).trim();
          c = true;
        }
      }
      return c ? n : prev;
    });
  }, [clientDefaults]);

  const set = (k: string, v: string) => setFields((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/generated-documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldsData: fields }),
      });
      if (r.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="print:hidden" style={{ marginBottom: 16 }}>
        <table style={{ width: "100%", border: "none" }}>
          <tbody>
            <tr>
              <td style={{ border: "none", textAlign: "right" }}>
                <Link href="/documents" className="btn btn-ghost inline-flex">
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                  חזרה לסוגי מסמכים
                </Link>
              </td>
              <td style={{ border: "none", textAlign: "left", whiteSpace: "nowrap" }}>
                <button type="button" onClick={() => window.print()} className="btn btn-ghost text-sm">
                  הדפס
                </button>
                <button type="button" onClick={() => window.print()} className="btn btn-ghost text-sm">
                  הורד PDF
                </button>
                {canEdit && (
                  <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
                    {saving ? "שומר…" : "שמור"}
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        className="print-root crr-doc"
        style={{
          width: "210mm",
          minHeight: "297mm",
          maxWidth: "100%",
          margin: "0 auto",
          padding: "10mm",
          background: "#fff",
          boxSizing: "border-box",
          fontFamily: F,
          fontSize: FB,
          color: "#000",
        }}
        dir="rtl"
      >
        {/* 1. TOP LINE: RTL flex — first item = top-right (בס"ד), second = top-left (today’s date) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: W, marginBottom: "6pt" }}>
          <div style={{ fontSize: FS, fontFamily: F, textAlign: "right" }}>בס&quot;ד</div>
          <div style={{ fontSize: FS, fontFamily: F, textAlign: "left" }}>{formatHebrewDateWords(new Date())}</div>
        </div>

        {/* 2. TITLE: centered; underline tight to text, width ~ text only */}
        <div style={{ width: W, textAlign: "center", marginBottom: "6pt" }}>
          <span style={{ display: "inline-block", borderBottom: BD, paddingBottom: "1px", lineHeight: 1.15 }}>
            {canEdit ? (
              <input
                type="text"
                value={fields.footerTitle ?? 'דו"ח פרטי החזר ללקוח'}
                onChange={(e) => set("footerTitle", e.target.value)}
                size={Math.max(String(fields.footerTitle ?? 'דו"ח פרטי החזר ללקוח').length, 18)}
                style={{
                  width: "auto",
                  minWidth: 0,
                  maxWidth: "100%",
                  border: "none",
                  textAlign: "center",
                  fontWeight: 700,
                  font: "inherit",
                  fontSize: FB,
                  background: "transparent",
                  display: "block",
                  margin: "0 auto",
                  lineHeight: 1.15,
                  padding: 0,
                }}
                dir="rtl"
              />
            ) : (
              <span style={{ fontWeight: 700, fontSize: FB, lineHeight: 1.15 }}>{fields.footerTitle || 'דו"ח פרטי החזר ללקוח'}</span>
            )}
          </span>
        </div>

        {/* 3. CLIENT DETAILS: two separate aligned blocks — right block + left block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: W, marginBottom: "6pt", gap: "16pt" }} dir="rtl">
          {/* RIGHT BLOCK */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", marginBottom: "4pt", fontSize: FB, fontFamily: F }}>
              <span style={{ minWidth: "140px", textAlign: "right" }}>בן/בת הזוג הרשום:</span>
              <span style={{ flex: 1, borderBottom: "1px solid #ccc", marginRight: "4pt" }}><Inp value={fields.spouseFirstName ?? ""} onChange={(v) => set("spouseFirstName", v)} canEdit={canEdit} /></span>
            </div>
            <div style={{ display: "flex", marginBottom: "4pt", fontSize: FB, fontFamily: F }}>
              <span style={{ minWidth: "140px", textAlign: "right" }}>בן/בת הזוג:</span>
              <span style={{ flex: 1, borderBottom: "1px solid #ccc", marginRight: "4pt" }}><Inp value={fields.clientFirstName ?? ""} onChange={(v) => set("clientFirstName", v)} canEdit={canEdit} /></span>
            </div>
            <div style={{ display: "flex", marginBottom: "4pt", fontSize: FB, fontFamily: F }}>
              <span style={{ minWidth: "140px", textAlign: "right" }}>ת.ז בן/בת הזוג הרשום:</span>
              <span style={{ flex: 1, borderBottom: "1px solid #ccc", marginRight: "4pt" }}><Inp value={fields.spouseIdNumber ?? ""} onChange={(v) => set("spouseIdNumber", v)} canEdit={canEdit} /></span>
            </div>
            <div style={{ display: "flex", fontSize: FB, fontFamily: F }}>
              <span style={{ minWidth: "140px", textAlign: "right" }}>ת.ז בן/בת הזוג:</span>
              <span style={{ flex: 1, borderBottom: "1px solid #ccc", marginRight: "4pt" }}><Inp value={fields.idNumber ?? ""} onChange={(v) => set("idNumber", v)} canEdit={canEdit} /></span>
            </div>
          </div>
          {/* LEFT BLOCK */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", marginBottom: "4pt", fontSize: FB, fontFamily: F }}>
              <span style={{ minWidth: "90px", textAlign: "right" }}>כתובת:</span>
              <span style={{ flex: 1, borderBottom: "1px solid #ccc", marginRight: "4pt" }}><Inp value={fields.addressStreetPart ?? fields.addressLine ?? ""} onChange={(v) => set("addressStreetPart", v)} canEdit={canEdit} /></span>
            </div>
            <div style={{ display: "flex", marginBottom: "4pt", fontSize: FB, fontFamily: F }}>
              <span style={{ minWidth: "90px", textAlign: "right" }}>פקיד שומה:</span>
              <span style={{ flex: 1, borderBottom: "1px solid #ccc", marginRight: "4pt" }}><Inp value={fields.taxAssessor ?? ""} onChange={(v) => set("taxAssessor", v)} canEdit={canEdit} /></span>
            </div>
            <div style={{ display: "flex", marginBottom: "4pt", fontSize: FB, fontFamily: F }}>
              <span style={{ minWidth: "90px", textAlign: "right" }}>חוליה:</span>
              <span style={{ flex: 1, borderBottom: "1px solid #ccc", marginRight: "4pt" }}><Inp value={fields.holiya ?? ""} onChange={(v) => set("holiya", v)} canEdit={canEdit} /></span>
            </div>
            <div style={{ display: "flex", fontSize: FB, fontFamily: F }}>
              <span style={{ minWidth: "90px", textAlign: "right" }}>שם הסוכן:</span>
              <span style={{ flex: 1, borderBottom: "1px solid #ccc", marginRight: "4pt" }}><Inp value={fields.agentName ?? ""} onChange={(v) => set("agentName", v)} canEdit={canEdit} /></span>
            </div>
          </div>
        </div>

        {/* 1. MAIN QUESTIONNAIRE: קטגוריה | נושא | פירוט | סטאטוס | הערות — with rowspan for category */}
        <table style={{ ...t, marginBottom: "6pt" }}>
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "34%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "35%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: "center", verticalAlign: "middle" }}>קטגוריה</th>
              <th style={{ ...head, textAlign: "center", verticalAlign: "middle" }}>נושא</th>
              <th style={{ ...head, textAlign: "center", verticalAlign: "middle" }}>פירוט</th>
              <th style={{ ...head, textAlign: "center", verticalAlign: "middle" }}>נבדק</th>
              <th style={{ ...head, textAlign: "center", verticalAlign: "middle" }}>הערות</th>
            </tr>
          </thead>
          <tbody>
            {QUESTIONNAIRE_GROUPS.map((grp, gi) => {
              const startIdx = QUESTIONNAIRE_GROUPS.slice(0, gi).reduce((s, g) => s + g.topics.length, 0);
              return grp.topics.map((topic, ti) => {
                const i = startIdx + ti;
                const isFirst = ti === 0;
                return (
                  <tr key={`${gi}-${ti}`}>
                    {isFirst && (
                      <td rowSpan={grp.topics.length} style={{ ...cell, textAlign: "center", verticalAlign: "middle", fontWeight: 600 }}>
                        {grp.category}
                      </td>
                    )}
                    <td style={{ ...cell, textAlign: "center", verticalAlign: "middle" }}>{topic}</td>
                    <td style={{ ...cell, textAlign: "center", verticalAlign: "middle" }}><Inp value={fields[`chk_${i}_detail`] ?? ""} onChange={(v) => set(`chk_${i}_detail`, v)} canEdit={canEdit} textAlign="center" /></td>
                    <td style={{ ...cell, textAlign: "center", verticalAlign: "middle" }}>
                      {canEdit ? (
                        <input
                          type="checkbox"
                          checked={fields[`chk_${i}_status`] === "true"}
                          onChange={(e) => set(`chk_${i}_status`, e.target.checked ? "true" : "")}
                          style={{ transform: "scale(0.9)", margin: 0 }}
                        />
                      ) : (
                        <span>{fields[`chk_${i}_status`] === "true" ? "✓" : "\u00A0"}</span>
                      )}
                    </td>
                    <td style={{ ...cell, textAlign: "center", verticalAlign: "middle" }}><Inp value={fields[`chk_${i}_notes`] ?? ""} onChange={(v) => set(`chk_${i}_notes`, v)} canEdit={canEdit} /></td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>

        {/* YEARS: שנת ההחזר | סכום | סטטוס טיפול | הערות — data from TaxCase (max 6), notes per year in fields */}
        <table style={{ ...t, marginBottom: "6pt" }}>
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "40%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={head}>שנת ההחזר</th>
              <th style={head}>סכום</th>
              <th style={head}>סטטוס טיפול</th>
              <th style={head}>הערות</th>
            </tr>
          </thead>
          <tbody>
            {refundYearRows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...cell, textAlign: "center" }}>
                  &nbsp;
                </td>
              </tr>
            ) : (
              refundYearRows.map((row) => {
                const noteKey = `refund_notes_${row.year}`;
                return (
                  <tr key={row.year}>
                    <td style={{ ...cell, textAlign: "center", verticalAlign: "middle", fontWeight: 600 }}>{row.year}</td>
                    <td style={{ ...cell, textAlign: "center", verticalAlign: "middle" }}>{formatCurrency(row.amount)}</td>
                    <td style={{ ...cell, textAlign: "center", verticalAlign: "middle" }}>{row.statusName ?? "\u00A0"}</td>
                    <td style={{ ...cell, textAlign: "center", verticalAlign: "middle" }}>
                      <Inp value={fields[noteKey] ?? ""} onChange={(v) => set(noteKey, v)} canEdit={canEdit} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* 3. הערות — bordered box (table-based) */}
        <table style={{ ...t, marginBottom: "8pt" }}>
          <tbody>
            <tr>
              <td style={{ border: "none", padding: "0 0 2pt", fontWeight: 700, fontSize: FB, fontFamily: F }}>הערות:</td>
            </tr>
            <tr>
              <td style={{ ...cell, padding: "6px 8px", minHeight: "72pt", whiteSpace: "pre-wrap", fontSize: FB, fontFamily: F, lineHeight: 1.25 }}>
                {canEdit ? (
                  <textarea
                    value={fields.notesBlock ?? ""}
                    onChange={(e) => set("notesBlock", e.target.value)}
                    rows={4}
                    style={{ width: "100%", minHeight: "60pt", border: "none", outline: "none", font: "inherit", fontFamily: F, fontSize: FB, resize: "none", padding: 0, margin: 0, background: "transparent", lineHeight: 1.25 }}
                    dir="rtl"
                  />
                ) : (
                  fields.notesBlock || "\u00A0"
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. הערות המייצג (פנימי) — single multi-line area */}
        <div style={{ width: W, marginBottom: "12pt" }}>
          <div style={{ marginBottom: "4pt", fontWeight: 700, fontSize: FB, fontFamily: F, textAlign: "right" }}>
            הערות המייצג (פנימי)
          </div>
          {canEdit ? (
            <textarea
              value={fields.internalRepNotes ?? ""}
              onChange={(e) => set("internalRepNotes", e.target.value)}
              rows={10}
              style={{
                width: "100%",
                minHeight: "140pt",
                boxSizing: "border-box",
                border: BD,
                borderRadius: 0,
                padding: "8px",
                font: "inherit",
                fontFamily: F,
                fontSize: FB,
                lineHeight: 1.35,
                resize: "vertical",
                background: "#fff",
                outline: "none",
              }}
              dir="rtl"
            />
          ) : (
            <div
              style={{
                border: BD,
                padding: "8px",
                minHeight: "100pt",
                whiteSpace: "pre-wrap",
                fontSize: FB,
                fontFamily: F,
                lineHeight: 1.35,
                textAlign: "right",
              }}
            >
              {fields.internalRepNotes || "\u00A0"}
            </div>
          )}
        </div>

        {/* אישור המייצג — bottom-left; title centered over the two lines below */}
        <div style={{ width: W, display: "flex", justifyContent: "flex-end", marginTop: "10pt", marginBottom: "4pt" }} dir="rtl">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: F, gap: "4pt" }}>
            <div style={{ fontSize: FS, fontWeight: 600, lineHeight: 1.15 }}>
              <span style={{ display: "inline-block", borderBottom: BD, paddingBottom: "1px", lineHeight: 1.15 }}>
                {fields.repConfirmHeader ?? "אישור המייצג"}
              </span>
            </div>
            <div style={{ width: "100%", minWidth: "260px", maxWidth: "320px" }}>
              <div
                style={{
                  fontSize: FS,
                  marginBottom: "4pt",
                  display: "flex",
                  alignItems: "center",
                  gap: "6pt",
                  justifyContent: "flex-end",
                  lineHeight: 1.25,
                }}
              >
                <span style={{ whiteSpace: "nowrap", lineHeight: 1.25 }}>תאריך בדיקה:</span>
                <span
                  style={{
                    flex: "1 1 120px",
                    minWidth: "120px",
                    borderBottom: "1px solid #000",
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 1.25,
                  }}
                >
                  <Inp
                    value={fields.repCheckDate ?? ""}
                    onChange={(v) => set("repCheckDate", v)}
                    canEdit={canEdit}
                    inputStyle={{ lineHeight: 1.25, height: "1.25em", boxSizing: "content-box" }}
                  />
                </span>
              </div>
              <div
                style={{
                  fontSize: FS,
                  display: "flex",
                  alignItems: "center",
                  gap: "6pt",
                  justifyContent: "flex-end",
                  lineHeight: 1.25,
                }}
              >
                <span style={{ whiteSpace: "nowrap", lineHeight: 1.25 }}>חתימת המייצג:</span>
                <span
                  style={{
                    flex: "1 1 120px",
                    minWidth: "120px",
                    borderBottom: "1px solid #000",
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 1.25,
                  }}
                >
                  <Inp
                    value={fields.repSignature ?? ""}
                    onChange={(v) => set("repSignature", v)}
                    canEdit={canEdit}
                    inputStyle={{ lineHeight: 1.25, height: "1.25em", boxSizing: "content-box" }}
                  />
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="print:hidden" style={{ margin: "8pt 0 0", padding: 0, textAlign: "center", fontSize: "8pt", color: "#666" }} dir="ltr">
          {clientName ? `לקוח במערכת: ${clientName}` : ""}
        </p>
      </div>

      {canEdit && (
        <div className="print:hidden" style={{ marginTop: 12, textAlign: "center" }}>
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? "שומר…" : "שמור"}
          </button>
        </div>
      )}
    </div>
  );
}

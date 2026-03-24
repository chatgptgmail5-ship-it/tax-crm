"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatDate, isoToDdMmYyyy } from "@/lib/utils";

export type EmployeeAgreementFields = {
  date?: string;
  agreementType?: string;
  openingFee?: string;
  commissionPercent?: string;
  firstName?: string;
  lastName?: string;
  primaryFullName?: string;
  spouseFullName?: string;
  idNumber?: string;
  spouseIdNumber?: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  zip?: string;
  [key: string]: string | undefined;
};

const AGREEMENT_TYPE_OPTIONS = [
  "איילון",
  "תמורה",
  "ליבת/אלי",
  "קב\"ל",
  "מיטב ד\"ש",
  "איוויב",
  "איתנים",
  "משרד",
] as const;

const AGREEMENT_FEES: Record<string, { openingFee: string; commissionPercent: string }> = {
  "איילון": { openingFee: "0", commissionPercent: "15" },
  "תמורה": { openingFee: "0", commissionPercent: "15" },
  "קב\"ל": { openingFee: "0", commissionPercent: "17" },
  "מיטב ד\"ש": { openingFee: "117", commissionPercent: "20" },
  "איוויב": { openingFee: "0", commissionPercent: "15" },
  "איתנים": { openingFee: "350", commissionPercent: "20" },
  "ליבת/אלי": { openingFee: "0", commissionPercent: "15" },
};

const DEFAULT_FIELDS: EmployeeAgreementFields = {
  date: new Date().toISOString().slice(0, 10),
  agreementType: "",
  openingFee: "0",
  commissionPercent: "15",
  firstName: "",
  lastName: "",
  primaryFullName: "",
  spouseFullName: "",
  idNumber: "",
  spouseIdNumber: "",
  street: "",
  houseNumber: "",
  city: "",
  zip: "",
};

type Props = {
  documentId: number;
  initialFieldsData: string | null;
  clientName: string;
  canEdit: boolean;
  defaultAgentName?: string;
  /** Defaults from client/household; used only for empty fields when loading saved document. */
  clientDefaults?: Record<string, string>;
};

function parseFieldsData(
  json: string | null,
  clientDefaults?: Record<string, string>
): EmployeeAgreementFields {
  let merged: EmployeeAgreementFields;
  try {
    if (json) {
      const parsed = JSON.parse(json) as Record<string, string>;
      merged = { ...DEFAULT_FIELDS, ...parsed };
    } else {
      merged = { ...DEFAULT_FIELDS };
    }
  } catch (_) {
    merged = { ...DEFAULT_FIELDS };
  }
  if (!merged.date || !String(merged.date).trim()) {
    merged.date = new Date().toISOString().slice(0, 10);
  }
  if (clientDefaults && Object.keys(clientDefaults).length > 0) {
    for (const key of Object.keys(clientDefaults)) {
      const current = merged[key];
      if (current === undefined || current === null || String(current).trim() === "") {
        const def = clientDefaults[key];
        if (def != null && String(def).trim() !== "") merged[key] = String(def).trim();
      }
    }
  }
  return merged;
}

function getHebrewWeekday(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  const names = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const day = d.getDay();
  return `יום ${names[day] ?? ""}`.trim();
}

function EditableCellDate({
  fieldKey,
  canEdit,
  setField,
  fields,
  className = "",
  value,
}: {
  fieldKey: keyof EmployeeAgreementFields;
  canEdit: boolean;
  setField: (k: keyof EmployeeAgreementFields, v: string) => void;
  fields: EmployeeAgreementFields;
  className?: string;
  value: string;
}) {
  const v = fields[fieldKey] ?? value;
  const inputClass = "w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary-500 rounded min-w-0";
  if (!canEdit) {
    return (
      <span className={`font-bold text-center ${className}`}>{v ? formatDate(v) : "—"}</span>
    );
  }
  return (
    <input
      type="date"
      value={v || ""}
      onChange={(e) => setField(fieldKey, e.target.value)}
      className={inputClass + " " + className}
    />
  );
}

function EditableCell({
  value,
  fieldKey,
  canEdit,
  setField,
  fields,
  className = "",
  type = "text",
}: {
  value: string;
  fieldKey: keyof EmployeeAgreementFields;
  canEdit: boolean;
  setField: (k: keyof EmployeeAgreementFields, v: string) => void;
  fields: EmployeeAgreementFields;
  className?: string;
  type?: "text" | "date";
}) {
  const v = fields[fieldKey] ?? value;
  const inputClass =
    "w-full border-0 bg-transparent py-0.5 px-1 text-ink-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary-500 rounded min-w-0";
  if (type === "date") {
    return (
      <EditableCellDate
        fieldKey={fieldKey}
        canEdit={canEdit}
        setField={setField}
        fields={fields}
        className={className}
        value={value}
      />
    );
  }
  return (
    <>
      {canEdit ? (
        <input
          type="text"
          value={v}
          onChange={(e) => setField(fieldKey, e.target.value)}
          className={inputClass + " " + className}
        />
      ) : (
        <span className={`font-bold text-center ${className}`}>{v || "—"}</span>
      )}
    </>
  );
}

export function EmployeeAgreementTemplate({
  documentId,
  initialFieldsData,
  clientName,
  canEdit,
  defaultAgentName,
  clientDefaults,
}: Props) {
  const router = useRouter();
  const [fields, setFields] = useState<EmployeeAgreementFields>(() =>
    parseFieldsData(initialFieldsData, clientDefaults)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const parsed = parseFieldsData(initialFieldsData, clientDefaults);
    if (
      !parsed.agreementType &&
      defaultAgentName &&
      (AGREEMENT_TYPE_OPTIONS as readonly string[]).includes(defaultAgentName)
    ) {
      parsed.agreementType = defaultAgentName;
      const fee = AGREEMENT_FEES[defaultAgentName];
      if (fee) {
        parsed.openingFee = fee.openingFee;
        parsed.commissionPercent = fee.commissionPercent;
      }
    }
    setFields(parsed);
  }, [initialFieldsData, defaultAgentName, clientDefaults]);

  function setField(key: keyof EmployeeAgreementFields, value: string) {
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

  const primaryIdNumber = (fields.idNumber ?? "").trim();
  const spouseIdNumberVal = (fields.spouseIdNumber ?? "").trim();
  const primaryFullNameDisplay = (fields.primaryFullName ?? "").trim() || "—";
  const spouseFullNameDisplay = (fields.spouseFullName ?? "").trim() || "—";

  const effectiveDate = (fields.date && fields.date.trim()) || new Date().toISOString().slice(0, 10);
  const weekdayLabel = getHebrewWeekday(effectiveDate);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/documents" className="btn btn-ghost inline-flex">
          <ArrowLeft className="h-4 w-4 rotate-180" />
          חזרה לסוגי מסמכים
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => window.print()} className="btn btn-ghost text-sm">
            הדפס
          </button>
          <button type="button" onClick={() => window.print()} className="btn btn-ghost text-sm">
            הורד PDF
          </button>
          {canEdit && (
            <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? "שומר…" : "שמור"}
            </button>
          )}
        </div>
      </div>

      <div
        className="print-root mx-auto bg-white shadow-md rounded-sm overflow-hidden"
        style={{ width: "210mm", minHeight: "297mm", maxWidth: "100%" }}
        dir="rtl"
      >
        <div
          className="p-10 text-ink-900"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "14px" }}
        >
          {/* Top business header */}
          <div className="mb-4" dir="ltr">
            <div className="flex items-start justify-between gap-4">
              {/* Left block – English */}
              <div className="text-xs leading-relaxed text-left">
                <div>Eliyahu Perets-C.T.A</div>
                <div>E.Perets nihul &amp; heshbonaut L.T.D</div>
                <div>P.O. Box 205, REHOVOT</div>
                <div>Tel: +972-77-4140451</div>
              </div>

              {/* Center logo */}
              <div className="flex items-center justify-center px-4">
                <img
                  src="/logo.png"
                  alt="EP Logo"
                  style={{ width: "80px", height: "auto" }}
                  draggable={false}
                />
              </div>

              {/* Right block – Hebrew */}
              <div className="text-xs leading-relaxed text-right" dir="rtl">
                <div>פרץ אליהו-C.T.A</div>
                <div>א. פרץ ניהול חשבונות בע&quot;מ</div>
                <div>עזרא 4 (קומה ב&apos;) ת.ד 205, רחובות</div>
                <div>טלפון: 077-4140451</div>
              </div>
            </div>
            {/* Fax + email row on same line */}
            <div className="mt-1 text-xs flex items-baseline justify-between gap-4">
              <div className="text-left">FAX: +972-77-4140452</div>
              <div className="flex-1 text-center">email: eli@perets.tax</div>
              <div className="text-right" dir="rtl">
                פקס: 077-4140452
              </div>
            </div>
            {/* Divider line under header */}
            <div className="mt-1" style={{ borderBottom: "2px solid #000" }} />
          </div>

          {/* Header row: בס"ד on right, date then weekday (DD/MM/YYYY) on left */}
          <div className="mb-4 flex items-start justify-between">
            <span className="text-sm">בס&quot;ד</span>
            <div className="flex flex-col items-center text-center">
              {canEdit ? (
                <input
                  type="date"
                  value={fields.date || effectiveDate}
                  onChange={(e) => setField("date", e.target.value)}
                  className="w-28 border-0 bg-transparent p-0 text-ink-900 focus:outline-none focus:ring-0 text-center"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "14px" }}
                />
              ) : (
                <span>{isoToDdMmYyyy(effectiveDate) || "—"}</span>
              )}
              <span>{weekdayLabel || "יום"}</span>
            </div>
          </div>

          {/* הנדון */}
          <p className="font-bold mb-1 text-center">הנדון: הסכם התקשרות למטרת החזרי מס</p>

          {/* Centered dropdown only (no label) */}
          <div className="mb-2 flex justify-center" dir="rtl">
            <select
              value={fields.agreementType ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setField("agreementType", v);
                if (v === "משרד") {
                  setField("openingFee", "");
                  setField("commissionPercent", "");
                } else if (v && AGREEMENT_FEES[v]) {
                  setField("openingFee", AGREEMENT_FEES[v].openingFee);
                  setField("commissionPercent", AGREEMENT_FEES[v].commissionPercent);
                }
              }}
              className="doc-header-select input text-sm w-auto"
              dir="rtl"
            >
              <option value="">— בחר —</option>
              {AGREEMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* First table: client details */}
          <table className="doc-table w-full border-collapse mb-4" style={{ fontSize: "14px" }}>
            <tbody>
              <tr>
                <td className="border border-ink-300 py-2 px-3">
                  <EditableCell
                    value="רחל"
                    fieldKey="firstName"
                    canEdit={canEdit}
                    setField={setField}
                    fields={fields}
                  />
                </td>
                <td colSpan={2} className="border border-ink-300 py-2 px-3">
                  <EditableCell
                    value="מכלוף"
                    fieldKey="lastName"
                    canEdit={canEdit}
                    setField={setField}
                    fields={fields}
                  />
                </td>
                <td colSpan={2} className="border border-ink-300 py-2 px-3">
                  {canEdit ? (
                    <span className="inline-flex gap-1 flex-wrap">
                      <input
                        type="text"
                        value={fields.idNumber ?? ""}
                        onChange={(e) => setField("idNumber", e.target.value)}
                        className="w-24 border-0 bg-transparent py-0.5 px-1 text-ink-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                        placeholder="ת.ז."
                      />
                      <span>,</span>
                      <input
                        type="text"
                        value={fields.spouseIdNumber ?? ""}
                        onChange={(e) => setField("spouseIdNumber", e.target.value)}
                        className="w-24 border-0 bg-transparent py-0.5 px-1 text-ink-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary-500 rounded"
                        placeholder="ת.ז. בן/ת זוג"
                      />
                    </span>
                  ) : (
                    <span className="font-bold text-center inline-block w-full">
                      {[fields.idNumber, fields.spouseIdNumber].filter(Boolean).join(" , ") || "—"}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-ink-300 py-2 px-3 font-medium">שם פרטי</td>
                <td colSpan={2} className="border border-ink-300 py-2 px-3 font-medium">
                  שם משפחה
                </td>
                <td colSpan={2} className="border border-ink-300 py-2 px-3 font-medium">
                  ת.ז.
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-ink-300 py-2 px-3">
                  {canEdit ? (
                    <EditableCell
                      value="הגאונים"
                      fieldKey="street"
                      canEdit={canEdit}
                      setField={setField}
                      fields={fields}
                    />
                  ) : (
                    <span className="font-bold text-center inline-block w-full">
                      {(() => {
                        const street = fields.street ?? "";
                        const cleanStreet = street.replace(/\s+\d+$/, "");
                        const address = [cleanStreet, fields.houseNumber].filter(Boolean).join(" ");
                        return address || "—";
                      })()}
                    </span>
                  )}
                </td>
                <td className="border border-ink-300 py-2 px-3">
                  <EditableCell
                    value="5"
                    fieldKey="houseNumber"
                    canEdit={canEdit}
                    setField={setField}
                    fields={fields}
                  />
                </td>
                <td className="border border-ink-300 py-2 px-3">
                  <EditableCell
                    value="רחובות"
                    fieldKey="city"
                    canEdit={canEdit}
                    setField={setField}
                    fields={fields}
                  />
                </td>
                <td className="border border-ink-300 py-2 px-3">
                  <EditableCell
                    value=""
                    fieldKey="zip"
                    canEdit={canEdit}
                    setField={setField}
                    fields={fields}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-ink-300 py-2 px-3 font-medium">
                  רחוב
                </td>
                <td className="border border-ink-300 py-2 px-3 font-medium">מספר בית</td>
                <td className="border border-ink-300 py-2 px-3 font-medium">יישוב</td>
                <td className="border border-ink-300 py-2 px-3 font-medium">מיקוד</td>
              </tr>
            </tbody>
          </table>

          <p className="mb-4">(להלן הנישום)</p>

          {/* Body paragraphs - exact wording from source */}
          <p className="text-justify mb-2">
            הואיל &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; והינך מעוניין שאבצע עבורך
            בדיקה והגשת דוחות למטרת החזרי מס לשכיר.
          </p>
          <p className="text-justify mb-2">
            והואיל &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; והוסכם ביננו כי הבדיקה והגשת הדוחות למס
            הכנסה יבוצע על ידי.
          </p>
          <p className="text-justify mb-4">
            והואיל &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; והסכמתי לבצע עבורך את הבדיקה, ועריכת
            הדוחות למס הכנסה לצורך החזר מס.
          </p>

          <p className="font-bold mb-3 text-center underline">
            לפיכך, הוסכם, הוצהר והותנה בין הצדדים כדלקמן:
          </p>

          <ol
            className="agreement-list list-decimal list-inside space-y-3 text-justify"
            style={{ marginRight: "1em" }}
          >
            <li>
              <strong className="underline">התחייבות הנישום:</strong>
              <ol className="list-decimal list-inside mr-4 mt-2 space-y-2">
                <li>
                  הנישום מייפה את כוחי למייצגו היחידי, לבצע עבורו את הטיפול בהגשת הדוחות למס הכנסה
                  למטרת החזרי מס לשכיר, לרבות פנייה לגורמים שונים לקבלת המסמכים הנדרשים לטיפול
                  בהחזר המס.
                </li>
                <li>
                  הנישום מתחייב בזאת כי מסר לי את כל הפרטים הנכונים והאמיתיים אשר הובילו לקבלת
                  החזר ממס הכנסה.
                </li>
                <li>
                  הנישום מתחייב להגיש עזרה בכל נושא אשר ידרש לשם סיום הליך הבדיקה, וכמו כן מודע
                  לעובדה כי באם ידרש לעזרה ולא יעשה כן, הטיפול יכול להתעכב ביתר מהצפוי.
                </li>
                <li>
                  במידה וישנם חובות במוסדות המס השונים, לרבות המוסד לביטוח לאומי, מע&quot;מ וכו&#39;,
                  על שם הנישום, לא תהא כל אחריות כלפי המייצג, והנישום ישא בכל תשלום לכיסוי החוב
                  במוסדות הנ&quot;ל.
                </li>
                <li>
                  במידה ולנישום ישנו חוב במס הכנסה, מע&quot;מ, ביטוח לאומי, והחזר המס אשר התקבל
                  כתוצאה מהליך הבדיקה על ידי, קוזז לשם כיסוי החוב ברשויות לעיל יגבה שכ&quot;ט{" "}
                  <strong>מלא</strong> עבור החזר המס אשר קוזז.
                </li>
                <li>
                  האחריות הראשונית לנכונות ושלמות הדוחות המוגשים למס הכנסה (לרבות תצהירים ואישורים
                  נלווים וכו&#39;) חלה על הנישום ואין במתן השרות המקצועי הניתן על ידי המייצג בכדי לגרוע
                  מאחריות הנישום לדוחות אלו.
                </li>
                <li>
                  הנישום ו/או בן/ת הזוג מאשרים למייצג לפרסם ברשומות את שם המשפחה בלבד, ואת סכום
                  ההחזר שקיבל הנישום.
                </li>
              </ol>
            </li>
            <li>
              <strong className="underline">התחייבות המייצג:</strong>
              <ol className="list-decimal list-inside mr-4 mt-2 space-y-2">
                <li>
                  כמייצג הנני מתחייב לטפל בכל תהליך קבלת ההחזר בפועל עבור השנים אשר הוגשו
                  באמצעותי, גם לאחר גביית שכ&quot;ט לרבות תיקון שומות, וייצוג במס הכנסה, בכפוף לאמור
                  בסעיף 1.5 לעיל אם יתברר כי גביתי שכ&quot;ט יותר מאשר התחייבתי, יוחזר לנישום החלק
                  היחסי של העמלה אשר גביתי ולא התקבלה בפועל ממס הכנסה.
                </li>
                <li>
                  כמייצג הנני מתחייב כי כל הטיפול, התכתובת, והדיונים במס הכנסה אשר נובעים כתוצאה
                  מהליך בדיקת החזר המס לשכיר, יבוצעו על ידי ללא כל תוספת עמלה מעבר לעמלה המוסכמת
                  בסעיף התמורה.
                </li>
                <li>
                  בכפוף לאמור בסעיף 1.5 לעיל כמייצג הנני מתחייב כי החזר המס ממס הכנסה יופקד
                  לחשבון הבנק אותו מסר לי הנישום במעמד החתימה על הדוחות.
                </li>
                <li>הנני מתחייב שלא לפרוע את תשלום העמלה עד אשר יתקבל ההחזר ממס הכנסה לנישום.</li>
                <li>
                  הנני מתחייב לפעול ולקיים את חובותיי לפי כל דין ובפרט לפי הדינים היחודיים המסדרים
                  את פעילותו של יועץ מס ובכלל זה בחוק הסדרת העיסוק בייצוג על ידי יועצי מס, תשס&quot;ה-2005
                  וכל תקנות ו/או חוזרים ו/או הנחיות מכוחם של חוקים אלה.
                </li>
              </ol>
            </li>
            <li>
              <strong className="underline">התמורה:</strong>
              <ol className="list-decimal list-inside mr-4 mt-2 space-y-2">
                <li>
                  תמורת הבדיקה, עריכה, והגשת הדוחות למס הכנסה באמצעותי, ישלם הנישום:
                  <ol className="list-decimal list-inside mr-4 mt-2 space-y-2">
                    <li>
                      עמלת פתיחת תיק בסך{" "}
                      {canEdit ? (
                        <strong>
                          <input
                            type="text"
                            value={fields.openingFee ?? ""}
                            onChange={(e) => setField("openingFee", e.target.value)}
                            className="w-14 border-0 border-b border-ink-300 bg-transparent p-0 text-center text-ink-900 focus:outline-none focus:ring-0"
                          />
                        </strong>
                      ) : (
                        <strong>{fields.openingFee ?? "—"}</strong>
                      )}{" "}
                      ₪ כולל מע&quot;מ כחוק- תשולם במועד החתימה על הסכם זה.
                    </li>
                    <li>
                      ובנוסף לסעיף 3.1.1 ישלם הנישום שכ&quot;ט בשיעור של{" "}
                      <strong className="inline-flex items-center gap-1" dir="ltr">
                      {canEdit ? (
                          <input
                            type="text"
                            value={fields.commissionPercent ?? ""}
                            onChange={(e) => setField("commissionPercent", e.target.value)}
                            className="w-10 border-0 border-b border-ink-300 bg-transparent p-0 text-center text-ink-900 focus:outline-none focus:ring-0"
                          />
                      ) : (
                          <span>{fields.commissionPercent ?? "—"}</span>
                      )}
                        <span>%</span>
                      </strong>{" "}
                      + מע&quot;מ מסך ההחזרים שיקבל הנישום, כאשר עמלה זו תשולם במועד שבו יקבל הנישום
                      את החזרי המס לחשבונו.
                    </li>
                    <li>
                      במעמד החתימה על הדוחות לצורך הגשתן למס הכנסה, הנישום ימסור למייצג מספר כרטיס
                      אשראי או שיק בסכום העמלה המפורטת בסעיף 3.1.2 ו- 3.1.1 דחוי ל- 90 ימים,חשבנות הסופית בגין שכ&quot;ט המגיע למייצג עפ&quot;י הסכם זה תחושב לאחר קבלת
                      ההחזר ממס הכנסה ותחושב מתוך סך ההחזר בפועל כולל ריביות והצמדות שהתקבלו.
                    </li>
                    <li>
                      <strong className="underline">
                        במידה והנישום לא יעביר את תשלום שכ&quot;ט המגיע למייצג בתוך 7 ימי עסקים מיום
                        שקיבל את ההחזר לחשבונו, המייצג יגבה את התשלום המגיע לו באמצעות כרטיס האשראי
                        שממנו שילם הנישום למייצג את התשלום בגין עמלת פתיחת התיק.
                      </strong>
                    </li>
                  </ol>
                </li>
                <li>
                  קבלה עבור עמלות המייצג תופק מיידית עם קבלת הממסר, וחשבונית המס המותרת בניכוי
                  לשכיר, תופק תוך 14 ימי עסקים ממועד פרעון השיק.
                </li>
                <li>
                  במידה ויעביר הנישום את הטיפול בהחזר המס למייצג אחר לאחר התחלת הליך הבדיקה
                  באמצעותי ו/או יחליט כי אינו מעוניין בהמשך טיפול לאחר סיום הליך הבדיקה, ו/או ההגשה
                  לרשויות, ישלם הנישום למייצג סך 1,000 ₪ בתוספת מע&quot;מ כחוק, או 10% מערך החזר המס
                  שנמצא, כגבוהה.
                </li>
                <li>
                  באם ימצא, לאחר הליך הבדיקה, כי לא מגיע לנישום החזר ממס הכנסה, כל הליך הבדיקה
                  ע&quot;י המייצג יבוצע בחינם, ולא יגבה בגינה כל שכ&quot;ט שהוא.
                </li>
              </ol>
            </li>
          </ol>

          <p className="font-bold mb-4 mt-6">ולראיה באנו על החתום:</p>

          {/* Signature table */}
          <table className="doc-table w-full border-collapse" style={{ fontSize: "14px" }}>
            <tbody>
              <tr>
                <td rowSpan={2} className="border border-ink-300 py-2 px-3 font-medium w-24">
                  לקוח
                </td>
                <td className="border border-ink-300 py-2 px-3">
                  <span className="font-bold">{primaryFullNameDisplay}</span>
                </td>
                <td className="border border-ink-300 py-2 px-3">
                  <span className="font-bold">{primaryIdNumber || "—"}</span>
                </td>
                <td className="border border-ink-300 py-2 px-3"></td>
              </tr>
              <tr>
                <td className="border border-ink-300 py-2 px-3 font-medium">שם מלא</td>
                <td className="border border-ink-300 py-2 px-3 font-medium">ת.ז.</td>
                <td className="border border-ink-300 py-2 px-3 font-medium">חתימה</td>
              </tr>
              <tr>
                <td rowSpan={2} className="border border-ink-300 py-2 px-3 font-medium">
                  בן הזוג
                </td>
                <td className="border border-ink-300 py-2 px-3">
                  <span className="font-bold">{spouseFullNameDisplay}</span>
                </td>
                <td className="border border-ink-300 py-2 px-3">
                  <span className="font-bold">{spouseIdNumberVal || "—"}</span>
                </td>
                <td className="border border-ink-300 py-2 px-3"></td>
              </tr>
              <tr>
                <td className="border border-ink-300 py-2 px-3 font-medium">שם מלא</td>
                <td className="border border-ink-300 py-2 px-3 font-medium">ת.ז.</td>
                <td className="border border-ink-300 py-2 px-3 font-medium">חתימה</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-center print:hidden">
          <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? "שומר…" : "שמור"}
          </button>
        </div>
      )}
      <style jsx>{`
        .doc-header-select {
          max-width: 120px;
          padding: 2px 6px 2px 1.25rem;
        }
        .doc-table th,
        .doc-table td {
          text-align: center;
          vertical-align: middle;
          padding-top: 4px;
          padding-bottom: 4px;
        }
        .doc-table th input,
        .doc-table td input {
          text-align: center;
        }
        .agreement-list {
          counter-reset: section;
        }
        .agreement-list > li {
          counter-increment: section;
        }
        .agreement-list > li::marker {
          content: counter(section) ". ";
        }
        .agreement-list > li > ol {
          counter-reset: subsection;
        }
        .agreement-list > li > ol > li {
          counter-increment: subsection;
        }
        .agreement-list > li > ol > li::marker {
          content: counter(section) "." counter(subsection) " ";
        }
      `}</style>
    </div>
  );
}

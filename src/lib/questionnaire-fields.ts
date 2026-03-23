/** Shared questionnaire field definitions for CRM and client pages */
export const OPTIONS = ["המבקש/ת", "בן/בת הזוג", "לא"] as const;
export const GENDER_OPTIONS = ["זכר", "נקבה"] as const;
export const MARITAL_OPTIONS = ["רווק/ה", "נשוי/ה", "גרוש/ה", "אלמנ/ה"] as const;
export const NUM_QUESTIONS = 16;

export const ID_FIELDS = [
  { key: "id_fullName", label: "שם מלא", type: "text" as const },
  { key: "id_idNumber", label: "ת.ז", type: "text" as const },
  { key: "id_birthDate", label: "תאריך לידה", type: "date" as const },
  { key: "id_gender", label: "מגדר", sublabel: "על פי הרשום ב-ת.ז", type: "gender" as const },
  { key: "id_phone", label: "טלפון", type: "text" as const },
  { key: "id_license", label: "רישיון נהיגה", sublabel: "אופציונלי", type: "text" as const },
  { key: "id_email", label: "אימייל", sublabel: "אופציונלי", type: "text" as const },
  { key: "id_spouseName", label: "בן/בת זוג - שם", sublabel: "במידה ויש", type: "text" as const },
  { key: "id_spouseId", label: "בן/בת זוג - ת.ז", sublabel: "במידה ויש", type: "text" as const },
  { key: "id_spouseBirthDate", label: "בן/בת זוג - תאריך לידה", sublabel: "במידה ויש", type: "text" as const },
  { key: "id_spouseLicense", label: "בן/בת זוג - רישיון", sublabel: "במידה ויש", type: "text" as const },
  { key: "id_maritalStatus", label: "מצב משפחתי", type: "marital" as const },
  { key: "id_marriageYear", label: "שנת נישואין", sublabel: "במידה ויש", type: "text" as const },
] as const;

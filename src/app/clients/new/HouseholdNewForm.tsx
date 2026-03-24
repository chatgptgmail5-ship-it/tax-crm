"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { phoneDisplayValue, phoneInputValue, licenseInputValue } from "@/lib/utils";

const YP_OPTIONS = ["ממתין לחתימת הלקוח", "ממתין לקליטת ייצוג", "נקלט בהצלחה"];
const MARITAL_OPTIONS = ["גרוש/ה", "נשוי/ה", "ידוע/ה בציבור", "פרוד/ה", "רווק/ה", "חד הורי/ת", "אלמנ/ה"];

type PersonInput = {
  role: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  ypSeum: string;
  ypBituahLeumi: string;
  issueDate: string;
  licenseNumber: string;
  maritalStatus: string;
};

type Props = {
  agents: { agentId: number; name: string | null }[];
  clerks: { clerkId: number; name: string | null }[];
};

const emptyPerson = (role: string): PersonInput => ({
  role,
  firstName: "",
  lastName: "",
  idNumber: "",
  birthDate: "",
  gender: "",
  phone: "",
  email: "",
  ypSeum: "",
  ypBituahLeumi: "",
  issueDate: "",
  licenseNumber: "",
  maritalStatus: "",
});

export function HouseholdNewForm({ agents, clerks }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [husband, setHusband] = useState<PersonInput>(() => emptyPerson("husband"));
  const [wife, setWife] = useState<PersonInput>(() => emptyPerson("wife"));
  const [household, setHousehold] = useState({
    generalStatus: "",
    internalId: "",
    address: "",
    street: "",
    houseNumber: "",
    city: "",
    agentId: "",
    clerkId: "",
    cp: "",
    cp2: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!husband.firstName && !husband.lastName && !wife.firstName && !wife.lastName) {
      setError("נא להזין לפחות שם לבעל או לאישה.");
      return;
    }
    setSaving(true);
    setError(null);
    const persons = [
      { ...husband, role: "husband" },
      ...(hasSpouse ? [{ ...wife, role: "wife" }] : []),
    ].filter((p) => p.firstName || p.lastName);

    const res = await fetch("/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...household,
        agentId: household.agentId ? parseInt(household.agentId) : null,
        clerkId: household.clerkId ? parseInt(household.clerkId) : null,
        cp: household.cp ? parseFloat(household.cp) : null,
        cp2: household.cp2 ? parseFloat(household.cp2) : null,
        persons: persons.map((p) => {
          const { ypSeum, ypBituahLeumi, issueDate, licenseNumber, maritalStatus, ...rest } = p;
          const flags = ypSeum || ypBituahLeumi || issueDate || licenseNumber || maritalStatus
            ? JSON.stringify({ ypSeum: ypSeum || null, ypBituahLeumi: ypBituahLeumi || null, issueDate: issueDate || null, licenseNumber: licenseNumber || null, maritalStatus: maritalStatus || null })
            : null;
          return { ...rest, birthDate: rest.birthDate || null, flags };
        }),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "יצירה נכשלה");
      return;
    }
    router.push(`/clients/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-ink-900">בן/בת הזוג הרשום</h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label block mb-1">שם פרטי</label>
                <input
                  value={husband.firstName}
                  onChange={(e) => setHusband((p) => ({ ...p, firstName: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label block mb-1">שם משפחה</label>
                <input
                  value={husband.lastName}
                  onChange={(e) => setHusband((p) => ({ ...p, lastName: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label block mb-1">ת.ז.</label>
              <input
                value={husband.idNumber}
                onChange={(e) => setHusband((p) => ({ ...p, idNumber: e.target.value }))}
                className="input"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label block mb-1">תאריך לידה</label>
                <input
                  type="date"
                  value={husband.birthDate}
                  onChange={(e) => setHusband((p) => ({ ...p, birthDate: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label block mb-1">מגדר</label>
                <select
                  value={husband.gender}
                  onChange={(e) => setHusband((p) => ({ ...p, gender: e.target.value }))}
                  className="input"
                >
                  <option value="">בחר</option>
                  <option value="male">זכר</option>
                  <option value="female">נקבה</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label block mb-1">טלפון</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneDisplayValue(husband.phone)}
                  onChange={(e) => setHusband((p) => ({ ...p, phone: phoneInputValue(e.target.value) }))}
                  className="input"
                  maxLength={12}
                />
              </div>
            </div>
            <div>
              <label className="label block mb-1">אימייל</label>
              <input
                type="email"
                value={husband.email}
                onChange={(e) => setHusband((p) => ({ ...p, email: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1">י.פ שעם</label>
              <select
                value={husband.ypSeum}
                onChange={(e) => setHusband((p) => ({ ...p, ypSeum: e.target.value }))}
                className="input"
              >
                <option value="">—</option>
                {YP_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1">י.פ ביטוח לאומי</label>
              <select
                value={husband.ypBituahLeumi}
                onChange={(e) => setHusband((p) => ({ ...p, ypBituahLeumi: e.target.value }))}
                className="input"
              >
                <option value="">—</option>
                {YP_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1">תאריך הנפקה</label>
              <input
                type="date"
                value={husband.issueDate}
                onChange={(e) => setHusband((p) => ({ ...p, issueDate: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1">מספר רישיון נהיגה</label>
              <input
                type="text"
                inputMode="numeric"
                value={husband.licenseNumber}
                onChange={(e) => setHusband((p) => ({ ...p, licenseNumber: licenseInputValue(e.target.value) }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1">מצב משפחתי</label>
              <select
                value={husband.maritalStatus}
                onChange={(e) => setHusband((p) => ({ ...p, maritalStatus: e.target.value }))}
                className="input"
              >
                <option value="">—</option>
                {MARITAL_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">בן/בת הזוג</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasSpouse}
                onChange={(e) => setHasSpouse(e.target.checked)}
              />
              יש בן/בת זוג
            </label>
          </div>
          {hasSpouse ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label block mb-1">שם פרטי</label>
                  <input
                    value={wife.firstName}
                    onChange={(e) => setWife((p) => ({ ...p, firstName: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label block mb-1">שם משפחה</label>
                  <input
                    value={wife.lastName}
                    onChange={(e) => setWife((p) => ({ ...p, lastName: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label block mb-1">ת.ז.</label>
                <input
                  value={wife.idNumber}
                  onChange={(e) => setWife((p) => ({ ...p, idNumber: e.target.value }))}
                  className="input"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label block mb-1">תאריך לידה</label>
                  <input
                    type="date"
                    value={wife.birthDate}
                    onChange={(e) => setWife((p) => ({ ...p, birthDate: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label block mb-1">מגדר</label>
                  <select
                    value={wife.gender}
                    onChange={(e) => setWife((p) => ({ ...p, gender: e.target.value }))}
                    className="input"
                  >
                    <option value="">בחר</option>
                    <option value="male">זכר</option>
                    <option value="female">נקבה</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label block mb-1">טלפון</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phoneDisplayValue(wife.phone)}
                    onChange={(e) => setWife((p) => ({ ...p, phone: phoneInputValue(e.target.value) }))}
                    className="input"
                    maxLength={12}
                  />
                </div>
              </div>
              <div>
                <label className="label block mb-1">אימייל</label>
                <input
                  type="email"
                  value={wife.email}
                  onChange={(e) => setWife((p) => ({ ...p, email: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label block mb-1">י.פ שעם</label>
                <select
                  value={wife.ypSeum}
                  onChange={(e) => setWife((p) => ({ ...p, ypSeum: e.target.value }))}
                  className="input"
                >
                  <option value="">—</option>
                  {YP_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label block mb-1">י.פ ביטוח לאומי</label>
                <select
                  value={wife.ypBituahLeumi}
                  onChange={(e) => setWife((p) => ({ ...p, ypBituahLeumi: e.target.value }))}
                  className="input"
                >
                  <option value="">—</option>
                  {YP_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label block mb-1">תאריך הנפקה</label>
                <input
                  type="date"
                  value={wife.issueDate}
                  onChange={(e) => setWife((p) => ({ ...p, issueDate: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label block mb-1">מספר רישיון נהיגה</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={wife.licenseNumber}
                  onChange={(e) => setWife((p) => ({ ...p, licenseNumber: licenseInputValue(e.target.value) }))}
                  className="input"
                />
              </div>
              <div>
                <label className="label block mb-1">מצב משפחתי</label>
                <select
                  value={wife.maritalStatus}
                  onChange={(e) => setWife((p) => ({ ...p, maritalStatus: e.target.value }))}
                  className="input"
                >
                  <option value="">—</option>
                  {MARITAL_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-500">משק בית יחיד — סימון &quot;יש בן/בת זוג&quot; יציג את השדות.</p>
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "יוצר…" : "צור לקוח"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { phoneDisplayValue, phoneInputValue, licenseInputValue, isoToDdMmYyyy, parseDdMmYyyyToIso } from "@/lib/utils";

const YP_OPTIONS = ["ממתין לחתימת הלקוח", "ממתין לקליטת ייצוג", "נקלט בהצלחה"];
const MARITAL_OPTIONS = ["גרוש/ה", "נשוי/ה", "ידוע/ה בציבור", "פרוד/ה", "רווק/ה", "חד הורי/ת", "אלמנ/ה"];

type Person = {
  id: number;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  idNumber: string | null;
  birthDate: Date | string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  flags: string | null;
};

type Props = {
  householdId: number;
  persons: Person[];
  agents: { agentId: number; name: string | null }[];
  readOnly?: boolean;
};

const toLocalDate = (d: Date | string | null) => {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
};

function PersonFields({
  p,
  setP,
  label,
  card = true,
  disabled,
}: {
  p: Record<string, string>;
  setP: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  label: string;
  card?: boolean;
  disabled?: boolean;
}) {
  const [birthStr, setBirthStr] = useState("");
  const [issueStr, setIssueStr] = useState("");
  const fields = (
    <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label block mb-1">שם פרטי</label>
            <input
              value={p.firstName}
              onChange={(e) => setP((prev) => ({ ...prev, firstName: e.target.value }))}
              className="input"
              readOnly={disabled}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label block mb-1">שם משפחה</label>
            <input
              value={p.lastName}
              onChange={(e) => setP((prev) => ({ ...prev, lastName: e.target.value }))}
              className="input"
              readOnly={disabled}
              disabled={disabled}
            />
          </div>
        </div>
        <div>
          <label className="label block mb-1">ת.ז.</label>
            <input
              value={p.idNumber}
              onChange={(e) => setP((prev) => ({ ...prev, idNumber: e.target.value }))}
              className="input"
              readOnly={disabled}
              disabled={disabled}
            />
        </div>
        <div>
          <label className="label block mb-1">תאריך הנפקה</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="dd/MM/yyyy"
            value={issueStr !== "" ? issueStr : isoToDdMmYyyy(p.issueDate ?? "")}
            onChange={(e) => {
              const raw = e.target.value;
              setIssueStr(raw);
              const iso = parseDdMmYyyyToIso(raw);
              if (iso) setP((prev) => ({ ...prev, issueDate: iso }));
              else if (!raw.trim()) setP((prev) => ({ ...prev, issueDate: "" }));
            }}
            className="input"
            readOnly={disabled}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label block mb-1">תאריך לידה</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd/MM/yyyy"
              value={birthStr !== "" ? birthStr : isoToDdMmYyyy(p.birthDate)}
              onChange={(e) => {
                const raw = e.target.value;
                setBirthStr(raw);
                const iso = parseDdMmYyyyToIso(raw);
                if (iso) setP((prev) => ({ ...prev, birthDate: iso }));
                else if (!raw.trim()) setP((prev) => ({ ...prev, birthDate: "" }));
              }}
              className="input"
              readOnly={disabled}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label block mb-1">מגדר</label>
            <input
              value={p.gender}
              onChange={(e) => setP((prev) => ({ ...prev, gender: e.target.value }))}
              className="input"
              placeholder="זכר / נקבה"
              readOnly={disabled}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label block mb-1">טלפון</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phoneDisplayValue(p.phone ?? "")}
              onChange={(e) => setP((prev) => ({ ...prev, phone: phoneInputValue(e.target.value) }))}
              className="input"
              readOnly={disabled}
              disabled={disabled}
              maxLength={12}
            />
          </div>
          <div>
            <label className="label block mb-1">אימייל</label>
            <input
              type="email"
              value={p.email}
              onChange={(e) => setP((prev) => ({ ...prev, email: e.target.value }))}
              className="input"
              readOnly={disabled}
              disabled={disabled}
            />
          </div>
        </div>
        <div>
          <label className="label block mb-1">י.פ שעם</label>
          <select
            value={p.ypSeum ?? ""}
            onChange={(e) => setP((prev) => ({ ...prev, ypSeum: e.target.value }))}
            className="input"
            disabled={disabled}
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
            value={p.ypBituahLeumi ?? ""}
            onChange={(e) => setP((prev) => ({ ...prev, ypBituahLeumi: e.target.value }))}
            className="input"
            disabled={disabled}
          >
            <option value="">—</option>
            {YP_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label block mb-1">מספר רישיון נהיגה</label>
          <input
            type="text"
            inputMode="numeric"
            value={p.licenseNumber ?? ""}
            onChange={(e) => setP((prev) => ({ ...prev, licenseNumber: licenseInputValue(e.target.value) }))}
            className="input"
            readOnly={disabled}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="label block mb-1">מצב משפחתי</label>
          <select
            value={p.maritalStatus ?? ""}
            onChange={(e) => setP((prev) => ({ ...prev, maritalStatus: e.target.value }))}
            className="input"
            disabled={disabled}
          >
            <option value="">—</option>
            {MARITAL_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
  );

  if (card) {
    return (
      <div className="card p-6">
        {label && <h3 className="mb-4 font-semibold text-ink-900">{label}</h3>}
        {fields}
      </div>
    );
  }
  return fields;
}

export function PersonForm({ householdId, persons, agents, readOnly }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSpouse, setHasSpouse] = useState(persons.some((p) => p.role === "wife"));
  function parseFlags(flags: string | null): Record<string, string> {
    if (!flags) return { ypSeum: "", ypBituahLeumi: "", issueDate: "", licenseNumber: "", maritalStatus: "" };
    try {
      const parsed = JSON.parse(flags) as Record<string, string | null>;
      return {
        ypSeum: parsed?.ypSeum ?? "",
        ypBituahLeumi: parsed?.ypBituahLeumi ?? "",
        issueDate: parsed?.issueDate ?? "",
        licenseNumber: parsed?.licenseNumber ?? "",
        maritalStatus: parsed?.maritalStatus ?? "",
      };
    } catch {
      return { ypSeum: "", ypBituahLeumi: "", issueDate: "", licenseNumber: "", maritalStatus: "" };
    }
  }

  const [husband, setHusband] = useState<Record<string, string>>(() => {
    const h = persons.find((p) => p.role === "husband") ?? persons[0];
    const f = parseFlags(h?.flags ?? null);
    return {
      id: h?.id ? String(h.id) : "",
      firstName: h?.firstName ?? "",
      lastName: h?.lastName ?? "",
      idNumber: h?.idNumber ?? "",
      birthDate: toLocalDate(h?.birthDate),
      gender: h?.gender ?? "",
      phone: h?.phone ?? "",
      email: h?.email ?? "",
      ...f,
    };
  });
  const [wife, setWife] = useState<Record<string, string>>(() => {
    const w = persons.find((p) => p.role === "wife");
    const f = w ? parseFlags(w.flags ?? null) : { ypSeum: "", ypBituahLeumi: "", issueDate: "", licenseNumber: "", maritalStatus: "" };
    return {
      id: w?.id ? String(w.id) : "",
      firstName: w?.firstName ?? "",
      lastName: w?.lastName ?? "",
      idNumber: w?.idNumber ?? "",
      birthDate: toLocalDate(w?.birthDate ?? null),
      gender: w?.gender ?? "",
      phone: w?.phone ?? "",
      email: w?.email ?? "",
      ...f,
    };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const husbandId =
      husband.id && husband.id.trim() !== ""
        ? parseInt(husband.id, 10)
        : null;
    const wifeId =
      hasSpouse && wife.id && wife.id.trim() !== ""
        ? parseInt(wife.id, 10)
        : null;
    const buildFlags = (p: Record<string, string>) => {
      const { ypSeum, ypBituahLeumi, issueDate, licenseNumber, maritalStatus } = p;
      return ypSeum || ypBituahLeumi || issueDate || licenseNumber || maritalStatus
        ? JSON.stringify({ ypSeum: ypSeum || null, ypBituahLeumi: ypBituahLeumi || null, issueDate: issueDate || null, licenseNumber: licenseNumber || null, maritalStatus: maritalStatus || null })
        : null;
    };
    const personsPayload = [
      {
        id: husbandId != null && !Number.isNaN(husbandId) ? husbandId : null,
        role: "husband",
        firstName: husband.firstName || null,
        lastName: husband.lastName || null,
        idNumber: husband.idNumber || null,
        birthDate: husband.birthDate || null,
        gender: husband.gender || null,
        phone: husband.phone || null,
        email: husband.email || null,
        flags: buildFlags(husband),
      },
      ...(hasSpouse
        ? [
            {
              id: wifeId != null && !Number.isNaN(wifeId) ? wifeId : null,
              role: "wife",
              firstName: wife.firstName || null,
              lastName: wife.lastName || null,
              idNumber: wife.idNumber || null,
              birthDate: wife.birthDate || null,
              gender: wife.gender || null,
              phone: wife.phone || null,
              email: wife.email || null,
              flags: buildFlags(wife),
            },
          ]
        : []),
    ];

    const res = await fetch(`/api/households/${householdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persons: personsPayload }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "שמירה נכשלה");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <PersonFields key="husband" p={husband} setP={setHusband} label="בן הזוג הרשום" disabled={readOnly} />
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">בן/בת הזוג</h3>
            {!readOnly && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasSpouse}
                  onChange={(e) => setHasSpouse(e.target.checked)}
                />
                יש בן/בת זוג
              </label>
            )}
          </div>
          {hasSpouse ? (
            <PersonFields key="wife" p={wife} setP={setWife} label="" card={false} disabled={readOnly} />
          ) : (
            <p className="text-sm text-ink-500">משק בית יחיד</p>
          )}
        </div>
      </div>
      {!readOnly && (
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "שומר…" : "שמור"}
        </button>
      )}
    </form>
  );
}

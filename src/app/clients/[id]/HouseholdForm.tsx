"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Agent = { agentId: number; name: string | null; cp: number | null; cp2: number | null };

const TAX_OFFICE_OPTIONS = [
  "רחובות",
  "אילת",
  "אשקלון",
  "באר שבע",
  "גוש דן",
  "חולון",
  "ירושלים 1",
  "ירושלים 2",
  "ירושלים 3",
  "נתניה",
  "פתח תקווה",
  "חיפה",
  "רמלה",
  "תל אביב 1",
  "תל אביב 3",
  "תל אביב 4",
  "תל אביב 5",
  "כפר סבא",
  "טבריה",
  "עפולה",
  "צפת",
  "נצרת",
  "עכו",
  "חדרה",
] as const;

type Props = {
  readOnly?: boolean;
  household: {
    id: number;
    generalStatus: string | null;
    internalId: string | null;
    address: string | null;
    street: string | null;
    houseNumber: string | null;
    city: string | null;
    notes: string | null;
    cp: number | null;
    cp2: number | null;
    agentId: number | null;
    clerkId: number | null;
    agent?: { name: string | null } | null;
    clerk?: { name: string | null } | null;
    persons?: { id: number; role: string | null; idNumber: string | null }[];
  };
  agents: Agent[];
  clerks: { clerkId: number; name: string | null }[];
};

export function HouseholdForm({ household, agents, clerks, readOnly }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentInput, setAgentInput] = useState(household.agent?.name ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const agentInputRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    generalStatus: household.generalStatus ?? "",
    internalId: household.internalId ?? "",
    address: household.address ?? "",
    street: household.street ?? "",
    houseNumber: household.houseNumber ?? "",
    city: household.city ?? "",
    notes: household.notes ?? "",
    cp: household.cp ?? "",
    cp2: household.cp2 ?? "",
    agentId: household.agentId ?? "",
    clerkId: household.clerkId ?? "",
    taxOffice: household.clerk?.name ?? "",
    squad: "",
    taxCaseType: "",
  });

  const husband = household.persons?.find((p) => p.role === "husband") ?? household.persons?.[0];
  const registeredPartnerId = husband?.idNumber ?? "";

  const filteredAgents = agents.filter(
    (a) => (a.name ?? "").toLowerCase().includes(agentInput.trim().toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (agentInputRef.current && !agentInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectAgent(a: Agent) {
    setAgentInput(a.name ?? "");
    setForm((f) => ({
      ...f,
      agentId: String(a.agentId),
      cp: a.cp != null ? String(a.cp) : "",
      cp2: a.cp2 != null ? String(a.cp2) : "",
    }));
    setShowSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/households/${household.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generalStatus: form.generalStatus || null,
        internalId: form.internalId || null,
        address: form.address || null,
        street: form.street || null,
        houseNumber: form.houseNumber || null,
        city: form.city || null,
        notes: form.notes || null,
        cp: form.cp ? parseFloat(form.cp as string) : null,
        cp2: form.cp2 ? parseFloat(form.cp2 as string) : null,
        agentId: form.agentId ? parseInt(form.agentId as string) : null,
        clerkId: form.clerkId ? parseInt(form.clerkId as string) : null,
        clerkName: form.taxOffice || null,
      }),
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
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {/* Row 1: ת.ז בן/בת זוג הרשום | שלב התיק */}
        <div className="sm:col-span-2">
          <label className="label block mb-1">ת.ז בן/בת הזוג הרשום</label>
          <input
            type="text"
            value={registeredPartnerId || "—"}
            readOnly
            className="input bg-ink-50"
            disabled
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label block mb-1">שלב התיק</label>
          <select
            value={form.generalStatus}
            onChange={(e) => setForm((f) => ({ ...f, generalStatus: e.target.value }))}
            className="input"
            disabled={readOnly}
          >
            <option value="">—</option>
            <option value="פעיל">פעיל</option>
            <option value="ממתין">ממתין</option>
            <option value="חדש">חדש</option>
            <option value="בבדיקה">בבדיקה</option>
          </select>
        </div>
        {/* Row 2: סוכן | פקיד שומה | מספר חוליה | סוג תיק במס הכנסה */}
        <div ref={agentInputRef} className="relative">
          <label className="label block mb-1">סוכן</label>
          {readOnly ? (
            <input
              type="text"
              value={agentInput || "—"}
              readOnly
              className="input"
              disabled
            />
          ) : (
            <>
              <input
                type="text"
                value={agentInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setAgentInput(val);
                  setShowSuggestions(true);
                  const trimmed = val.trim();
                  const match = trimmed
                    ? agents.find((a) => (a.name ?? "").toLowerCase() === trimmed.toLowerCase())
                    : null;
                  if (match) {
                    selectAgent(match);
                  } else {
                    setForm((f) => ({ ...f, agentId: "", cp: "", cp2: "" }));
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="הקלד לחיפוש..."
                className="input"
                autoComplete="off"
              />
              {showSuggestions && agentInput.trim() && (
                <ul
                  className="absolute top-full right-0 left-0 z-20 mt-1 max-h-48 overflow-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
                  dir="rtl"
                >
                  {filteredAgents.length === 0 ? (
                    <li className="px-4 py-2 text-sm text-ink-500">לא נמצאו תוצאות</li>
                  ) : (
                    filteredAgents.map((a) => (
                      <li
                        key={a.agentId}
                        role="button"
                        tabIndex={0}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectAgent(a);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectAgent(a);
                          }
                        }}
                        className="cursor-pointer px-4 py-2 text-right text-sm hover:bg-primary-50 hover:text-primary-800"
                      >
                        {a.name ?? "—"}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          )}
        </div>
        <div>
          <label className="label block mb-1">פקיד שומה</label>
          <select
            value={form.taxOffice}
            onChange={(e) =>
              setForm((f) => {
                const selectedName = e.target.value;
                const matchedClerk = clerks.find((c) => (c.name ?? "") === selectedName);
                return {
                  ...f,
                  taxOffice: selectedName,
                  clerkId: matchedClerk ? String(matchedClerk.clerkId) : "",
                };
              })
            }
            className="input"
            disabled={readOnly}
          >
            <option value="">—</option>
            {TAX_OFFICE_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label block mb-1">מספר חוליה</label>
          <input
            type="text"
            value={form.squad}
            onChange={(e) => setForm((f) => ({ ...f, squad: e.target.value }))}
            className="input"
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <div>
          <label className="label block mb-1">סוג תיק במס הכנסה</label>
          <input
            type="text"
            value={form.taxCaseType}
            onChange={(e) => setForm((f) => ({ ...f, taxCaseType: e.target.value }))}
            className="input"
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        {/* Row 3: רחוב | מספר בית | עיר */}
        <div className="sm:col-span-2">
          <label className="label block mb-1">רחוב</label>
          <input
            type="text"
            value={form.street}
            onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
            className="input"
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <div>
          <label className="label block mb-1">מספר בית</label>
          <input
            type="text"
            value={form.houseNumber}
            onChange={(e) => setForm((f) => ({ ...f, houseNumber: e.target.value }))}
            className="input"
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        <div>
          <label className="label block mb-1">עיר</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="input"
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
        {/* Row 4: עמלת פתיחת תיק | עמלת החזר */}
        <div className="sm:col-span-2">
          <label className="label block mb-1">עמלת פתיחת תיק</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={form.cp}
              onChange={(e) => setForm((f) => ({ ...f, cp: e.target.value }))}
              className="input w-full pr-8"
              readOnly={readOnly}
              disabled={readOnly}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600">₪</span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label block mb-1">עמלת החזר</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={form.cp2}
              onChange={(e) => setForm((f) => ({ ...f, cp2: e.target.value }))}
              className="input w-full pr-8"
              readOnly={readOnly}
              disabled={readOnly}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600">%</span>
          </div>
        </div>
        {/* Row 5: הערות (full width) */}
        <div className="sm:col-span-4">
          <label className="label block mb-1">הערות</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="input"
            readOnly={readOnly}
            disabled={readOnly}
          />
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

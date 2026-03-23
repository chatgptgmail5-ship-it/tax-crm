"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TemplateOption = { value: string; label: string };

type Props = {
  clientOptions: { householdId: number; label: string }[];
  templateOptions: TemplateOption[];
};

export function DocumentGeneratorForm({ clientOptions, templateOptions }: Props) {
  const router = useRouter();
  const [householdId, setHouseholdId] = useState<string>("");
  const [templateType, setTemplateType] = useState<string>(templateOptions[0]?.value ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId || !templateType) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/generated-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId: Number(householdId), templateType }),
      });
      if (res.ok) {
        router.push("/documents");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-6 max-w-xl">
      <div>
        <label className="label block mb-1">בחירת לקוח</label>
        <select
          value={householdId}
          onChange={(e) => setHouseholdId(e.target.value)}
          className="input w-full"
          required
          dir="rtl"
        >
          <option value="">— בחר לקוח —</option>
          {clientOptions.map((c) => (
            <option key={c.householdId} value={c.householdId}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label block mb-1">בחירת מסמך</label>
        <select
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value)}
          className="input w-full"
          dir="rtl"
        >
          {templateOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting ? "יוצר…" : "צור מסמך"}
      </button>
    </form>
  );
}

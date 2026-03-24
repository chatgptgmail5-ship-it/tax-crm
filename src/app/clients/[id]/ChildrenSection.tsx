"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye } from "lucide-react";
import { phoneDisplayValue, phoneInputValue } from "@/lib/utils";

type Child = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  childName: string | null;
  birthDay: Date | null;
  idNumber: string | null;
  gender: string | null;
  custodyOf: string | null;
  isDisabled: boolean | null;
  hasAdhd: boolean | null;
  phone: string | null;
  motherName: string | null;
  fatherName: string | null;
};

const toLocalDate = (d: Date | string | null) => {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
};

/** Age as years.months e.g. 11.8 = 11 years 8 months */
function ageFromBirthDay(birthDay: Date | string | null): string {
  if (!birthDay) return "—";
  const today = new Date();
  const bd = new Date(birthDay);
  let years = today.getFullYear() - bd.getFullYear();
  let months = today.getMonth() - bd.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < bd.getDate())) {
    years--;
    months += 12;
  }
  if (today.getDate() < bd.getDate()) months--;
  if (months < 0) months += 12;
  return `${years}.${months}`;
}

const GENDER_OPTIONS = ["זכר", "נקבה"] as const;

type Props = {
  householdId: number;
  children: Child[];
  readOnly?: boolean;
  fatherName?: string;
  motherName?: string;
};

export function ChildrenSection({ householdId, children, readOnly, fatherName = "", motherName = "" }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [newChild, setNewChild] = useState<Partial<Child> & { isNew?: boolean }>({});
  const [editForm, setEditForm] = useState<Partial<Child> | null>(null);

  function openAddForm() {
    setNewChild({ fatherName: fatherName || undefined, motherName: motherName || undefined });
    setEditing(-1);
  }

  function openViewForm(c: Child) {
    setEditForm({
      id: c.id,
      firstName: c.firstName ?? "",
      lastName: c.lastName ?? "",
      birthDay: (c.birthDay ? toLocalDate(c.birthDay) : "") as unknown as Date,
      idNumber: c.idNumber ?? "",
      gender: c.gender ?? "",
      custodyOf: c.custodyOf ?? "",
      isDisabled: c.isDisabled ?? false,
      hasAdhd: c.hasAdhd ?? false,
      phone: c.phone ?? "",
      motherName: c.motherName ?? "",
      fatherName: c.fatherName ?? "",
    });
    setEditing(c.id);
  }

  async function handleAdd() {
    setSaving(true);
    const res = await fetch(`/api/households/${householdId}/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: newChild.firstName ?? null,
        lastName: newChild.lastName ?? null,
        birthDay: newChild.birthDay || null,
        idNumber: newChild.idNumber ?? null,
        gender: newChild.gender ?? null,
        custodyOf: newChild.custodyOf ?? null,
        isDisabled: newChild.isDisabled ?? false,
        hasAdhd: newChild.hasAdhd ?? false,
        phone: newChild.phone ?? null,
        motherName: newChild.motherName ?? null,
        fatherName: newChild.fatherName ?? null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setNewChild({});
      setEditing(null);
      router.refresh();
    }
  }

  async function handleUpdate() {
    if (editing === null || typeof editing !== "number" || editing < 0 || !editForm) return;
    setSaving(true);
    const res = await fetch(`/api/children/${editing}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: editForm.firstName ?? null,
        lastName: editForm.lastName ?? null,
        birthDay: editForm.birthDay || null,
        idNumber: editForm.idNumber ?? null,
        gender: editForm.gender ?? null,
        custodyOf: editForm.custodyOf ?? null,
        isDisabled: editForm.isDisabled ?? false,
        hasAdhd: editForm.hasAdhd ?? false,
        phone: editForm.phone ?? null,
        motherName: editForm.motherName ?? null,
        fatherName: editForm.fatherName ?? null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditForm(null);
      setEditing(null);
      router.refresh();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק את הילד?")) return;
    const res = await fetch(`/api/children/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  const cols = [
    { key: "firstName" as const, label: "שם פרטי" },
    { key: "lastName" as const, label: "שם משפחה" },
    { key: "birthDay" as const, label: "תאריך לידה", type: "date" },
    { key: "age" as const, label: "גיל", readonly: true },
    { key: "gender" as const, label: "מגדר" },
    { key: "custodyOf" as const, label: "במשמורת של" },
    { key: "isDisabled" as const, label: "ילד נכה", type: "checkbox" },
    { key: "hasAdhd" as const, label: "קשב וריכוז", type: "checkbox" },
    { key: "idNumber" as const, label: "ת.ז." },
    { key: "phone" as const, label: "טלפון" },
    { key: "motherName" as const, label: "שם האם" },
    { key: "fatherName" as const, label: "שם האב" },
  ];

  return (
    <div className="card overflow-hidden">
          <div className="border-b border-ink-200 bg-primary-50/40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-semibold text-ink-900">ילדים</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => (editing === -1 ? setEditing(null) : openAddForm())}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            הוסף ילד
          </button>
        )}
      </div>

      {!readOnly && editing === -1 && (
        <div className="p-6 border-b border-ink-200 bg-primary-50/30">
          <h4 className="mb-4 font-medium text-ink-800">הוסף ילד חדש</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label block mb-1 text-xs">שם פרטי</label>
              <input
                value={newChild.firstName ?? ""}
                onChange={(e) => setNewChild((p) => ({ ...p, firstName: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">שם משפחה</label>
              <input
                value={newChild.lastName ?? ""}
                onChange={(e) => setNewChild((p) => ({ ...p, lastName: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">תאריך לידה</label>
              <input
                type="date"
                value={
                  typeof newChild.birthDay === "string"
                    ? newChild.birthDay
                    : newChild.birthDay
                      ? toLocalDate(newChild.birthDay)
                      : ""
                }
                onChange={(e) => setNewChild((p) => ({ ...p, birthDay: e.target.value as unknown as Date }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">מגדר</label>
              <select
                value={newChild.gender ?? ""}
                onChange={(e) => setNewChild((p) => ({ ...p, gender: e.target.value }))}
                className="input"
              >
                <option value="">—</option>
                {GENDER_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1 text-xs">במשמורת של</label>
              <input
                value={newChild.custodyOf ?? ""}
                onChange={(e) => setNewChild((p) => ({ ...p, custodyOf: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">ת.ז.</label>
              <input
                value={newChild.idNumber ?? ""}
                onChange={(e) => setNewChild((p) => ({ ...p, idNumber: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">טלפון</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneDisplayValue(newChild.phone ?? "")}
                onChange={(e) => setNewChild((p) => ({ ...p, phone: phoneInputValue(e.target.value) }))}
                className="input"
                maxLength={12}
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">שם האם</label>
              <input
                value={newChild.motherName ?? ""}
                onChange={(e) => setNewChild((p) => ({ ...p, motherName: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">שם האב</label>
              <input
                value={newChild.fatherName ?? ""}
                onChange={(e) => setNewChild((p) => ({ ...p, fatherName: e.target.value }))}
                className="input"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!newChild.isDisabled}
                  onChange={(e) => setNewChild((p) => ({ ...p, isDisabled: e.target.checked }))}
                />
                ילד נכה
              </label>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!newChild.hasAdhd}
                  onChange={(e) => setNewChild((p) => ({ ...p, hasAdhd: e.target.checked }))}
                />
                קשב וריכוז
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "שומר…" : "שמור ילד"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="btn btn-ghost"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {!readOnly && editForm && typeof editing === "number" && editing > 0 && (
        <div className="p-6 border-b border-ink-200 bg-primary-50/30">
          <h4 className="mb-4 font-medium text-ink-800">צפייה / עריכת ילד</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label block mb-1 text-xs">שם פרטי</label>
              <input
                value={editForm.firstName ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">שם משפחה</label>
              <input
                value={editForm.lastName ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">תאריך לידה</label>
              <input
                type="date"
                value={
                  typeof editForm.birthDay === "string"
                    ? editForm.birthDay
                    : editForm.birthDay
                      ? toLocalDate(editForm.birthDay)
                      : ""
                }
                onChange={(e) =>
                  setEditForm((p) => (p ? { ...p, birthDay: e.target.value as unknown as Date } : p))
                }
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">מגדר</label>
              <select
                value={editForm.gender ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
                className="input"
              >
                <option value="">—</option>
                {GENDER_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1 text-xs">במשמורת של</label>
              <input
                value={editForm.custodyOf ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, custodyOf: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">ת.ז.</label>
              <input
                value={editForm.idNumber ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, idNumber: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">טלפון</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneDisplayValue(editForm.phone ?? "")}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: phoneInputValue(e.target.value) }))}
                className="input"
                maxLength={12}
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">שם האם</label>
              <input
                value={editForm.motherName ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, motherName: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1 text-xs">שם האב</label>
              <input
                value={editForm.fatherName ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, fatherName: e.target.value }))}
                className="input"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!editForm.isDisabled}
                  onChange={(e) => setEditForm((p) => ({ ...p, isDisabled: e.target.checked }))}
                />
                ילד נכה
              </label>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!editForm.hasAdhd}
                  onChange={(e) => setEditForm((p) => ({ ...p, hasAdhd: e.target.checked }))}
                />
                קשב וריכוז
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={handleUpdate} disabled={saving} className="btn btn-primary">
              {saving ? "שומר…" : "שמור"}
            </button>
            <button type="button" onClick={() => { setEditForm(null); setEditing(null); }} className="btn btn-ghost">
              סגור
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right" dir="rtl">
          <thead>
              <tr className="border-b border-ink-200 bg-primary-50/40">
              {cols.map((c) => (
                <th key={c.key} className="px-3 py-2 font-semibold text-ink-900 whitespace-nowrap text-center">
                  {c.label}
                </th>
              ))}
              <th className="px-3 py-2 font-semibold text-ink-900 text-center">פעולה</th>
            </tr>
          </thead>
          <tbody>
            {children.length === 0 ? (
              <tr>
                <td colSpan={cols.length + (readOnly ? 0 : 1)} className="px-6 py-8 text-center text-ink-500">
                  אין ילדים — השתמש בכפתור &quot;הוסף ילד&quot; להוספה
                </td>
              </tr>
            ) : (
              children.map((c) => (
                <tr key={c.id} className="border-b border-ink-100 transition-colors hover:bg-primary-50/50">
                  {cols.map((col) => {
                    if (col.key === "age") {
                      return (
                        <td key={col.key} className="px-3 py-2 text-center">
                          {ageFromBirthDay(c.birthDay)}
                        </td>
                      );
                    }
                    if (col.type === "date") {
                      return (
                        <td key={col.key} className="px-3 py-2 text-center">
                          {c[col.key] ? toLocalDate(c[col.key] as Date) : "—"}
                        </td>
                      );
                    }
                    if (col.type === "checkbox") {
                      const boolVal = !!(c[col.key] as boolean);
                      return (
                        <td key={col.key} className="px-3 py-2 text-center">
                          {boolVal ? "כן" : "לא"}
                        </td>
                      );
                    }
                    const strVal = (c[col.key] as string) ?? "";
                    return (
                      <td key={col.key} className="px-3 py-2 text-center">
                        {col.key === "phone" ? (strVal ? phoneDisplayValue(strVal) : "—") : (strVal || "—")}
                      </td>
                    );
                  })}
                  {!readOnly && (
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openViewForm(c)}
                          className="btn btn-ghost btn-sm inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
                          title="צפה וערוך"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          צפה
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="מחק"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

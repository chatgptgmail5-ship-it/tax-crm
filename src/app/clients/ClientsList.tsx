"use client";

import { useState, useEffect, useTransition, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { useCanEdit } from "@/hooks/useCanEdit";
import { useQuestionnaireNotifications } from "@/contexts/QuestionnaireNotificationsContext";
import { cn } from "@/lib/utils";

type Household = {
  id: number;
  generalStatus: string | null;
  internalId: string | null;
  agent: { name: string | null } | null;
  persons: {
    id: number;
    role: string | null;
    firstName: string | null;
    lastName: string | null;
    idNumber: string | null;
    phone: string | null;
    email: string | null;
    flags: string | null;
  }[];
};

function getRegisteredPartnerName(h: Household): string {
  const primary = h.persons.find((p) => p.role === "husband" || !p.role) ?? h.persons[0];
  if (!primary) return "—";
  return `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() || "—";
}

function getRegisteredPartnerId(h: Household): string {
  const primary = h.persons.find((p) => p.role === "husband" || !p.role) ?? h.persons[0];
  return primary?.idNumber ?? "—";
}

function getSpouseName(h: Household): string {
  const spouse = h.persons.find((p) => p.role === "wife");
  if (!spouse) return "—";
  return `${spouse.firstName ?? ""} ${spouse.lastName ?? ""}`.trim() || "—";
}

function getSpouseId(h: Household): string {
  const spouse = h.persons.find((p) => p.role === "wife");
  return spouse?.idNumber ?? "—";
}

function getMaritalStatus(h: Household): string {
  const primary = h.persons.find((p) => p.role === "husband" || !p.role) ?? h.persons[0];
  if (!primary?.flags) return "—";
  try {
    const parsed = JSON.parse(primary.flags) as { maritalStatus?: string };
    return parsed?.maritalStatus ?? "—";
  } catch {
    return "—";
  }
}

function getPhone(h: Household): string {
  for (const p of h.persons) {
    if (p.phone) return p.phone;
  }
  return "—";
}

/** Raw phone for WhatsApp (same row as טלפון column). */
function getPhoneRaw(h: Household): string | null {
  for (const p of h.persons) {
    if (p.phone && p.phone.trim()) return p.phone.trim();
  }
  return null;
}

/**
 * Normalize Israeli mobile for https://wa.me/<num>
 * - strip non-digits; leading 0 → 972…; else require 972 prefix
 */
function normalizeIsraeliPhoneForWa(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  let n = digits;
  if (n.startsWith("0")) {
    n = "972" + n.slice(1);
  } else if (!n.startsWith("972")) {
    if (n.length === 9) n = "972" + n;
    else return null;
  }
  if (n.length < 11 || n.length > 12) return null;
  return n;
}

function WhatsAppIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={props.className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Case-insensitive partial match across displayed + related fields (frontend only). */
function householdMatchesSearch(h: Household, queryRaw: string): boolean {
  const query = queryRaw.trim().toLowerCase();
  if (!query) return true;

  const chunks: string[] = [
    getRegisteredPartnerName(h),
    getRegisteredPartnerId(h),
    getSpouseName(h),
    getSpouseId(h),
    getMaritalStatus(h),
    getPhone(h),
    h.agent?.name ?? "",
    h.generalStatus ?? "",
    h.internalId ?? "",
  ];
  for (const p of h.persons) {
    chunks.push(
      p.firstName ?? "",
      p.lastName ?? "",
      p.idNumber ?? "",
      p.phone ?? "",
      p.email ?? ""
    );
  }
  const haystack = chunks.join(" ").toLowerCase();
  if (haystack.includes(query)) return true;
  const digitsNeedle = query.replace(/\D/g, "");
  if (digitsNeedle.length > 0) {
    const digitHay = chunks.join(" ").replace(/\D/g, "");
    if (digitHay.includes(digitsNeedle)) return true;
  }
  return false;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-ink-500">—</span>;
  const colorMap: Record<string, string> = {
    פעיל: "bg-emerald-100 text-emerald-700",
    בטיפול: "bg-amber-100 text-amber-700",
    "ממתין למסמכים": "bg-orange-100 text-orange-700",
    סגור: "bg-red-100 text-red-700",
    ממתין: "bg-amber-100 text-amber-700",
    חדש: "bg-slate-100 text-slate-700",
    "בבדיקה": "bg-blue-100 text-blue-700",
  };
  const cls = colorMap[status] ?? "bg-ink-100 text-ink-600";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
  );
}

export function ClientsList() {
  const { unreadHouseholdIds } = useQuestionnaireNotifications();
  const unreadSet = useMemo(() => new Set(unreadHouseholdIds), [unreadHouseholdIds]);
  const canEdit = useCanEdit();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingClientId, setPendingClientId] = useState<number | null>(null);
  const [allHouseholds, setAllHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notificationsOnly, setNotificationsOnly] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  // Bulk selection UI only (no action execution yet).
  type BulkAction = "export" | "whatsapp" | "delete";
  const [actionChooserOpen, setActionChooserOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkAction>("export");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const selectedSet = useMemo(() => new Set(selectedClientIds), [selectedClientIds]);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappRecipientsSnapshot, setWhatsappRecipientsSnapshot] = useState<number[] | null>(null);
  /** Set synchronously when bulk WhatsApp is confirmed; survives empty `selectedClientIds` and avoids stale snapshot closure. */
  const waBulkRecipientIdsRef = useRef<number[] | null>(null);
  const waFlowMessageRef = useRef("");
  const [waFlowOpen, setWaFlowOpen] = useState(false);
  const [waFlowIndex, setWaFlowIndex] = useState(0);
  const [waCurrentMessage, setWaCurrentMessage] = useState("");
  const [waQueue, setWaQueue] = useState<{ id: number; name: string; wa: string }[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulkActionOpen, setConfirmBulkActionOpen] = useState(false);

  function toggleSelectedClient(id: number) {
    setSelectedClientIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const url = showRecycleBin ? "/api/households?deleted=1" : "/api/households";
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled) setAllHouseholds(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setAllHouseholds([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showRecycleBin]);

  const filteredHouseholds = useMemo(() => {
    let list = allHouseholds;
    if (!showRecycleBin && notificationsOnly) {
      list = list.filter((h) => unreadSet.has(h.id));
    }
    return list.filter((h) => householdMatchesSearch(h, search));
  }, [allHouseholds, notificationsOnly, search, unreadSet, showRecycleBin]);

  function goToClient(id: number) {
    setPendingClientId(id);
    startTransition(() => {
      router.push(`/clients/${id}`);
    });
  }

  function exportSelectedHouseholds() {
    // Use the existing single export system; trigger downloads for selected households.
    for (const id of selectedClientIds) {
      window.open(`/api/export/single?householdId=${id}`, "_blank");
    }
  }

  function getWaNumberForHousehold(h: Household): string | null {
    const raw = getPhoneRaw(h);
    return raw ? normalizeIsraeliPhoneForWa(raw) : null;
  }

  function openWhatsAppForWaNumber(waNumber: string, message: string) {
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  function startWhatsAppSequentialFlow(message: string) {
    const trimmed = message.trim();
    if (!trimmed) {
      alert("נא להזין הודעה");
      return;
    }

    const recipientIds =
      waBulkRecipientIdsRef.current ?? whatsappRecipientsSnapshot ?? selectedClientIds;
    if (recipientIds.length === 0) {
      alert("לא נמצאו לקוחות לשליחה.");
      return;
    }

    const queue = recipientIds
      .map((id) => {
        const h = allHouseholds.find((x) => x.id === id);
        if (!h) return null;
        const wa = getWaNumberForHousehold(h);
        if (!wa) return null;
        return { id, name: getRegisteredPartnerName(h), wa };
      })
      .filter((x): x is { id: number; name: string; wa: string } => x != null);

    if (queue.length === 0) {
      alert("לא נמצאו מספרי טלפון תקינים עבור הבחירה.");
      return;
    }

    waBulkRecipientIdsRef.current = null;
    waFlowMessageRef.current = trimmed;
    setWaCurrentMessage(trimmed);
    setWaQueue(queue);
    setWaFlowIndex(0);
    setWaFlowOpen(true);
    openWhatsAppForWaNumber(queue[0].wa, trimmed);
  }

  function closeWhatsAppBulkFlow() {
    waFlowMessageRef.current = "";
    waBulkRecipientIdsRef.current = null;
    setWaFlowOpen(false);
    setWaQueue([]);
    setWaFlowIndex(0);
    setWaCurrentMessage("");
  }

  async function moveSelectedToRecycleBin() {
    const ids = [...selectedClientIds];
    if (ids.length === 0) return;

    const succeeded = new Set<number>();
    for (const id of ids) {
      const res = await fetch(`/api/households/${id}`, { method: "DELETE" });
      if (res.ok) {
        succeeded.add(id);
      }
    }

    setAllHouseholds((prev) => prev.filter((h) => !succeeded.has(h.id)));

    if (succeeded.size !== ids.length) {
      alert("חלק מהלקוחות לא הועברו לסל מחזור.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש: שם, ת.ז., בן/בת זוג, מצב משפחתי, טלפון, סוכן, שלב תיק..."
          className="input pr-9"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setNotificationsOnly((v) => !v)}
          className="btn btn-secondary text-sm"
          aria-pressed={notificationsOnly}
        >
          {notificationsOnly ? "רגיל" : "התראות"}
        </button>

        <button
          type="button"
          className="btn btn-secondary text-sm"
          aria-pressed={showRecycleBin}
          disabled={selectionMode}
          onClick={() => {
            setShowRecycleBin((v) => !v);
            setNotificationsOnly(false);
            setActionChooserOpen(false);
            setSelectionMode(false);
            setSelectedClientIds([]);
          }}
        >
          סל מחזור
        </button>

        {!showRecycleBin && !selectionMode ? (
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => setActionChooserOpen(true)}
          >
            בחירה
          </button>
        ) : null}

        {!showRecycleBin && selectionMode ? (
          <button
            type="button"
            className="btn btn-secondary text-sm"
            disabled={bulkBusy}
            onClick={async () => {
                      if (selectedClientIds.length === 0) {
                        // Exit selection mode immediately when nothing is selected.
                        setSelectionMode(false);
                        setSelectedClientIds([]);
                        return;
                      }
                      setConfirmBulkActionOpen(true);
            }}
          >
            סיים
          </button>
        ) : null}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-ink-200 bg-primary-50/40">
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 font-medium text-ink-700 border-b border-ink-200 text-center">בן/בת הזוג הרשום</th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 font-medium text-ink-700 border-b border-ink-200 text-center">ת.ז.</th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 font-medium text-ink-700 border-b border-ink-200 text-center">בן/בת הזוג</th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 font-medium text-ink-700 border-b border-ink-200 text-center">ת.ז.</th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 font-medium text-ink-700 border-b border-ink-200 text-center">מצב משפחתי</th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 font-medium text-ink-700 border-b border-ink-200 text-center">טלפון</th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 font-medium text-ink-700 border-b border-ink-200 text-center">סוכן</th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 font-medium text-ink-700 border-b border-ink-200 text-center">שלב התיק</th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 border-b border-ink-200 text-center">ייצוא</th>
                <th
                  className="sticky top-0 z-10 bg-primary-50/40 px-3 py-4 border-b border-ink-200 text-center"
                  title="WhatsApp"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon className="mx-auto h-5 w-5 text-[#25D366]" />
                </th>
                <th className="sticky top-0 z-10 bg-primary-50/40 px-6 py-4 border-b border-ink-200 text-center">פעולה</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-ink-500">
                    טוען...
                  </td>
                </tr>
              ) : filteredHouseholds.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-ink-500">
                    {allHouseholds.length === 0 ? (
                      <>
                        לא נמצאו לקוחות.{" "}
                        {canEdit && (
                          <Link href="/clients/new" className="text-primary-600 hover:underline">
                            הוסף לקוח
                          </Link>
                        )}
                      </>
                    ) : (
                      "לא נמצאו תוצאות."
                    )}
                  </td>
                </tr>
              ) : (
                filteredHouseholds.map((h) => (
                  <tr
                    key={h.id}
                    className={cn(
                      "cursor-pointer border-b border-ink-100 transition-colors hover:bg-primary-50/50",
                      pendingClientId === h.id && "bg-primary-50/70"
                    )}
                    onClick={(e) => {
                      if (showRecycleBin) return;
                      if (selectionMode) return;
                      if ((e.target as HTMLElement).closest("a[href], button")) return;
                      goToClient(h.id);
                    }}
                  >
                    <td className="px-6 py-4 text-center">
                      {selectionMode ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={selectedSet.has(h.id)}
                            aria-label={`בחר לקוח: ${getRegisteredPartnerName(h)}`}
                            className={cn(
                              "h-[22px] w-[22px] rounded border transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer",
                              selectedSet.has(h.id)
                                ? "bg-blue-600 border-blue-600"
                                : "bg-white border-ink-300"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSelectedClient(h.id);
                            }}
                          >
                            {selectedSet.has(h.id) ? <Check className="h-3.5 w-3.5 text-gray-200" /> : null}
                          </button>

                          <span className="inline-flex items-center justify-center gap-1.5">
                            {unreadSet.has(h.id) ? (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-amber-400"
                                title="שאלון חדש"
                                aria-hidden
                              />
                            ) : null}
                            <span className="font-medium text-primary-700">{getRegisteredPartnerName(h)}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5">
                          {unreadSet.has(h.id) ? (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-amber-400"
                              title="שאלון חדש"
                              aria-hidden
                            />
                          ) : null}
                          {showRecycleBin ? (
                            <span className="font-medium text-ink-500">{getRegisteredPartnerName(h)}</span>
                          ) : (
                            <Link
                              href={`/clients/${h.id}`}
                              prefetch
                              onClick={() => setPendingClientId(h.id)}
                              className="font-medium text-primary-700 hover:text-primary-600 hover:underline"
                            >
                              {getRegisteredPartnerName(h)}
                            </Link>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ink-600 text-center">{getRegisteredPartnerId(h)}</td>
                    <td className="px-6 py-4 text-ink-600 text-center">{getSpouseName(h)}</td>
                    <td className="px-6 py-4 text-ink-600 text-center">{getSpouseId(h)}</td>
                    <td className="px-6 py-4 text-ink-600 text-center">{getMaritalStatus(h)}</td>
                    <td className="px-6 py-4 text-ink-600 text-center">{getPhone(h)}</td>
                    <td className="px-6 py-4 text-ink-600 text-center">{h.agent?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={h.generalStatus} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`/api/export/single?householdId=${h.id}`}
                        className="text-primary-600 hover:underline"
                        download
                      >
                        ייצא
                      </a>
                    </td>
                    <td className="px-3 py-4 text-center align-middle">
                      {(() => {
                        const raw = getPhoneRaw(h);
                        const wa = raw ? normalizeIsraeliPhoneForWa(raw) : null;
                        if (!wa) {
                          return (
                            <span className="inline-flex items-center justify-center text-ink-300" aria-hidden title="אין מספר טלפון">
                              <WhatsAppIcon className="h-5 w-5" />
                            </span>
                          );
                        }
                        return (
                          <a
                            href={`https://wa.me/${wa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center text-[#25D366] hover:opacity-90"
                            title="WhatsApp"
                            aria-label={`פתח WhatsApp ל-${getPhone(h)}`}
                          >
                            <WhatsAppIcon className="h-5 w-5" />
                          </a>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {showRecycleBin ? (
                        <span className="text-ink-300" aria-disabled>
                          צפה
                        </span>
                      ) : (
                        <Link
                          href={`/clients/${h.id}`}
                          prefetch
                          onClick={() => setPendingClientId(h.id)}
                          className="text-primary-600 hover:underline"
                        >
                          צפה
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {actionChooserOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="card p-6 max-w-md w-full shadow-lg space-y-4">
            <p className="text-sm text-ink-800">מהי הפעולה?</p>

            <div className="flex flex-col gap-2">
              {(
                [
                  { key: "export" as const, label: "ייצוא" },
                  { key: "whatsapp" as const, label: "וואטסאפ" },
                  { key: "delete" as const, label: "מחיקה" },
                ] as const
              ).map((opt) => {
                const active = pendingBulkAction === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={cn(
                      "btn text-sm justify-start",
                      active ? "btn-primary" : "btn-ghost"
                    )}
                    onClick={() => setPendingBulkAction(opt.key)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setActionChooserOpen(false);
                }}
              >
                בטל
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setActionChooserOpen(false);
                  setSelectionMode(true);
                  setSelectedClientIds([]);
                }}
              >
                בחר
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmBulkActionOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="card p-6 max-w-md w-full shadow-lg space-y-4">
            <p className="text-sm text-ink-800">האם לבצע את הפעולה שנבחרה?</p>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={bulkBusy}
                onClick={() => {
                  setConfirmBulkActionOpen(false);
                  waBulkRecipientIdsRef.current = null;
                  setWhatsappRecipientsSnapshot(null);
                  setSelectionMode(false);
                  setSelectedClientIds([]);
                }}
              >
                לא
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={bulkBusy}
                onClick={async () => {
                  setConfirmBulkActionOpen(false);
                  const idsSnapshot = [...selectedClientIds];
                  setBulkBusy(true);
                  try {
                    if (pendingBulkAction === "export") {
                      for (const id of idsSnapshot) {
                        window.open(`/api/export/single?householdId=${id}`, "_blank");
                      }
                    } else if (pendingBulkAction === "whatsapp") {
                      waBulkRecipientIdsRef.current = idsSnapshot;
                      setWhatsappRecipientsSnapshot(idsSnapshot);
                      setWhatsappMessage("");
                      setWhatsappModalOpen(true);
                    } else if (pendingBulkAction === "delete") {
                      // Uses selectedClientIds internally; keep them until after delete call.
                      await moveSelectedToRecycleBin();
                    }
                  } finally {
                    setBulkBusy(false);
                  }

                  setSelectionMode(false);
                  setSelectedClientIds([]);

                  // For WhatsApp: snapshot must remain until user presses שלח/בטל.
                  if (pendingBulkAction !== "whatsapp") {
                    waBulkRecipientIdsRef.current = null;
                    setWhatsappRecipientsSnapshot(null);
                  }
                }}
              >
                כן
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {whatsappModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="card p-6 max-w-md w-full shadow-lg space-y-4">
            <p className="text-sm text-ink-800">מהי ההודעה?</p>
            <textarea
              className="input min-h-[6rem] w-full resize-y py-2"
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder="כתוב הודעה…"
              dir="rtl"
            />
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setWhatsappModalOpen(false);
                  waBulkRecipientIdsRef.current = null;
                  setWhatsappRecipientsSnapshot(null);
                }}
              >
                בטל
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={bulkBusy}
                onClick={() => {
                  const msg = whatsappMessage.trim();
                  setWhatsappModalOpen(false);
                  setWhatsappMessage("");
                  setWhatsappRecipientsSnapshot(null);
                  startWhatsAppSequentialFlow(msg);
                }}
              >
                שלח
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {waFlowOpen ? (
        <div className="fixed bottom-4 right-4 z-[120]" dir="rtl">
          <div className="card p-4 shadow-lg">
            {(() => {
              const current = waQueue[waFlowIndex];
              const total = waQueue.length;
              return (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-ink-500">לקוח נוכחי</div>
                      <div className="truncate text-sm font-medium text-ink-800">{current?.name ?? "—"}</div>
                    </div>
                    <div className="shrink-0 text-xs text-ink-500 tabular-nums">
                      {total === 0 ? "0/0" : `${waFlowIndex + 1}/${total}`}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary text-sm"
                      disabled={waFlowIndex >= waQueue.length - 1}
                      onClick={() => {
                        const nextIndex = waFlowIndex + 1;
                        if (nextIndex >= waQueue.length) {
                          closeWhatsAppBulkFlow();
                          return;
                        }
                        setWaFlowIndex(nextIndex);
                        const next = waQueue[nextIndex];
                        if (next) openWhatsAppForWaNumber(next.wa, waFlowMessageRef.current);
                      }}
                    >
                      הבא
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost text-sm"
                      onClick={() => {
                        closeWhatsAppBulkFlow();
                      }}
                    >
                      סיום
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}

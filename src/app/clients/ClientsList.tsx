"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useCanEdit } from "@/hooks/useCanEdit";
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
  const canEdit = useCanEdit();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingClientId, setPendingClientId] = useState<number | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = search.trim();
    const delayMs = q ? 300 : 0;
    const ac = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const url = q ? `/api/households?q=${encodeURIComponent(q)}` : "/api/households";
        const res = await fetch(url, { signal: ac.signal });
        const data = await res.json();
        if (!ac.signal.aborted) {
          setHouseholds(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError" || ac.signal.aborted) return;
        setHouseholds([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, delayMs);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [search]);

  function goToClient(id: number) {
    setPendingClientId(id);
    startTransition(() => {
      router.push(`/clients/${id}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לקוח..."
          className="input pr-9"
          autoComplete="off"
        />
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
              ) : households.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-ink-500">
                    לא נמצאו לקוחות.{" "}
                    {canEdit && (
                      <Link href="/clients/new" className="text-primary-600 hover:underline">
                        הוסף לקוח
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                households.map((h) => (
                  <tr
                    key={h.id}
                    className={cn(
                      "cursor-pointer border-b border-ink-100 transition-colors hover:bg-primary-50/50",
                      pendingClientId === h.id && "bg-primary-50/70"
                    )}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a[href], button")) return;
                      goToClient(h.id);
                    }}
                  >
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/clients/${h.id}`}
                        prefetch
                        onClick={() => setPendingClientId(h.id)}
                        className="font-medium text-primary-700 hover:text-primary-600 hover:underline"
                      >
                        {getRegisteredPartnerName(h)}
                      </Link>
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
                      <Link
                        href={`/clients/${h.id}`}
                        prefetch
                        onClick={() => setPendingClientId(h.id)}
                        className="text-primary-600 hover:underline"
                      >
                        צפה
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

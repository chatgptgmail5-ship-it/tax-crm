"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Trash2 } from "lucide-react";
import { CanEditGate } from "@/components/CanEditGate";
import { InlineSpinner } from "@/components/InlineSpinner";
import { formatDate, formatCurrency } from "@/lib/utils";

type RefundRow = {
  refundId: number;
  clientId: number;
  yearId: number;
  dateSubmission: Date | string | null;
  amountRefund: number | null;
  dateRefund: Date | string | null;
  paymentStatus: boolean | null;
  status?: {
    statusName: string | null;
  } | null;
  client: {
    clientName: string | null;
    lastName: string | null;
    cp2: number | null;
  };
};

type Props = {
  refunds: RefundRow[];
  commissionByClientId?: Record<number, number | null>;
};

/** שכ"ט = סכום ההחזר × עמלת ההחזר (commission % from מידע ראשי) */
function formatFee(amount: number | null, commissionPercent: number | null | undefined): number | null {
  if (amount == null || commissionPercent == null || commissionPercent === undefined) return null;
  return (amount * commissionPercent) / 100;
}

export function RefundsTable({ refunds, commissionByClientId = {} }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<number, boolean | null>>({});

  function getStatus(r: RefundRow): boolean | null {
    if (r.refundId in localStatus) return localStatus[r.refundId];
    return r.paymentStatus ?? null;
  }

  function handlePaidClick(r: RefundRow) {
    const current = getStatus(r);
    const next = current === true ? null : true;
    setLocalStatus((prev) => ({ ...prev, [r.refundId]: next }));
    setUpdating(r.refundId);
    fetch(`/api/refunds/${r.refundId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    })
      .then((res) => {
        if (res.ok) {
          setLocalStatus((prev) => {
            const nextState = { ...prev };
            delete nextState[r.refundId];
            return nextState;
          });
          router.refresh();
        } else {
          setLocalStatus((prev) => ({ ...prev, [r.refundId]: current }));
        }
      })
      .catch(() => setLocalStatus((prev) => ({ ...prev, [r.refundId]: current })))
      .finally(() => setUpdating(null));
  }

  function handleUnpaidClick(r: RefundRow) {
    const current = getStatus(r);
    const next = current === false ? null : false;
    setLocalStatus((prev) => ({ ...prev, [r.refundId]: next }));
    setUpdating(r.refundId);
    fetch(`/api/refunds/${r.refundId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    })
      .then((res) => {
        if (res.ok) {
          setLocalStatus((prev) => {
            const nextState = { ...prev };
            delete nextState[r.refundId];
            return nextState;
          });
          router.refresh();
        } else {
          setLocalStatus((prev) => ({ ...prev, [r.refundId]: current }));
        }
      })
      .catch(() => setLocalStatus((prev) => ({ ...prev, [r.refundId]: current })))
      .finally(() => setUpdating(null));
  }

  async function handleDeleteRefund(refundId: number) {
    if (!confirm("האם למחוק את ההחזר הזה?")) return;
    setDeleting(refundId);
    try {
      const res = await fetch(`/api/refunds/${refundId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="border-b border-ink-200 bg-primary-50/40">
            <th className="px-6 py-4 font-medium text-ink-700 text-center">לקוח</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">שנה</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">סכום ההחזר</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">סטטוס</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">ת. הגשה</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">ת. קבלת ההחזר</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">שולם / לא שולם</th>
            <th className="px-6 py-4 font-medium text-ink-700 text-center">שכ&quot;ט</th>
            <th className="px-6 py-4 text-center">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {refunds.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-12 text-center text-ink-500">
                אין עדיין החזרים.{" "}
                <CanEditGate>
                  <Link href="/refunds/new" className="text-primary-600 hover:underline">
                    הוסף
                  </Link>
                </CanEditGate>
              </td>
            </tr>
          ) : (
            refunds.map((r) => {
              const status = getStatus(r);
              const commissionPercent = commissionByClientId[r.clientId] ?? r.client?.cp2 ?? null;
              const fee = formatFee(r.amountRefund ?? null, commissionPercent);
              const isUpdating = updating === r.refundId;
              return (
                <tr key={r.refundId} className="border-b border-ink-100 transition-colors hover:bg-primary-50/50">
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/clients/${r.clientId}`}
                      prefetch
                      className="font-medium text-primary-700 hover:text-primary-600 hover:underline"
                    >
                      {r.client?.clientName} {r.client?.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-ink-600 text-center">{r.yearId}</td>
                  <td className="px-6 py-4 font-medium text-center">
                    {r.amountRefund != null ? formatCurrency(r.amountRefund) : "—"}
                  </td>
                  <td className="px-6 py-4 text-ink-600 text-center">{r.status?.statusName ?? "—"}</td>
                  <td className="px-6 py-4 text-ink-500 text-center">{formatDate(r.dateSubmission)}</td>
                  <td className="px-6 py-4 text-ink-500 text-center">{formatDate(r.dateRefund)}</td>
                  <td className="px-6 py-4 text-center">
                    <CanEditGate>
                      <span className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handlePaidClick(r)}
                          disabled={isUpdating}
                          title="שולם"
                          className={`
                            inline-flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors
                            ${status === true ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink-300 bg-ink-100/80 text-ink-400"}
                            hover:enabled:opacity-90 disabled:opacity-50
                          `}
                        >
                          {isUpdating ? <InlineSpinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnpaidClick(r)}
                          disabled={isUpdating}
                          title="לא שולם"
                          className={`
                            inline-flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors
                            ${status === false ? "border-red-500 bg-red-500 text-white" : "border-ink-300 bg-ink-100/80 text-ink-400"}
                            hover:enabled:opacity-90 disabled:opacity-50
                          `}
                        >
                          {isUpdating ? <InlineSpinner className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </button>
                      </span>
                    </CanEditGate>
                  </td>
                  <td className="px-6 py-4 text-center tabular-nums">
                    {fee != null ? formatCurrency(fee) : "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-2">
                      <Link href={`/refunds/${r.refundId}`} className="text-primary-600 hover:underline">
                        צפה
                      </Link>
                      <CanEditGate>
                        <button
                          type="button"
                          onClick={() => handleDeleteRefund(r.refundId)}
                          disabled={deleting === r.refundId}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="מחק"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </CanEditGate>
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

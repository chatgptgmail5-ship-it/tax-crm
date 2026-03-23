import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RefundForm } from "@/components/RefundForm";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RefundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const refundId = parseInt(id, 10);
  if (isNaN(refundId)) notFound();

  const refund = await prisma.tblRefund.findUnique({
    where: { refundId },
    include: {
      client: true,
      status: true,
      refundSubs: { include: { process: true } },
    },
  });

  if (!refund) notFound();

  const clients = await prisma.tblClient.findMany({ orderBy: { clientName: "asc" } });

  return (
    <div className="space-y-6">
      <Link href="/refunds" className="btn btn-ghost inline-flex">
        <ArrowLeft className="h-4 w-4 rotate-180" />
        חזרה
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RefundForm
            refund={refund}
            clients={clients}
            defaultYear={refund.yearId}
            defaultClientId={refund.clientId}
          />
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 font-semibold text-ink-900">שלבי תהליך</h3>
            {refund.refundSubs.length === 0 ? (
              <p className="text-sm text-ink-500">אין עדיין שלבים</p>
            ) : (
              <ul className="space-y-2">
                {refund.refundSubs.map((rs) => (
                  <li key={rs.recId} className="flex items-center justify-between text-sm">
                    <span>{rs.process.processName}</span>
                    <span className={rs.isValid ? "text-emerald-600" : "text-ink-400"}>
                      {rs.isValid ? "בוצע" : "ממתין"}
                    </span>
                    {rs.dateToDo && (
                      <span className="text-ink-500">{formatDate(rs.dateToDo)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

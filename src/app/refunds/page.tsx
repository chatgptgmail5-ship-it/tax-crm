import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CanEditGate } from "@/components/CanEditGate";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { RefundsTable } from "./RefundsTable";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  const refunds = await prisma.tblRefund.findMany({
    orderBy: { dateCreated: "desc" },
    include: {
      client: { select: { clientId: true, clientName: true, lastName: true, cp2: true } },
      status: { select: { statusName: true } },
    },
  });
  const clientIds = [...new Set(refunds.map((r) => r.clientId))];
  const households = await prisma.household.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, cp2: true },
  });
  const commissionByClientId: Record<number, number | null> = {};
  for (const h of households) {
    commissionByClientId[h.id] = h.cp2;
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">החזרים</h1>
          <p className="text-ink-600">רישומי החזרי מס</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton type="refunds" />
          <CanEditGate>
            <Link href="/refunds/new" prefetch className="btn btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              הוסף החזר
            </Link>
          </CanEditGate>
        </div>
      </div>

      <div className="card overflow-hidden">
        <RefundsTable refunds={refunds} commissionByClientId={commissionByClientId} />
      </div>
    </div>
  );
}

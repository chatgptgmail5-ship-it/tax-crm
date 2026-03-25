"use client";

import { useState } from "react";
import { ClientsList } from "./ClientsList";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CanEditGate } from "@/components/CanEditGate";
import { ExportExcelButton } from "@/components/ExportExcelButton";

export default function ClientsPage() {
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [clientCounts, setClientCounts] = useState({ normal: 0, deleted: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">לקוחות</h1>
          <p className="text-ink-600">רשימת משקי בית — יועץ מס</p>
        </div>
        <div className="flex flex-wrap items-center gap-2" dir="ltr">
          <CanEditGate>
            <button
              type="button"
              className="btn btn-primary flex items-center gap-2"
              onClick={() => setShowRecycleBin((v) => !v)}
            >
              {showRecycleBin ? `רגיל (${clientCounts.normal})` : `סל מחזור (${clientCounts.deleted})`}
            </button>
          </CanEditGate>
          <ExportExcelButton type="all" />
          <CanEditGate>
            <Link href="/clients/new" prefetch className="btn btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              הוסף לקוח
            </Link>
          </CanEditGate>
        </div>
      </div>

      <ClientsList showRecycleBin={showRecycleBin} onClientCountsChange={setClientCounts} />
    </div>
  );
}

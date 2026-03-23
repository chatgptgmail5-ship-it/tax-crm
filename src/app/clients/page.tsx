import { ClientsList } from "./ClientsList";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CanEditGate } from "@/components/CanEditGate";
import { ExportExcelButton } from "@/components/ExportExcelButton";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">לקוחות</h1>
          <p className="text-ink-600">רשימת משקי בית — יועץ מס</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton type="all" />
          <CanEditGate>
            <Link href="/clients/new" className="btn btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              הוסף לקוח
            </Link>
          </CanEditGate>
        </div>
      </div>

      <ClientsList />
    </div>
  );
}

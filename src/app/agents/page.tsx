import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CanEditGate } from "@/components/CanEditGate";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { formatCurrency } from "@/lib/utils";
import { AgentDeleteButton } from "./AgentDeleteButton";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await prisma.tblAgent.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { clients: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">סוכנים</h1>
          <p className="text-ink-600">שותפים להפניה ושיעורי עמלה</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton type="agents" />
          <CanEditGate>
            <Link href="/agents/new" className="btn btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              הוסף סוכן
            </Link>
          </CanEditGate>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-primary-50/40">
                <th className="px-6 py-4 font-medium text-ink-700 text-center">שם</th>
                <th className="px-6 py-4 font-medium text-ink-700 text-center">איש קשר</th>
                <th className="px-6 py-4 font-medium text-ink-700 text-center">עמלת פתיחת תיק</th>
                <th className="px-6 py-4 font-medium text-ink-700 text-center">עמלת החזר</th>
                <th className="px-6 py-4 font-medium text-ink-700 text-center">לקוחות</th>
                <th className="px-6 py-4 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-500">
                    אין עדיין סוכנים.{" "}
                    <CanEditGate>
                      <Link href="/agents/new" className="text-primary-600 hover:underline">הוסף</Link>
                    </CanEditGate>
                  </td>
                </tr>
              ) : (
                agents.map((a) => (
                  <tr key={a.agentId} className="border-b border-ink-100 transition-colors hover:bg-primary-50/50">
                    <td className="px-6 py-4 font-medium text-ink-900 text-center">{a.name ?? "—"}</td>
                    <td className="px-6 py-4 text-ink-600 text-center">{a.mobile ?? a.email ?? "—"}</td>
                    <td className="px-6 py-4 text-ink-600 tabular-nums text-center">
                      {a.cp != null ? formatCurrency(a.cp) : "—"}
                    </td>
                    <td className="px-6 py-4 text-ink-600 tabular-nums text-center">
                      {a.cp2 != null ? `${a.cp2}%` : "—"}
                    </td>
                    <td className="px-6 py-4 text-ink-600 text-center">{a._count.clients}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-2">
                        <CanEditGate>
                          <Link href={`/agents/${a.agentId}`} className="text-primary-600 hover:underline">
                            ערוך
                          </Link>
                          <AgentDeleteButton agentId={a.agentId} />
                        </CanEditGate>
                      </span>
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

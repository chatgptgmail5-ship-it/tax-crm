import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CanEditGate } from "@/components/CanEditGate";
import { ExportExcelButton } from "@/components/ExportExcelButton";

export const dynamic = "force-dynamic";

export default async function ClerksPage() {
  const clerks = await prisma.tblClerk.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { clients: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">פקידים</h1>
          <p className="text-ink-600">חברי צוות</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton type="clerks" />
          <CanEditGate>
            <Link href="/clerks/new" className="btn btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              הוסף פקיד
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
                <th className="px-6 py-4 font-medium text-ink-700 text-center">לקוחות</th>
                <th className="px-6 py-4 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {clerks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-ink-500">
                    אין עדיין פקידים.{" "}
                    <CanEditGate>
                      <Link href="/clerks/new" className="text-primary-600 hover:underline">הוסף</Link>
                    </CanEditGate>
                  </td>
                </tr>
              ) : (
                clerks.map((c) => (
                  <tr key={c.clerkId} className="border-b border-ink-100 transition-colors hover:bg-primary-50/50">
                    <td className="px-6 py-4 font-medium text-ink-900 text-center">{c.name ?? "—"}</td>
                    <td className="px-6 py-4 text-ink-600 text-center">{c.mobile ?? c.email ?? "—"}</td>
                    <td className="px-6 py-4 text-ink-600 text-center">{c._count.clients}</td>
                    <td className="px-6 py-4 text-center">
                      <CanEditGate>
                        <Link href={`/clerks/${c.clerkId}`} className="text-primary-600 hover:underline">ערוך</Link>
                      </CanEditGate>
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

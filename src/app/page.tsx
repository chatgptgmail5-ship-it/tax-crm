import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Receipt, UserCog, UserCheck, ArrowRight } from "lucide-react";
import { formatDateTime, formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getHouseholdDisplayName(h: {
  persons: { role: string | null; firstName: string | null; lastName: string | null }[];
}) {
  const primary = h.persons.find((p) => p.role === "husband" || !p.role) ?? h.persons[0];
  const spouse = h.persons.find((p) => p.role === "wife");
  if (!primary) return "—";
  const name = `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() || "—";
  if (spouse) {
    const s = `${spouse.firstName ?? ""} ${spouse.lastName ?? ""}`.trim();
    if (s) return `${name} / ${s}`;
  }
  return name;
}

export default async function DashboardPage() {
  const [
    totalClients,
    taxCasesCount,
    agentsCount,
    clerksCount,
    recentHouseholds,
    recentTaxCases,
  ] = await Promise.all([
    prisma.household.count(),
    prisma.taxCase.count(),
    prisma.tblAgent.count(),
    prisma.tblClerk.count(),
    prisma.household.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { agent: true, persons: true },
    }),
    prisma.taxCase.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { household: { include: { persons: true } }, status: true },
    }),
  ]);

  const quickLinks = [
    { label: "לקוחות", value: totalClients, href: "/clients", icon: Users },
    { label: "תיקי מס", value: taxCasesCount, href: "/refunds", icon: Receipt },
    { label: "סוכנים", value: agentsCount, href: "/agents", icon: UserCog },
    { label: "פקידים", value: clerksCount, href: "/clerks", icon: UserCheck },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">לוח בקרה</h1>
        <p className="text-ink-600">סקירת ניהול לקוחות מס</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="card card-hover flex items-center gap-4 p-6 hover:bg-primary-50/30"
            >
              <div className="rounded-lg bg-primary-100 p-3">
                <Icon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-600">{s.label}</p>
                <p className="text-2xl font-bold text-ink-900">{formatNumber(s.value)}</p>
              </div>
              <ArrowRight className="mr-auto h-4 w-4 rotate-180 text-primary-400" />
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-200 bg-primary-50/40 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">לקוחות אחרונים</h2>
              <Link href="/clients" className="text-sm text-primary-600 hover:underline">
                הצג הכל
              </Link>
            </div>
          </div>
          <div className="divide-y divide-ink-100">
            {recentHouseholds.length === 0 ? (
              <p className="p-6 text-center text-ink-500">אין עדיין לקוחות</p>
            ) : (
              recentHouseholds.map((h) => (
                <Link
                  key={h.id}
                  href={`/clients/${h.id}`}
                  className="block px-6 py-4 transition-colors hover:bg-primary-50/50"
                >
                  <p className="font-medium text-ink-900">{getHouseholdDisplayName(h)}</p>
                  <p className="text-sm text-ink-500">
                    {h.agent?.name ?? "—"} • {formatDateTime(h.createdAt)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-ink-200 bg-primary-50/40 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">תיקי מס אחרונים</h2>
              <Link href="/refunds" className="text-sm text-primary-600 hover:underline">
                הצג הכל
              </Link>
            </div>
          </div>
          <div className="divide-y divide-ink-100">
            {recentTaxCases.length === 0 ? (
              <p className="p-6 text-center text-ink-500">אין עדיין תיקי מס</p>
            ) : (
              recentTaxCases.map((tc) => (
                <Link
                  key={tc.id}
                  href={`/clients/${tc.householdId}`}
                  className="block px-6 py-4 transition-colors hover:bg-primary-50/50"
                >
                  <p className="font-medium text-ink-900">
                    {getHouseholdDisplayName(tc.household)} — {tc.taxYear}
                  </p>
                  <p className="text-sm text-ink-500">
                    {formatCurrency(tc.amountRefund)} • {tc.status?.statusName ?? "—"} •{" "}
                    {formatDateTime(tc.createdAt)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { GeneratedDocumentsTable } from "./GeneratedDocumentsTable";

export const dynamic = "force-dynamic";

const TEMPLATE_LABELS: Record<string, string> = {
  employee_agreement: "הסכם שכיר",
  client_refund_report: "דוח החזרים ללקוח",
};

function getHouseholdDisplayName(persons: { role: string | null; firstName: string | null; lastName: string | null }[]) {
  const primary = persons.find((p) => p.role === "husband" || !p.role) ?? persons[0];
  const spouse = persons.find((p) => p.role === "wife");
  if (!primary) return "—";
  const name = `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() || "—";
  if (spouse) {
    const s = `${spouse.firstName ?? ""} ${spouse.lastName ?? ""}`.trim();
    if (s) return `${name} / ${s}`;
  }
  return name;
}

export default async function DocumentsPage() {
  const docs = await prisma.generatedDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: { household: { include: { persons: true } } },
  });

  const rows = docs.map((d) => ({
    id: d.id,
    clientName: d.household ? getHouseholdDisplayName(d.household.persons) : "—",
    templateType: TEMPLATE_LABELS[d.templateType ?? ""] ?? d.templateType ?? "—",
    createdAt: d.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">סוגי מסמכים</h1>
        <p className="text-ink-600">מסמכים שנוצרו במחולל</p>
      </div>
      <div className="card overflow-hidden">
        <GeneratedDocumentsTable rows={rows} />
      </div>
    </div>
  );
}

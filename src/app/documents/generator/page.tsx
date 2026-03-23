import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { DocumentGeneratorForm } from "./DocumentGeneratorForm";

export const dynamic = "force-dynamic";

const TEMPLATE_OPTIONS = [
  { value: "employee_agreement", label: "הסכם שכיר" },
  { value: "client_refund_report", label: "דוח החזרים ללקוח" },
];

export default async function DocumentGeneratorPage() {
  const session = await getServerSession(authOptions);
  if (!canEdit(session?.user?.role)) {
    redirect("/documents");
  }
  const households = await prisma.household.findMany({
    orderBy: { id: "asc" },
    include: { persons: true },
  });

  const clientOptions = households.map((h) => {
    const primary = h.persons.find((p) => p.role === "husband" || !p.role) ?? h.persons[0];
    const spouse = h.persons.find((p) => p.role === "wife");
    const name = primary
      ? `${(primary.firstName ?? "").trim()} ${(primary.lastName ?? "").trim()}`.trim() || `משק בית ${h.id}`
      : `משק בית ${h.id}`;
    const fullName = spouse
      ? `${name} / ${(spouse.firstName ?? "").trim()} ${(spouse.lastName ?? "").trim()}`.trim()
      : name;
    return { householdId: h.id, label: fullName };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">מחולל מסמכים</h1>
        <p className="text-ink-600">יצירת מסמך חדש על בסיס תבנית</p>
      </div>
      <DocumentGeneratorForm clientOptions={clientOptions} templateOptions={TEMPLATE_OPTIONS} />
    </div>
  );
}

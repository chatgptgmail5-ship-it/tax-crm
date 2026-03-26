import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { EmployeeAgreementTemplate } from "./EmployeeAgreementTemplate";
import { ClientRefundReportTemplate, type RefundYearRow } from "./ClientRefundReportTemplate";

export const dynamic = "force-dynamic";

export default async function GeneratedDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const docId = parseInt(id, 10);
  if (isNaN(docId)) notFound();

  const doc = await prisma.generatedDocument.findUnique({
    where: { id: docId },
    include: { household: { include: { persons: true, agent: true } } },
  });
  if (!doc) notFound();

  const session = await getServerSession(authOptions);
  const canEditDoc = canEdit(session?.user?.role);
  const clientName = doc.household
    ? (() => {
        const primary = doc.household.persons.find((p) => p.role === "husband" || !p.role) ?? doc.household.persons[0];
        const spouse = doc.household.persons.find((p) => p.role === "wife");
        if (!primary) return "—";
        const name = `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() || "—";
        if (spouse) {
          const s = `${spouse.firstName ?? ""} ${spouse.lastName ?? ""}`.trim();
          if (s) return `${name} / ${s}`;
        }
        return name;
      })()
    : "—";

  const clientRefundDefaults =
    doc.templateType === "client_refund_report" && doc.household
      ? (() => {
          /** Person order matches "שם / שם" display: first = בן/בת הזוג הרשום, second = בן/בת הזוג */
          const firstPerson = doc.household.persons.find((p) => p.role === "husband");
          const secondPerson = doc.household.persons.find((p) => p.role === "wife");
          const h = doc.household;
          const out: Record<string, string> = {};
          if (firstPerson?.firstName != null && firstPerson.firstName.trim() !== "")
            out.spouseFirstName = firstPerson.firstName.trim();
          if (firstPerson?.lastName != null && firstPerson.lastName.trim() !== "")
            out.familyName = firstPerson.lastName.trim();
          if (firstPerson?.idNumber != null && firstPerson.idNumber.trim() !== "")
            out.spouseIdNumber = firstPerson.idNumber.trim();
          if (secondPerson?.firstName != null && secondPerson.firstName.trim() !== "")
            out.clientFirstName = secondPerson.firstName.trim();
          if (secondPerson?.idNumber != null && secondPerson.idNumber.trim() !== "")
            out.idNumber = secondPerson.idNumber.trim();
          const streetVal = (h.street ?? h.address) != null ? String(h.street ?? h.address).trim() : "";
          const houseNumVal = h.houseNumber != null ? String(h.houseNumber).trim() : "";
          const cityVal = h.city != null ? h.city.trim() : "";
          if (streetVal !== "") out.addressStreetPart = streetVal;
          if (cityVal !== "" || houseNumVal !== "") {
            const cityPart = [cityVal, houseNumVal].filter(Boolean).join("/");
            out.addressCityPart = cityPart ? `, ${cityPart}` : "";
          }
          if (doc.household.agent?.name != null && doc.household.agent.name.trim() !== "")
            out.agentName = doc.household.agent.name.trim();
          return out;
        })()
      : undefined;

  const clientDefaults =
    (doc.templateType === "employee_agreement" || doc.templateType === "employee_agreement_submission") &&
    doc.household
      ? (() => {
          const registeredSpouse = doc.household.persons.find((p) => p.role === "husband");
          const spouse = doc.household.persons.find((p) => p.role === "wife");
          const h = doc.household;
          const out: Record<string, string> = {};
          const rFirst = registeredSpouse?.firstName != null ? registeredSpouse.firstName.trim() : "";
          const rLast = registeredSpouse?.lastName != null ? registeredSpouse.lastName.trim() : "";
          const sFirst = spouse?.firstName != null ? spouse.firstName.trim() : "";
          const sLast = spouse?.lastName != null ? spouse.lastName.trim() : "";
          if (rFirst !== "" || sFirst !== "") {
            out.firstName = [rFirst, sFirst].filter(Boolean).join(" ו ");
          }
          if (rLast !== "") out.lastName = rLast;
          const primaryFull = [rFirst, rLast].filter(Boolean).join(" ").trim();
          if (primaryFull !== "") out.primaryFullName = primaryFull;
          const spouseFull = [sFirst, sLast].filter(Boolean).join(" ").trim();
          if (spouseFull !== "") out.spouseFullName = spouseFull;
          if (registeredSpouse?.idNumber != null && registeredSpouse.idNumber.trim() !== "")
            out.idNumber = registeredSpouse.idNumber.trim();
          if (spouse?.idNumber != null && spouse.idNumber.trim() !== "")
            out.spouseIdNumber = spouse.idNumber.trim();
          const streetVal = (h.street ?? h.address) != null ? String(h.street ?? h.address).trim() : "";
          const houseNumVal = h.houseNumber != null ? String(h.houseNumber).trim() : "";
          if (streetVal !== "") out.street = streetVal;
          if (houseNumVal !== "") out.houseNumber = houseNumVal;
          if (h.city != null && h.city.trim() !== "") out.city = h.city.trim();
          return out;
        })()
      : undefined;

  if (
    (doc.templateType ?? "") === "employee_agreement" ||
    (doc.templateType ?? "") === "employee_agreement_submission"
  ) {
    return (
      <EmployeeAgreementTemplate
        documentId={doc.id}
        initialFieldsData={doc.fieldsData}
        clientName={clientName}
        canEdit={canEditDoc}
        defaultAgentName={doc.household?.agent?.name ?? undefined}
        clientDefaults={clientDefaults}
      />
    );
  }

  /** Same source as client "תיקי מס לפי שנה" tab: TblRefund where clientId = household id (see clients/[id]/page.tsx) */
  let refundYearRows: RefundYearRow[] = [];
  if ((doc.templateType ?? "") === "client_refund_report" && doc.householdId != null) {
    const refunds = await prisma.tblRefund.findMany({
      where: { clientId: doc.householdId },
      orderBy: { yearId: "desc" },
      include: { status: true },
    });
    const seen = new Set<number>();
    for (const r of refunds) {
      if (seen.has(r.yearId)) continue;
      seen.add(r.yearId);
      refundYearRows.push({
        year: r.yearId,
        amount: r.amountRefund,
        statusName: r.status?.statusName ?? null,
      });
      if (refundYearRows.length >= 6) break;
    }
  }

  if ((doc.templateType ?? "") === "client_refund_report") {
    return (
      <ClientRefundReportTemplate
        documentId={doc.id}
        initialFieldsData={doc.fieldsData}
        clientName={clientName}
        canEdit={canEditDoc}
        clientDefaults={clientRefundDefaults}
        refundYearRows={refundYearRows}
      />
    );
  }

  notFound();
}

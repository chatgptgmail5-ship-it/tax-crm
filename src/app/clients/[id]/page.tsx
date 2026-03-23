import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientProfile } from "./ClientProfile";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const householdId = parseInt(id, 10);
  if (isNaN(householdId)) notFound();

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      agent: true,
      clerk: true,
      persons: true,
      taxCases: { include: { status: true }, orderBy: { taxYear: "desc" } },
      children: true,
      documents: { include: { document: true } },
      fileDocuments: true,
    },
  });

  if (!household) notFound();

  const clientRefunds = await prisma.tblRefund.findMany({
    where: { clientId: householdId },
    orderBy: { dateCreated: "desc" },
    include: {
      client: { select: { clientId: true, clientName: true, lastName: true, cp2: true } },
      status: true,
    },
  });
  const commissionByClientId: Record<number, number | null> = { [householdId]: household.cp2 };

  const [agents, clerks, documents, caseStatuses] = await Promise.all([
    prisma.tblAgent.findMany({ orderBy: { name: "asc" }, select: { agentId: true, name: true, cp: true, cp2: true } }),
    prisma.tblClerk.findMany({ orderBy: { name: "asc" } }),
    prisma.tblDocument.findMany({ orderBy: { documentName: "asc" } }),
    prisma.caseStatus.findMany(),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/clients" className="btn btn-ghost inline-flex">
        <ArrowLeft className="h-4 w-4 rotate-180" />
        חזרה
      </Link>

      <ClientProfile
        household={household}
        agents={agents}
        clerks={clerks}
        documents={documents}
        caseStatuses={caseStatuses}
        clientRefunds={clientRefunds}
        commissionByClientId={commissionByClientId}
      />
    </div>
  );
}

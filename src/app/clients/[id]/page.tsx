import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
      agent: { select: { name: true } },
      clerk: { select: { name: true } },
      persons: true,
      taxCases: {
        include: {
          status: { select: { id: true, statusName: true, color: true } },
        },
      },
      children: true,
      documents: { include: { document: { select: { documentName: true } } } },
      fileDocuments: true,
    },
  });

  if (!household) notFound();

  const [agents, clerks, documents, caseStatuses, refunds] = await Promise.all([
    prisma.tblAgent.findMany({ select: { agentId: true, name: true, cp: true, cp2: true } }),
    prisma.tblClerk.findMany({ select: { clerkId: true, name: true } }),
    prisma.tblDocument.findMany({ select: { documentId: true, documentName: true } }),
    prisma.tblStatus.findMany({ select: { statusId: true, statusName: true } }),
    prisma.tblRefund.findMany({
      where: { clientId: householdId },
      orderBy: { yearId: "desc" },
      include: {
        client: { select: { clientId: true, clientName: true, lastName: true, cp2: true } },
        status: { select: { statusName: true } },
      },
    }),
  ]);

  const commissionByClientId: Record<number, number | null> = {
    [household.id]: household.cp2,
  };
  for (const r of refunds) {
    if (!(r.clientId in commissionByClientId)) {
      commissionByClientId[r.clientId] = r.client?.cp2 ?? null;
    }
  }

  const clientRefunds = refunds.map((r) => ({
    refundId: r.refundId,
    clientId: r.clientId,
    yearId: r.yearId,
    dateSubmission: r.dateSubmission,
    amountRefund: r.amountRefund,
    dateRefund: r.dateRefund,
    paymentStatus: r.paymentStatus,
    client: r.client
      ? {
          clientId: r.client.clientId,
          clientName: r.client.clientName,
          lastName: r.client.lastName,
          cp2: r.client.cp2,
        }
      : { clientId: r.clientId, clientName: null, lastName: null, cp2: null },
  }));

  const householdForProfile = {
    ...household,
    documents: household.documents.map((d) => ({
      id: d.id,
      isAccepted: d.isAccepted,
      dateAccepted: d.dateAccepted,
      document: { documentName: d.document?.documentName ?? null },
    })),
  };

  const caseStatusesMapped = caseStatuses.map((s) => ({
    id: s.statusId,
    statusName: s.statusName,
    color: null as string | null,
  }));

  return (
    <ClientProfile
      household={householdForProfile}
      agents={agents}
      clerks={clerks}
      documents={documents}
      caseStatuses={caseStatusesMapped}
      clientRefunds={clientRefunds}
      commissionByClientId={commissionByClientId}
    />
  );
}

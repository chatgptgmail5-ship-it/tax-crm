import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AgentForm } from "@/components/AgentForm";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agentId = parseInt(id, 10);
  if (isNaN(agentId)) notFound();

  const agent = await prisma.tblAgent.findUnique({
    where: { agentId },
    include: { clients: true },
  });

  if (!agent) notFound();

  return (
    <div className="space-y-6">
      <Link href="/agents" className="btn btn-ghost inline-flex">
        <ArrowLeft className="h-4 w-4 rotate-180" />
        חזרה
      </Link>
      <AgentForm agent={agent} />
    </div>
  );
}

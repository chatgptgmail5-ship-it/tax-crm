import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { RefundForm } from "@/components/RefundForm";

export const dynamic = "force-dynamic";

export default async function NewRefundPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!canEdit(session?.user?.role)) {
    redirect("/refunds");
  }
  const params = await searchParams;
  const clientId = params.client ? parseInt(params.client, 10) : null;
  const clients = await prisma.tblClient.findMany({ orderBy: { clientName: "asc" } });
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">הוסף החזר</h1>
        <p className="text-ink-600">יצירת רישום החזר מס חדש</p>
      </div>

      <RefundForm clients={clients} defaultYear={currentYear} defaultClientId={clientId} />
    </div>
  );
}

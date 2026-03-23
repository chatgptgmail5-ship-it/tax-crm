import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { HouseholdNewForm } from "./HouseholdNewForm";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  const session = await getServerSession(authOptions);
  if (!canEdit(session?.user?.role)) {
    redirect("/clients");
  }
  const [agents, clerks] = await Promise.all([
    prisma.tblAgent.findMany({ orderBy: { name: "asc" } }),
    prisma.tblClerk.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">הוסף משק בית</h1>
        <p className="text-ink-600">יצירת משק בית חדש — בעל ו/או אישה</p>
      </div>

      <HouseholdNewForm agents={agents} clerks={clerks} />
    </div>
  );
}

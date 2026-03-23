import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { AgentForm } from "@/components/AgentForm";

export default async function NewAgentPage() {
  const session = await getServerSession(authOptions);
  if (!canEdit(session?.user?.role)) {
    redirect("/agents");
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">הוסף סוכן</h1>
        <p className="text-ink-600">יצירת סוכן הפניה חדש</p>
      </div>
      <AgentForm />
    </div>
  );
}

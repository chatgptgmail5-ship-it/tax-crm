import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { ClerkForm } from "@/components/ClerkForm";

export default async function NewClerkPage() {
  const session = await getServerSession(authOptions);
  if (!canEdit(session?.user?.role)) {
    redirect("/clerks");
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">הוסף פקיד</h1>
        <p className="text-ink-600">יצירת חבר צוות חדש</p>
      </div>
      <ClerkForm />
    </div>
  );
}

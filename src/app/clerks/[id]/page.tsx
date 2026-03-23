import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClerkForm } from "@/components/ClerkForm";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClerkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clerkId = parseInt(id, 10);
  if (isNaN(clerkId)) notFound();

  const clerk = await prisma.tblClerk.findUnique({
    where: { clerkId },
  });

  if (!clerk) notFound();

  return (
    <div className="space-y-6">
      <Link href="/clerks" className="btn btn-ghost inline-flex">
        <ArrowLeft className="h-4 w-4 rotate-180" />
        חזרה
      </Link>
      <ClerkForm clerk={clerk} />
    </div>
  );
}

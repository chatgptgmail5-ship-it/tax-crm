import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isQuestionnaireUnread } from "@/lib/questionnaire-unread";

function primaryDisplayName(persons: { role: string | null; firstName: string | null; lastName: string | null }[]): string {
  const primary = persons.find((p) => p.role === "husband" || !p.role) ?? persons[0];
  if (!primary) return "לקוח";
  const n = `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim();
  return n || "לקוח";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  try {
    const recs = await prisma.taxRefundQuestionnaire.findMany({
      where: { dateReceived: { not: null } },
      include: {
        household: {
          include: {
            persons: { select: { role: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { dateReceived: "desc" },
      take: 500,
    });

    const unread = recs.filter((r) => isQuestionnaireUnread(r.dateReceived, r.crmViewedAt));

    const items = unread.map((r) => ({
      id: r.id,
      householdId: r.householdId,
      clientName: primaryDisplayName(r.household.persons),
      dateReceived: r.dateReceived?.toISOString() ?? null,
    }));

    return NextResponse.json({
      count: unread.length,
      householdIds: [...new Set(unread.map((r) => r.householdId))],
      items,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

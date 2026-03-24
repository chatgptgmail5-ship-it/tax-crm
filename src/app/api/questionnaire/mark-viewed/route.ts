import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isQuestionnaireUnread } from "@/lib/questionnaire-unread";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const householdId =
      typeof body.householdId === "number" ? body.householdId : parseInt(String(body.householdId ?? ""), 10);
    if (isNaN(householdId)) {
      return NextResponse.json({ error: "householdId חסר" }, { status: 400 });
    }

    const recs = await prisma.taxRefundQuestionnaire.findMany({
      where: { householdId, dateReceived: { not: null } },
    });

    const ids = recs.filter((r) => isQuestionnaireUnread(r.dateReceived, r.crmViewedAt)).map((r) => r.id);

    if (ids.length) {
      await prisma.taxRefundQuestionnaire.updateMany({
        where: { id: { in: ids } },
        data: { crmViewedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, marked: ids.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

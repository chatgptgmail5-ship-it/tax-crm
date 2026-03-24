import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isUnreadRow(r: { dateReceived: Date | null; viewedInCRMAt: Date | null }): boolean {
  if (r.dateReceived == null) return false;
  return r.viewedInCRMAt == null || r.viewedInCRMAt < r.dateReceived;
}

/** CRM-only: mark all currently-unread questionnaire rows for this household as viewed. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { householdId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = body.householdId;
  const householdId = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(householdId)) {
    return NextResponse.json({ error: "householdId חסר" }, { status: 400 });
  }

  const rows = await prisma.taxRefundQuestionnaire.findMany({
    where: { householdId, dateReceived: { not: null } },
    select: { id: true, dateReceived: true, viewedInCRMAt: true },
  });
  const ids = rows.filter(isUnreadRow).map((r) => r.id);

  if (ids.length > 0) {
    const now = new Date();
    await prisma.taxRefundQuestionnaire.updateMany({
      where: { id: { in: ids } },
      data: { viewedInCRMAt: now },
    });
  }

  return NextResponse.json({ ok: true, marked: ids.length });
}

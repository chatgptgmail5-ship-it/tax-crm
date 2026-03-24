import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** CRM-only: unread = received submission not yet “seen” in CRM tab. */
function isUnreadRow(r: { dateReceived: Date | null; viewedInCRMAt: Date | null }): boolean {
  if (r.dateReceived == null) return false;
  return r.viewedInCRMAt == null || r.viewedInCRMAt < r.dateReceived;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.taxRefundQuestionnaire.findMany({
    where: { dateReceived: { not: null } },
    select: { householdId: true, dateReceived: true, viewedInCRMAt: true },
  });
  const unread = rows.filter(isUnreadRow);
  const unreadHouseholdIds = [...new Set(unread.map((r) => r.householdId))];

  return NextResponse.json({
    hasUnread: unreadHouseholdIds.length > 0,
    unreadHouseholdIds,
  });
}

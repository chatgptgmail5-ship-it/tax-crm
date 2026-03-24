import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { householdDisplayName } from "@/lib/household-display-name";

/** Lists questionnaire rows received from client but not yet opened in CRM (שאלון החזר מס tab). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.taxRefundQuestionnaire.findMany({
    where: {
      dateReceived: { not: null },
      isViewedInCRM: false,
    },
    orderBy: { dateReceived: "desc" },
    include: {
      household: { include: { persons: { select: { role: true, firstName: true, lastName: true } } } },
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    householdId: r.householdId,
    displayName: householdDisplayName(r.household.persons),
    dateReceived: r.dateReceived!.toISOString(),
  }));

  const householdIds = [...new Set(items.map((i) => i.householdId))];

  return NextResponse.json({
    count: items.length,
    householdIds,
    items,
  });
}

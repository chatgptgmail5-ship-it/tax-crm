import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Mark all received questionnaires for a household as seen in CRM (staff opened שאלון החזר מס tab). */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const householdId =
      typeof body.householdId === "number" ? body.householdId : parseInt(String(body.householdId ?? ""), 10);
    if (Number.isNaN(householdId)) {
      return NextResponse.json({ error: "householdId חסר" }, { status: 400 });
    }

    await prisma.taxRefundQuestionnaire.updateMany({
      where: {
        householdId,
        dateReceived: { not: null },
        isViewedInCRM: false,
      },
      data: { isViewedInCRM: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

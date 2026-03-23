import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const householdId = parseInt(searchParams.get("householdId") ?? "", 10);
    if (isNaN(householdId)) {
      return NextResponse.json({ error: "householdId חסר" }, { status: 400 });
    }

    const rec = await prisma.taxRefundQuestionnaire.findFirst({
      where: { householdId },
      orderBy: { dateSent: "desc" },
    });

    if (!rec) return NextResponse.json(null);
    return NextResponse.json({
      id: rec.id,
      token: rec.token,
      dateSent: rec.dateSent,
      dateReceived: rec.dateReceived,
      answers: rec.answers ? JSON.parse(rec.answers) : null,
      result: rec.result,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const householdId = parseInt(id, 10);
    if (isNaN(householdId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    const activities = await prisma.householdActivity.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(activities);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה בטעינה" }, { status: 500 });
  }
}

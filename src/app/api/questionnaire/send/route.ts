import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const householdId = typeof body.householdId === "number" ? body.householdId : parseInt(String(body.householdId ?? ""), 10);
    if (isNaN(householdId)) return NextResponse.json({ error: "householdId חסר" }, { status: 400 });

    const token = randomUUID();
    // Never pass id - Prisma auto-generates via @default(autoincrement())
    await prisma.taxRefundQuestionnaire.create({
      data: {
        householdId,
        token,
        dateSent: new Date(),
      },
    });
    return NextResponse.json({ token });
  } catch (e) {
    console.error("Send questionnaire API error:", e);
    const msg = e instanceof Error ? e.message : "שגיאה בשרת";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

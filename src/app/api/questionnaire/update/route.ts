import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { calculateResult } from "@/lib/questionnaire-scoring";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const id = typeof body.id === "number" ? body.id : parseInt(String(body.id ?? ""), 10);
    const answers = body.answers;
    if (isNaN(id)) return NextResponse.json({ error: "id חסר" }, { status: 400 });
    if (!answers || typeof answers !== "object") return NextResponse.json({ error: "חסרות תשובות" }, { status: 400 });

    const result = calculateResult(answers);
    await prisma.taxRefundQuestionnaire.update({
      where: { id },
      data: {
        answers: JSON.stringify(answers),
        result,
      },
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

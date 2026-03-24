import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateResult } from "@/lib/questionnaire-scoring";

/** Public endpoint: client submits questionnaire by token. No auth required. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const answers = body.answers;
    if (!token) return NextResponse.json({ error: "חסר טוקן" }, { status: 400 });
    if (!answers || typeof answers !== "object") return NextResponse.json({ error: "חסרות תשובות" }, { status: 400 });

    const rec = await prisma.taxRefundQuestionnaire.findUnique({ where: { token } });
    if (!rec) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    if (rec.dateReceived) return NextResponse.json({ error: "כבר נשלח" }, { status: 400 });

    const result = calculateResult(answers);
    await prisma.taxRefundQuestionnaire.update({
      where: { token },
      data: {
        dateReceived: new Date(),
        answers: JSON.stringify(answers),
        result,
      },
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("Questionnaire submit error:", e);
    const msg = e instanceof Error ? e.message : "שגיאה בשרת";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

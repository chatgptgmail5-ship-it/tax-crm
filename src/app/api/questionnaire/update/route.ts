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
    if (isNaN(id)) return NextResponse.json({ error: "id חסר" }, { status: 400 });

    if (body.resetForNewEntry === true) {
      const householdId =
        typeof body.householdId === "number" ? body.householdId : parseInt(String(body.householdId ?? ""), 10);
      if (Number.isNaN(householdId)) {
        return NextResponse.json({ error: "householdId חסר" }, { status: 400 });
      }
      const rec = await prisma.taxRefundQuestionnaire.findUnique({ where: { id } });
      if (!rec || rec.householdId !== householdId) {
        return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
      }
      await prisma.taxRefundQuestionnaire.update({
        where: { id },
        data: {
          dateReceived: null,
          answers: null,
          result: null,
        },
      });
      const updated = await prisma.taxRefundQuestionnaire.findUnique({ where: { id } });
      if (!updated) return NextResponse.json({ error: "שגיאה" }, { status: 500 });
      return NextResponse.json({
        ok: true,
        id: updated.id,
        token: updated.token,
        dateSent: updated.dateSent,
        dateReceived: updated.dateReceived,
        answers: updated.answers ? JSON.parse(updated.answers) : null,
        result: updated.result,
      });
    }

    const answers = body.answers;
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

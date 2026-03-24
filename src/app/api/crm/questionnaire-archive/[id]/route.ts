import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { calculateResult } from "@/lib/questionnaire-scoring";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  let body: { householdId?: unknown; answers?: unknown; finalStatus?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const householdId =
    typeof body.householdId === "number" ? body.householdId : parseInt(String(body.householdId ?? ""), 10);
  if (Number.isNaN(householdId)) {
    return NextResponse.json({ error: "householdId חסר" }, { status: 400 });
  }

  const existing = await prisma.taxRefundQuestionnaireArchive.findUnique({ where: { id } });
  if (!existing || existing.householdId !== householdId) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "חסרות תשובות" }, { status: 400 });
  }

  const answers = body.answers as Record<string, string>;
  const resultText = calculateResult(answers);

  let finalStatus: string | null = null;
  if (body.finalStatus === null || body.finalStatus === "") {
    finalStatus = null;
  } else if (typeof body.finalStatus === "string") {
    const v = body.finalStatus.trim();
    if (v === "קיבל" || v === "לא קיבל") finalStatus = v;
    else if (v) return NextResponse.json({ error: "סטטוס סופי לא תקין" }, { status: 400 });
  }

  const updated = await prisma.taxRefundQuestionnaireArchive.update({
    where: { id },
    data: {
      answers: JSON.stringify(answers),
      resultText,
      finalStatus,
    },
  });

  return NextResponse.json({
    id: updated.id,
    householdId: updated.householdId,
    fullName: updated.fullName,
    submittedAt: updated.submittedAt.toISOString(),
    resultText: updated.resultText,
    finalStatus: updated.finalStatus,
    answers,
  });
}

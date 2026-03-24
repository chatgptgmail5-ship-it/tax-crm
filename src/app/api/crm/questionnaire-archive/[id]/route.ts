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

  let body: {
    householdId?: unknown;
    answers?: unknown;
    finalStatus?: unknown;
    fullName?: unknown;
    submittedAt?: unknown;
    resultText?: unknown;
  };
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

  let answersObj: Record<string, string>;
  try {
    answersObj = JSON.parse(existing.answers) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "תשובות פגומות" }, { status: 400 });
  }

  let nextAnswersJson = existing.answers;
  if (body.answers !== undefined) {
    if (!body.answers || typeof body.answers !== "object") {
      return NextResponse.json({ error: "חסרות תשובות" }, { status: 400 });
    }
    answersObj = body.answers as Record<string, string>;
    nextAnswersJson = JSON.stringify(answersObj);
  }

  let nextResultText = existing.resultText;
  if (body.answers !== undefined && body.resultText === undefined) {
    nextResultText = calculateResult(answersObj);
  } else if (body.resultText !== undefined) {
    if (body.resultText === null) {
      nextResultText = null;
    } else if (typeof body.resultText === "string") {
      nextResultText = body.resultText.trim() || null;
    } else {
      return NextResponse.json({ error: "תוצאה לא תקינה" }, { status: 400 });
    }
  }

  let nextFullName = existing.fullName;
  if (body.fullName !== undefined) {
    if (typeof body.fullName !== "string") {
      return NextResponse.json({ error: "שם לא תקין" }, { status: 400 });
    }
    nextFullName = body.fullName.trim();
  }

  let nextSubmittedAt = existing.submittedAt;
  if (body.submittedAt !== undefined) {
    const d = new Date(String(body.submittedAt));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "תאריך לא תקין" }, { status: 400 });
    }
    nextSubmittedAt = d;
  }

  let nextFinalStatus = existing.finalStatus;
  if (body.finalStatus !== undefined) {
    if (body.finalStatus === null || body.finalStatus === "") {
      nextFinalStatus = null;
    } else if (typeof body.finalStatus === "string") {
      const v = body.finalStatus.trim();
      if (v === "קיבל" || v === "לא קיבל") nextFinalStatus = v;
      else if (v) return NextResponse.json({ error: "סטטוס סופי לא תקין" }, { status: 400 });
    }
  }

  const updated = await prisma.taxRefundQuestionnaireArchive.update({
    where: { id },
    data: {
      answers: nextAnswersJson,
      resultText: nextResultText,
      fullName: nextFullName,
      submittedAt: nextSubmittedAt,
      finalStatus: nextFinalStatus,
    },
  });

  let outAnswers: Record<string, string>;
  try {
    outAnswers = JSON.parse(updated.answers) as Record<string, string>;
  } catch {
    outAnswers = {};
  }

  return NextResponse.json({
    id: updated.id,
    householdId: updated.householdId,
    fullName: updated.fullName,
    submittedAt: updated.submittedAt.toISOString(),
    resultText: updated.resultText,
    finalStatus: updated.finalStatus,
    answers: outAnswers,
  });
}

export async function DELETE(
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

  const householdId = parseInt(new URL(req.url).searchParams.get("householdId") ?? "", 10);
  if (Number.isNaN(householdId)) {
    return NextResponse.json({ error: "householdId חסר" }, { status: 400 });
  }

  const existing = await prisma.taxRefundQuestionnaireArchive.findUnique({ where: { id } });
  if (!existing || existing.householdId !== householdId) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  await prisma.taxRefundQuestionnaireArchive.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

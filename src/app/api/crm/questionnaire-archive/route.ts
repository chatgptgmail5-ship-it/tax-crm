import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { calculateResult } from "@/lib/questionnaire-scoring";

function parseHouseholdId(req: NextRequest): number | null {
  const id = parseInt(new URL(req.url).searchParams.get("householdId") ?? "", 10);
  return Number.isNaN(id) ? null : id;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const householdId = parseHouseholdId(req);
  if (householdId == null) {
    return NextResponse.json({ error: "householdId חסר" }, { status: 400 });
  }

  const rows = await prisma.taxRefundQuestionnaireArchive.findMany({
    where: { householdId },
    orderBy: { submittedAt: "desc" },
  });

  const items = rows.map((r) => ({
    id: r.id,
    householdId: r.householdId,
    fullName: r.fullName,
    submittedAt: r.submittedAt.toISOString(),
    resultText: r.resultText,
    finalStatus: r.finalStatus,
    answers: JSON.parse(r.answers) as Record<string, string>,
  }));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  let body: {
    householdId?: unknown;
    fullName?: unknown;
    submittedAt?: unknown;
    resultText?: unknown;
    answers?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const householdId =
    typeof body.householdId === "number" ? body.householdId : parseInt(String(body.householdId ?? ""), 10);
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const submittedAtRaw = body.submittedAt;
  const answersObj = body.answers;

  if (Number.isNaN(householdId) || !fullName) {
    return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 });
  }
  if (!answersObj || typeof answersObj !== "object") {
    return NextResponse.json({ error: "חסרות תשובות" }, { status: 400 });
  }

  let submittedAt: Date;
  if (typeof submittedAtRaw === "string") {
    submittedAt = new Date(submittedAtRaw);
    if (Number.isNaN(submittedAt.getTime())) {
      return NextResponse.json({ error: "תאריך לא תקין" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "תאריך חסר" }, { status: 400 });
  }

  const answers = answersObj as Record<string, string>;
  const resultText =
    typeof body.resultText === "string" && body.resultText.trim()
      ? body.resultText.trim()
      : calculateResult(answers);

  const created = await prisma.taxRefundQuestionnaireArchive.create({
    data: {
      householdId,
      fullName,
      submittedAt,
      resultText,
      finalStatus: null,
      answers: JSON.stringify(answers),
    },
  });

  return NextResponse.json({
    id: created.id,
    householdId: created.householdId,
    fullName: created.fullName,
    submittedAt: created.submittedAt.toISOString(),
    resultText: created.resultText,
    finalStatus: created.finalStatus,
    answers,
  });
}

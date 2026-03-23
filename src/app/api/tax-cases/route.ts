import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

async function resolveCaseStatusId(statusName: unknown): Promise<number | null> {
  const name = statusName != null ? String(statusName).trim() : "";
  if (!name) return null;
  const existing = await prisma.caseStatus.findFirst({ where: { statusName: name } });
  if (existing) return existing.id;
  const created = await prisma.caseStatus.create({ data: { statusName: name } });
  return created.id;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const caseStatusId = await resolveCaseStatusId(body.caseStatusName);
    const taxCase = await prisma.taxCase.create({
      data: {
        householdId: body.householdId,
        taxYear: body.taxYear,
        caseStatusId,
        dateSubmission: body.dateSubmission ? new Date(body.dateSubmission) : null,
        amountRefund: body.amountRefund ?? null,
        dateRefund: body.dateRefund ? new Date(body.dateRefund) : null,
        notes: body.notes ?? null,
      },
      include: { status: true },
    });
    return NextResponse.json(taxCase);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "יצירת תיק מס נכשלה" }, { status: 500 });
  }
}

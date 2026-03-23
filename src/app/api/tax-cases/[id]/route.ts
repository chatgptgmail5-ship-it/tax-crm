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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const taxCaseId = parseInt(id, 10);
    if (isNaN(taxCaseId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    const body = await req.json();
    const hasStatusName = Object.prototype.hasOwnProperty.call(body, "caseStatusName");
    const caseStatusId = hasStatusName ? await resolveCaseStatusId(body.caseStatusName) : undefined;

    const taxCase = await prisma.taxCase.update({
      where: { id: taxCaseId },
      data: {
        caseStatusId,
        dateSubmission: body.dateSubmission ? new Date(body.dateSubmission) : undefined,
        amountRefund: body.amountRefund ?? undefined,
        dateRefund: body.dateRefund ? new Date(body.dateRefund) : undefined,
        notes: body.notes ?? undefined,
      },
      include: { status: true },
    });
    return NextResponse.json(taxCase);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "עדכון תיק מס נכשל" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const taxCaseId = parseInt(id, 10);
    if (isNaN(taxCaseId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    await prisma.taxCase.delete({ where: { id: taxCaseId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקת תיק מס נכשלה" }, { status: 500 });
  }
}

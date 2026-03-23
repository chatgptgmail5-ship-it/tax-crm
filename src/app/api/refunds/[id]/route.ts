import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

async function resolveRefundStatusId(statusName: unknown): Promise<number | null> {
  const name = statusName != null ? String(statusName).trim() : "";
  if (!name) return null;
  const existing = await prisma.tblStatus.findFirst({ where: { statusName: name } });
  if (existing) return existing.statusId;
  const created = await prisma.tblStatus.create({ data: { statusName: name } });
  return created.statusId;
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
    const refundId = parseInt(id, 10);
    if (isNaN(refundId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    const body = await req.json();
    const hasStatusName = Object.prototype.hasOwnProperty.call(body, "statusName");
    const statusId = hasStatusName ? await resolveRefundStatusId(body.statusName) : undefined;
    const refund = await prisma.tblRefund.update({
      where: { refundId },
      data: {
        clientId: body.clientId,
        yearId: body.yearId,
        dateSubmission: body.dateSubmission ? new Date(body.dateSubmission) : undefined,
        amountRefund: body.amountRefund ?? undefined,
        dateRefund: body.dateRefund ? new Date(body.dateRefund) : undefined,
        statusId,
        paymentStatus: body.paymentStatus !== undefined ? body.paymentStatus : undefined,
        notes: body.notes ?? undefined,
        lastUpdate: new Date(),
      },
    });
    return NextResponse.json(refund);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "עדכון החזר נכשל" }, { status: 500 });
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
    const refundId = parseInt(id, 10);
    if (isNaN(refundId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    await prisma.tblRefund.delete({
      where: { refundId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקת ההחזר נכשלה" }, { status: 500 });
  }
}

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const statusId = await resolveRefundStatusId(body.statusName);
    const refund = await prisma.tblRefund.create({
      data: {
        clientId: body.clientId,
        yearId: body.yearId,
        dateSubmission: body.dateSubmission ? new Date(body.dateSubmission) : null,
        amountRefund: body.amountRefund ?? null,
        dateRefund: body.dateRefund ? new Date(body.dateRefund) : null,
        statusId,
        notes: body.notes ?? null,
      },
    });
    return NextResponse.json(refund);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "יצירת החזר נכשלה" }, { status: 500 });
  }
}

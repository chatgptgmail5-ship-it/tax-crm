import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

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
    const dateId = parseInt(id, 10);
    if (isNaN(dateId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    const body = await req.json();
    await prisma.householdImportantDate.update({
      where: { id: dateId },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        performerId: body.performerId !== undefined ? (body.performerId ? Number(body.performerId) : null) : undefined,
        subject: body.subject !== undefined ? (body.subject?.trim() || null) : undefined,
        details: body.details !== undefined ? (body.details?.trim() || null) : undefined,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "עדכון נכשל" }, { status: 500 });
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
    const dateId = parseInt(id, 10);
    if (isNaN(dateId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    await prisma.householdImportantDate.delete({
      where: { id: dateId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקה נכשלה" }, { status: 500 });
  }
}

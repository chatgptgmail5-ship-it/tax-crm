import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    if (isNaN(docId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: docId },
      include: { household: { include: { persons: true } } },
    });
    if (!doc) return NextResponse.json({ error: "מסמך לא נמצא" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "טעינה נכשלה" }, { status: 500 });
  }
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
    const docId = parseInt(id, 10);
    if (isNaN(docId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    const body = await req.json();
    const fieldsData = body.fieldsData != null ? JSON.stringify(body.fieldsData) : undefined;
    const doc = await prisma.generatedDocument.update({
      where: { id: docId },
      data: { fieldsData },
    });
    return NextResponse.json(doc);
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
    const docId = parseInt(id, 10);
    if (isNaN(docId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    await prisma.generatedDocument.delete({ where: { id: docId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקה נכשלה" }, { status: 500 });
  }
}

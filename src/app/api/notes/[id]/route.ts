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

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  let body: { content?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.staffNote.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const data: { content?: string; status?: string } = {};

  if (body.content !== undefined) {
    if (typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json({ error: "תוכן חסר" }, { status: 400 });
    }
    data.content = body.content.trim();
  }

  if (body.status !== undefined) {
    if (body.status === "archived") {
      data.status = "archived";
    } else if (body.status === "open") {
      if (existing.status !== "archived") {
        return NextResponse.json({ error: "ניתן לשחזר רק הערה מהארכיון" }, { status: 400 });
      }
      data.status = "open";
    } else {
      return NextResponse.json({ error: "סטטוס לא תקין" }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "אין שינוי" }, { status: 400 });
  }

  const updated = await prisma.staffNote.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    id: updated.id,
    content: updated.content,
    priority: updated.priority,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
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

  const existing = await prisma.staffNote.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  await prisma.staffNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

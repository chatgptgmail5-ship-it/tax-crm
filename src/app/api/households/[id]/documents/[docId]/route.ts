import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logHouseholdActivity } from "@/lib/activity";
import { unlink } from "fs/promises";
import path from "path";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const { id, docId } = await params;
    const householdId = parseInt(id, 10);
    const documentId = parseInt(docId, 10);
    if (isNaN(householdId) || isNaN(documentId)) {
      return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    }

    const doc = await prisma.householdFileDocument.findFirst({
      where: { id: documentId, householdId },
    });
    if (!doc) return NextResponse.json({ error: "מסמך לא נמצא" }, { status: 404 });

    const body = await req.json();
    const notes = body.notes != null ? (body.notes as string) : undefined;

    await prisma.householdFileDocument.update({
      where: { id: documentId },
      data: { notes },
    });

    if (notes != null)
      await logHouseholdActivity(
        householdId,
        "notes_updated",
        doc.customName ? `הערות למסמך: ${doc.customName}` : "נוספו הערות למסמך"
      );

    const updated = await prisma.householdFileDocument.findUnique({
      where: { id: documentId },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "עדכון נכשל" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const { id, docId } = await params;
    const householdId = parseInt(id, 10);
    const documentId = parseInt(docId, 10);
    if (isNaN(householdId) || isNaN(documentId)) {
      return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    }

    const doc = await prisma.householdFileDocument.findFirst({
      where: { id: documentId, householdId },
    });

    if (!doc) return NextResponse.json({ error: "מסמך לא נמצא" }, { status: 404 });

    if (doc.filePath) {
      const fullPath = path.join(process.cwd(), "public", "uploads", doc.filePath);
      try {
        await unlink(fullPath);
      } catch {}
    }

    await prisma.householdFileDocument.delete({
      where: { id: documentId },
    });

    await logHouseholdActivity(
      householdId,
      "document_deleted",
      doc.customName ? `נמחק מסמך: ${doc.customName}` : "נמחק מסמך"
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקת מסמך נכשלה" }, { status: 500 });
  }
}

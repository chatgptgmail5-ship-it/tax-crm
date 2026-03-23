import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logHouseholdActivity } from "@/lib/activity";

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
    const childId = parseInt(id, 10);
    if (isNaN(childId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    const allowed = [
      "firstName", "lastName", "birthDay", "idNumber", "gender",
      "custodyOf", "isDisabled", "hasAdhd", "phone",
      "motherName", "fatherName",
    ];
    for (const k of allowed) {
      if (k in body) {
        if (k === "birthDay") {
          data[k] = body[k] ? new Date(body[k]) : null;
        } else {
          data[k] = body[k];
        }
      }
    }

    await prisma.householdChild.update({
      where: { id: childId },
      data,
    });

    const child = await prisma.householdChild.findUnique({
      where: { id: childId },
    });
    if (child?.householdId) {
      const name = [child.firstName, child.lastName].filter(Boolean).join(" ") || "ילד";
      await logHouseholdActivity(child.householdId, "child_updated", `עודכן ילד: ${name}`);
    }
    return NextResponse.json(child);
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
    const childId = parseInt(id, 10);
    if (isNaN(childId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    await prisma.householdChild.delete({
      where: { id: childId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקה נכשלה" }, { status: 500 });
  }
}

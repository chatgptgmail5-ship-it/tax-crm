import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logHouseholdActivity } from "@/lib/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const householdId = parseInt(id, 10);
    if (isNaN(householdId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    const body = await req.json();

    const child = await prisma.householdChild.create({
      data: {
        householdId,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        birthDay: body.birthDay ? new Date(body.birthDay) : null,
        idNumber: body.idNumber ?? null,
        gender: body.gender ?? null,
        custodyOf: body.custodyOf ?? null,
        isDisabled: body.isDisabled ?? false,
        hasAdhd: body.hasAdhd ?? false,
        phone: body.phone ?? null,
        motherName: body.motherName ?? null,
        fatherName: body.fatherName ?? null,
      },
    });

    const childName = [body.firstName, body.lastName].filter(Boolean).join(" ") || "ילד";
    await logHouseholdActivity(householdId, "child_added", `נוסף ילד: ${childName}`);
    return NextResponse.json(child);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "הוספת ילד נכשלה" }, { status: 500 });
  }
}

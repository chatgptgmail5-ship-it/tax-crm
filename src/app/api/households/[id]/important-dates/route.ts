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
    const householdId = parseInt(id, 10);
    if (isNaN(householdId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    const dates = await prisma.householdImportantDate.findMany({
      where: { householdId },
      orderBy: { date: "desc" },
      include: { performer: { select: { id: true, name: true } } },
    });
    return NextResponse.json(dates);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "טעינה נכשלה" }, { status: 500 });
  }
}

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
    const date = await prisma.householdImportantDate.create({
      data: {
        householdId,
        date: body.date ? new Date(body.date) : new Date(),
        performerId: body.performerId ? Number(body.performerId) : null,
        subject: body.subject?.trim() || null,
        details: body.details?.trim() || null,
      },
      include: { performer: { select: { id: true, name: true } } },
    });
    return NextResponse.json(date);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "הוספה נכשלה" }, { status: 500 });
  }
}

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
    const clerkId = parseInt(id, 10);
    if (isNaN(clerkId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    const body = await req.json();
    const clerk = await prisma.tblClerk.update({
      where: { clerkId },
      data: {
        name: body.name ?? undefined,
        contact: body.contact ?? undefined,
        mobile: body.mobile ?? undefined,
        email: body.email ?? undefined,
        address: body.address ?? undefined,
        phone: body.phone ?? undefined,
        fax: body.fax ?? undefined,
        squad: body.squad ?? undefined,
      },
    });
    return NextResponse.json(clerk);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "עדכון פקיד נכשל" }, { status: 500 });
  }
}

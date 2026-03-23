import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

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
    const agentId = parseInt(id, 10);
    if (isNaN(agentId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    await prisma.$transaction([
      prisma.household.updateMany({ where: { agentId }, data: { agentId: null } }),
      prisma.tblClient.updateMany({ where: { agentId }, data: { agentId: null } }),
      prisma.tblAgent.delete({ where: { agentId } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקת סוכן נכשלה" }, { status: 500 });
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
    const agentId = parseInt(id, 10);
    if (isNaN(agentId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    const body = await req.json();
    const agent = await prisma.tblAgent.update({
      where: { agentId },
      data: {
        name: body.name ?? undefined,
        contact: body.contact ?? undefined,
        mobile: body.mobile ?? undefined,
        email: body.email ?? undefined,
        address: body.address ?? undefined,
        city: body.city ?? undefined,
        phone: body.phone ?? undefined,
        fax: body.fax ?? undefined,
        cp: body.cp ?? undefined,
        cp2: body.cp2 ?? undefined,
      },
    });
    return NextResponse.json(agent);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "עדכון סוכן נכשל" }, { status: 500 });
  }
}

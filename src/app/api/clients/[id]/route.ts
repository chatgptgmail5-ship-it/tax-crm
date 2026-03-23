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
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    const body = await req.json();
    const client = await prisma.tblClient.update({
      where: { clientId },
      data: {
        clientName: body.clientName ?? undefined,
        lastName: body.lastName ?? undefined,
        tz: body.tz ?? undefined,
        birthDay: body.birthDay ? new Date(body.birthDay) : undefined,
        mobile: body.mobile ?? undefined,
        maritalStatus: body.maritalStatus ?? undefined,
        migdar: body.migdar ?? undefined,
        clientNameSub: body.clientNameSub ?? undefined,
        tzSub: body.tzSub ?? undefined,
        birthDaySub: body.birthDaySub ? new Date(body.birthDaySub) : undefined,
        mobileSub: body.mobileSub ?? undefined,
        migdarSub: body.migdarSub ?? undefined,
        address: body.address ?? undefined,
        city: body.city ?? undefined,
        addressPost: body.addressPost ?? undefined,
        phoneHome: body.phoneHome ?? undefined,
        phoneWork: body.phoneWork ?? undefined,
        email: body.email ?? undefined,
        notes: body.notes ?? undefined,
        clerkId: body.clerkId ?? undefined,
        agentId: body.agentId ?? undefined,
        cp: body.cp ?? undefined,
        cp2: body.cp2 ?? undefined,
        lastUpdate: new Date(),
      },
    });
    return NextResponse.json(client);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "עדכון לקוח נכשל" }, { status: 500 });
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
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    await prisma.tblClient.delete({ where: { clientId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקת לקוח נכשלה" }, { status: 500 });
  }
}

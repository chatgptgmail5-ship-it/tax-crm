import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const client = await prisma.tblClient.create({
      data: {
        clientName: body.clientName ?? null,
        lastName: body.lastName ?? null,
        tz: body.tz ?? null,
        birthDay: body.birthDay ? new Date(body.birthDay) : null,
        mobile: body.mobile ?? null,
        maritalStatus: body.maritalStatus ?? null,
        migdar: body.migdar ?? null,
        clientNameSub: body.clientNameSub ?? null,
        tzSub: body.tzSub ?? null,
        birthDaySub: body.birthDaySub ? new Date(body.birthDaySub) : null,
        mobileSub: body.mobileSub ?? null,
        migdarSub: body.migdarSub ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        addressPost: body.addressPost ?? null,
        phoneHome: body.phoneHome ?? null,
        phoneWork: body.phoneWork ?? null,
        email: body.email ?? null,
        notes: body.notes ?? null,
        clerkId: body.clerkId ?? null,
        agentId: body.agentId ?? null,
        cp: body.cp ?? null,
        cp2: body.cp2 ?? null,
      },
    });
    return NextResponse.json(client);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "יצירת לקוח נכשלה" }, { status: 500 });
  }
}

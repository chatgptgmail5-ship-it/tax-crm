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
    const clerk = await prisma.tblClerk.create({
      data: {
        name: body.name ?? null,
        contact: body.contact ?? null,
        mobile: body.mobile ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        phone: body.phone ?? null,
        fax: body.fax ?? null,
        squad: body.squad ?? null,
      },
    });
    return NextResponse.json(clerk);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "יצירת פקיד נכשלה" }, { status: 500 });
  }
}

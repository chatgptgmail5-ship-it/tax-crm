import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminPassword, email, newPassword } = body;

    if (adminPassword !== "password2010") {
      return NextResponse.json(
        { error: "סיסמת מנהל שגויה" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "אימייל לא נמצא במערכת" },
        { status: 404 }
      );
    }

    const passwordHash = await hash(newPassword, 12);

    await prisma.user.update({
      where: { email: email.trim() },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "איפוס הסיסמה נכשל" },
      { status: 500 }
    );
  }
}
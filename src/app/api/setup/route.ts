import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json({ error: "ההגדרה כבר הושלמה." }, { status: 400 });
  }

  const body = await req.json();
  const { name, email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "אימייל וסיסמה נדרשים." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "קיים כבר משתמש עם אימייל זה." }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      isAdmin: true,
      role: "admin",
    },
  });

  return NextResponse.json({ ok: true });
}

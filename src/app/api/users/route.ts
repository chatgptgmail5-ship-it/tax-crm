import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "לא מאומת" }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, password, role: newRole } = body;
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
  const role = newRole === "admin" ? "admin" : newRole === "viewer" ? "viewer" : "clerk";
  const isAdmin = role === "admin";
  await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
      isAdmin,
      role,
    },
  });

  return NextResponse.json({ ok: true });
}

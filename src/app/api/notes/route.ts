import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

const PRIORITIES = new Set(["low", "medium", "high"]);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get("bell") === "1") {
    const count = await prisma.staffNote.count({ where: { status: "open" } });
    return NextResponse.json({ hasOpen: count > 0 });
  }

  const status = searchParams.get("status") === "archived" ? "archived" : "open";
  const rows = await prisma.staffNote.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      content: r.content,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  let body: { content?: unknown; priority?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const priority = typeof body.priority === "string" ? body.priority.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "תוכן חסר" }, { status: 400 });
  }
  if (!PRIORITIES.has(priority)) {
    return NextResponse.json({ error: "עדיפות לא תקינה" }, { status: 400 });
  }

  const created = await prisma.staffNote.create({
    data: { content, priority, status: "open" },
  });

  return NextResponse.json({
    id: created.id,
    content: created.content,
    priority: created.priority,
    status: created.status,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}

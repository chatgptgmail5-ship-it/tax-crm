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
    const { householdId, templateType } = body;
    if (householdId == null) {
      return NextResponse.json({ error: "חסרים שדות" }, { status: 400 });
    }
    const doc = await prisma.generatedDocument.create({
      data: {
        householdId: Number(householdId),
        templateType: templateType != null ? String(templateType) : "employee_agreement",
        fieldsData: "{}",
      },
    });
    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "יצירת מסמך נכשלה" }, { status: 500 });
  }
}

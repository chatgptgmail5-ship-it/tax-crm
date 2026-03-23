import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logHouseholdActivity } from "@/lib/activity";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const householdId = parseInt(id, 10);
    if (isNaN(householdId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customName = (formData.get("customName") as string) || null;
    const notes = (formData.get("notes") as string) || null;
    const documentCreatedAtStr = formData.get("documentCreatedAt") as string | null;
    const documentCreatedAt = documentCreatedAtStr
      ? new Date(documentCreatedAtStr)
      : null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || "";
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "households", String(householdId));
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const relativePath = `households/${householdId}/${safeName}`;

    const doc = await prisma.householdFileDocument.create({
      data: {
        householdId,
        customName,
        fileName: file.name,
        filePath: relativePath,
        notes,
        documentCreatedAt,
      },
    });

    await logHouseholdActivity(
      householdId,
      "document_uploaded",
      customName ? `הועלה מסמך: ${customName}` : "הועלה מסמך"
    );
    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "העלאת מסמך נכשלה" }, { status: 500 });
  }
}

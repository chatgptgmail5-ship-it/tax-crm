import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const relativePath = pathSegments.join("/");
    if (!relativePath || relativePath.includes("..")) {
      return new NextResponse("לא נמצא", { status: 404 });
    }
    const fullPath = path.join(process.cwd(), "public", "uploads", relativePath);
    const buffer = await readFile(fullPath);
    const ext = path.extname(relativePath).toLowerCase();
    const mime: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const contentType = mime[ext] ?? "application/octet-stream";
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new NextResponse("לא נמצא", { status: 404 });
  }
}

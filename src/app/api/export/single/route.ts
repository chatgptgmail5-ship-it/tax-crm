import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function getHouseholdName(persons: { role: string | null; firstName: string | null; lastName: string | null }[]): string {
  const primary = persons.find((p) => p.role === "husband" || !p.role) ?? persons[0];
  const secondary = persons.find((p) => p.role === "wife");
  if (!primary) return "—";
  const name = `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() || "—";
  if (secondary) {
    const spouse = `${secondary.firstName ?? ""} ${secondary.lastName ?? ""}`.trim();
    if (spouse) return `${name} / ${spouse}`;
  }
  return name;
}

function getSpouseName(persons: { role: string | null; firstName: string | null; lastName: string | null }[]): string {
  const spouse = persons.find((p) => p.role === "wife");
  if (!spouse) return "—";
  return `${spouse.firstName ?? ""} ${spouse.lastName ?? ""}`.trim() || "—";
}

function getPhone(persons: { phone: string | null }[]): string {
  for (const p of persons) {
    if (p.phone) return p.phone;
  }
  return "—";
}

function getMainId(persons: { idNumber: string | null }[]): string {
  return persons[0]?.idNumber ?? "—";
}

function safeFileName(name: string): string {
  return name.replace(/[/\\?*:[\]]/g, "-").trim() || "דוח";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const householdId = searchParams.get("householdId");
  const id = householdId ? parseInt(householdId, 10) : NaN;
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Missing or invalid householdId" }, { status: 400 });
  }

  try {
    const household = await prisma.household.findUnique({
      where: { id },
      include: { agent: true, persons: true },
    });
    if (!household) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const clientName = getHouseholdName(household.persons);
    const headers = ["משק בית / לקוח", "בן/בת זוג", "טלפון", "ת.ז.", "סוכן", "סטטוס"];
    const sheetData = [
      headers,
      [
        getHouseholdName(household.persons),
        getSpouseName(household.persons),
        getPhone(household.persons),
        getMainId(household.persons),
        household.agent?.name ?? "—",
        household.generalStatus ?? "—",
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "דוח");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = `דוח - ${safeFileName(clientName)}.xlsx`;
    const encoded = encodeURIComponent(fileName);

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
      },
    });
  } catch (e) {
    console.error("Export single error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

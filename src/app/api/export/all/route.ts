import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `reports-export-${dateStr}.xlsx`;

  try {
    const wb = XLSX.utils.book_new();

    const households = await prisma.household.findMany({
      orderBy: { createdAt: "desc" },
      include: { agent: true, persons: true },
    });
    const clientsHeaders = ["משק בית / לקוח", "בן/בת זוג", "טלפון", "ת.ז.", "סוכן", "סטטוס"];
    const clientsData = [
      clientsHeaders,
      ...households.map((h) => [
        getHouseholdName(h.persons),
        getSpouseName(h.persons),
        getPhone(h.persons),
        getMainId(h.persons),
        h.agent?.name ?? "—",
        h.generalStatus ?? "—",
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(clientsData), "לקוחות");

    const refunds = await prisma.tblRefund.findMany({
      orderBy: { dateCreated: "desc" },
      include: { client: true, status: true },
    });
    const refundsHeaders = ["לקוח", "שנה", "סכום", "סטטוס", "הוגש"];
    const refundsData = [
      refundsHeaders,
      ...refunds.map((r) => [
        `${r.client.clientName ?? ""} ${r.client.lastName ?? ""}`.trim() || "—",
        r.yearId,
        r.amountRefund != null ? formatCurrency(r.amountRefund) : "—",
        r.status?.statusName ?? "—",
        formatDate(r.dateSubmission),
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(refundsData), "החזרים");

    const agents = await prisma.tblAgent.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { clients: true } } },
    });
    const agentsHeaders = ["שם", "איש קשר", "עמלת פתיחת תיק", "עמלת החזר", "לקוחות"];
    const agentsData = [
      agentsHeaders,
      ...agents.map((a) => [
        a.name ?? "—",
        a.mobile ?? a.email ?? "—",
        a.cp != null ? formatCurrency(a.cp) : "—",
        a.cp2 != null ? `${a.cp2}%` : "—",
        a._count.clients,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(agentsData), "סוכנים");

    const clerks = await prisma.tblClerk.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { clients: true } } },
    });
    const clerksHeaders = ["שם", "איש קשר", "לקוחות"];
    const clerksData = [
      clerksHeaders,
      ...clerks.map((c) => [
        c.name ?? "—",
        c.mobile ?? c.email ?? "—",
        c._count.clients,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(clerksData), "פקידים");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Export all error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

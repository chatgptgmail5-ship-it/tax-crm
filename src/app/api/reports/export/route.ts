import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import * as XLSX from "xlsx";

type ReportType = "1" | "2" | "3";

function toDateBounds(fromDate: string | null, toDate: string | null) {
  const gte = fromDate ? new Date(fromDate) : undefined;
  const lte = toDate ? new Date(`${toDate}T23:59:59.999`) : undefined;
  return { gte, lte };
}

function fileNameForReport(reportType: ReportType, report2Mode: string) {
  if (reportType === "1") return "דוח לקוחות חדשים.xlsx";
  if (reportType === "2") return report2Mode === "received" ? "דוח החזרים שהתקבלו.xlsx" : "דוח החזרים שהוגשו.xlsx";
  return "דוח החזרים לפי סטטוס.xlsx";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const reportType = (searchParams.get("reportType") ?? "1") as ReportType;
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const report2Mode = searchParams.get("report2Mode") ?? "submitted";
  const statusName = searchParams.get("statusName");
  const { gte, lte } = toDateBounds(fromDate, toDate);

  const headers = ["שם לקוח", "שנה", "סכום ההחזר", "סטטוס", "ת. הגשה", "ת. קבלת ההחזר"];
  let rows: (string | number | null)[][] = [];

  if (reportType === "1") {
    const households = await prisma.household.findMany({
      where: { createdAt: { gte, lte } },
      include: { persons: true },
      orderBy: { createdAt: "desc" },
    });
    rows = households.map((h) => {
      const primary = h.persons.find((p) => p.role === "husband" || !p.role) ?? h.persons[0];
      const spouse = h.persons.find((p) => p.role === "wife");
      const name = primary ? `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() : "—";
      const spouseName = spouse ? `${spouse.firstName ?? ""} ${spouse.lastName ?? ""}`.trim() : "";
      return [spouseName ? `${name} / ${spouseName}` : name || "—", null, null, "לקוח חדש", formatDate(h.createdAt), "—"];
    });
  } else {
    const dateField = report2Mode === "received" ? "dateRefund" : "dateSubmission";
    const refundWhere =
      reportType === "2"
        ? { [dateField]: { gte, lte } }
        : {
            ...(statusName ? { status: { statusName } } : {}),
            dateSubmission: { gte, lte },
          };

    const refunds = await prisma.tblRefund.findMany({
      where: refundWhere,
      include: {
        client: { select: { clientName: true, lastName: true } },
        status: true,
      },
      orderBy: { dateCreated: "desc" },
    });
    rows = refunds.map((r) => [
      `${r.client?.clientName ?? ""} ${r.client?.lastName ?? ""}`.trim() || "—",
      r.yearId,
      r.amountRefund != null ? formatCurrency(r.amountRefund) : "—",
      r.status?.statusName ?? "—",
      formatDate(r.dateSubmission),
      formatDate(r.dateRefund),
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "דוח");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = fileNameForReport(reportType, report2Mode);
  const encoded = encodeURIComponent(filename);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
    },
  });
}


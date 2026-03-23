import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ReportType = "1" | "2" | "3";

function toDateBounds(fromDate: string | null, toDate: string | null) {
  const gte = fromDate ? new Date(fromDate) : undefined;
  const lte = toDate ? new Date(`${toDate}T23:59:59.999`) : undefined;
  return { gte, lte };
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

  if (reportType === "1") {
    const households = await prisma.household.findMany({
      where: {
        createdAt: { gte, lte },
      },
      include: { persons: true },
      orderBy: { createdAt: "desc" },
    });
    const rows = households.map((h) => {
      const primary = h.persons.find((p) => p.role === "husband" || !p.role) ?? h.persons[0];
      const spouse = h.persons.find((p) => p.role === "wife");
      const name = primary ? `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() : "—";
      const spouseName = spouse ? `${spouse.firstName ?? ""} ${spouse.lastName ?? ""}`.trim() : "";
      return {
        clientName: spouseName ? `${name} / ${spouseName}` : name || "—",
        idNumber: primary?.idNumber ?? "—",
        phone: primary?.phone ?? "—",
        city: h.city ?? "—",
        year: null,
        amountRefund: null,
        status: "לקוח חדש",
        dateSubmission: h.createdAt.toISOString(),
        intakeDate: h.createdAt.toISOString(),
        dateRefund: null,
      };
    });
    return NextResponse.json({ rows });
  }

  const dateField = report2Mode === "received" ? "dateRefund" : "dateSubmission";
  const refundWhere =
    reportType === "2"
      ? {
          [dateField]: { gte, lte },
        }
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

  const rows = refunds.map((r) => ({
    clientName: `${r.client?.clientName ?? ""} ${r.client?.lastName ?? ""}`.trim() || "—",
    year: r.yearId ?? null,
    amountRefund: r.amountRefund ?? null,
    status: r.status?.statusName ?? "—",
    dateSubmission: r.dateSubmission ? r.dateSubmission.toISOString() : null,
    dateRefund: r.dateRefund ? r.dateRefund.toISOString() : null,
  }));

  return NextResponse.json({ rows });
}


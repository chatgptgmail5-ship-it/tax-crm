"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";

type ExportType = "all" | "clients" | "refunds" | "agents" | "clerks";

export function ExportExcelButton({ type }: { type: ExportType }) {
  const href = type === "all" ? "/api/export/all" : `/api/export/${type}`;
  const label = type === "all" ? "ייצוא" : "ייצוא לאקסל";
  return (
    <Link
      href={href}
      className="btn btn-secondary flex items-center gap-2"
      download
    >
      <FileDown className="h-4 w-4" />
      {label}
    </Link>
  );
}

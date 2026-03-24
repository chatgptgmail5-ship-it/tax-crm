import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Display date as DD/MM/YYYY (local format). */
export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** ISO yyyy-mm-dd (date part) → dd/MM/yyyy for text inputs (no timezone shift). */
export function isoToDdMmYyyy(iso: string | null | undefined): string {
  if (!iso) return "";
  const part = String(iso).split("T")[0];
  const parts = part.split("-");
  if (parts.length !== 3) return "";
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return "";
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/** User text dd/MM/yyyy (also . or - separators) → ISO yyyy-mm-dd. */
export function parseDdMmYyyyToIso(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/[/.-]/).map((p) => parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return "";
  const [dd, mm, yyyyRaw] = parts;
  const yyyy = yyyyRaw >= 100 ? yyyyRaw : yyyyRaw + 2000;
  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return "";
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Hebrew-friendly display: date + time in local timezone.
 * Format: DD/MM/YYYY, HH:mm (24h, leading zeros, comma + space before time).
 */
export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const datePart = formatDate(date);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${datePart}, ${hour}:${minute}`;
}

export function formatCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(v);
}

export function formatNumber(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("he-IL").format(v);
}

/** Strip to digits only for phone; format Israeli style (e.g. 050-1234567). */
export function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/** On change: keep only digits, optionally format. Returns raw digits for storage. */
export function phoneInputValue(value: string): string {
  return value.replace(/\D/g, "");
}

/** Format phone for display in input (Israeli: 050-1234567). */
export function phoneDisplayValue(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/** License: digits only. */
export function licenseInputValue(value: string): string {
  return value.replace(/\D/g, "");
}

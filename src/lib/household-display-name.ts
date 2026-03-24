/** Primary client label: registered partner / first person (same idea as clients list). */
export function householdDisplayName(
  persons: { role: string | null; firstName: string | null; lastName: string | null }[]
): string {
  const primary = persons.find((p) => p.role === "husband" || !p.role) ?? persons[0];
  if (!primary) return "—";
  return `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim() || "—";
}

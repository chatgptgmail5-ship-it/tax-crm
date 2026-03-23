export type UserRole = "admin" | "clerk" | "viewer";

export function isAdmin(role: string | undefined): boolean {
  return role === "admin";
}

export function canEdit(role: string | undefined): boolean {
  return role === "admin" || role === "clerk";
}

export function requireCanEdit(role: string | undefined): boolean {
  if (role === "viewer") return false;
  return role === "admin" || role === "clerk";
}

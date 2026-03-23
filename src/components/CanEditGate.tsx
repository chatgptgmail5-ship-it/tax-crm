"use client";

import { useCanEdit } from "@/hooks/useCanEdit";

export function CanEditGate({ children }: { children: React.ReactNode }) {
  const canEdit = useCanEdit();
  if (!canEdit) return null;
  return <>{children}</>;
}

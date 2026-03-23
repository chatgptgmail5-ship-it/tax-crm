"use client";

import { useSession } from "next-auth/react";
import { canEdit } from "@/lib/roles";

export function useCanEdit(): boolean {
  const { data: session } = useSession();
  return canEdit(session?.user?.role);
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthPage = pathname === "/login" || pathname === "/setup";
  const isPublicPage = pathname?.startsWith("/questionnaire/");

  useEffect(() => {
    if (status === "loading") return;
    if (isAuthPage) {
      if (session) router.replace("/");
      return;
    }
    if (isPublicPage) return;
    if (!session) {
      router.replace("/login");
    }
  }, [status, session, isAuthPage, isPublicPage, router, pathname]);

  if (isAuthPage) {
    if (session) return null;
    return <>{children}</>;
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (status === "loading" || !session) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar className="print:hidden" />
      <main className="min-w-0 flex-1 overflow-auto bg-ink-50 p-6 lg:p-8 print:p-0 print:bg-white">{children}</main>
    </div>
  );
}

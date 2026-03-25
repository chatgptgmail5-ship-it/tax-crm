"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileBarChart2,
  UserCog,
  Receipt,
  FileStack,
  Shield,
  LogOut,
  Bell,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useQuestionnaireNotifications } from "@/contexts/QuestionnaireNotificationsContext";

const nav = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/clients", label: "לקוחות", icon: Users },
  { href: "/refunds", label: "החזרים", icon: Receipt },
  { href: "/reports", label: "דוחות", icon: FileBarChart2 },
  { href: "/documents/generator", label: "מחולל מסמכים", icon: FileText },
  { href: "/documents", label: "סוגי מסמכים", icon: FileStack },
  { href: "/notes", label: "הערות", icon: StickyNote },
  { href: "/agents", label: "סוכנים", icon: UserCog },
  { href: "/users", label: "משתמשים", icon: Shield },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { hasUnread } = useQuestionnaireNotifications();
  const [hasOpenNotes, setHasOpenNotes] = useState(false);

  const fetchNotesBell = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/notes?bell=1");
      if (!res.ok) return;
      const data = (await res.json()) as { hasOpen?: boolean };
      setHasOpenNotes(data.hasOpen === true);
    } catch {
      setHasOpenNotes(false);
    }
  }, [session?.user]);

  useEffect(() => {
    void fetchNotesBell();
    const t = setInterval(() => void fetchNotesBell(), 45_000);
    return () => clearInterval(t);
  }, [fetchNotesBell]);

  useEffect(() => {
    const onNotesChanged = () => void fetchNotesBell();
    window.addEventListener("notes-changed", onNotesChanged);
    return () => window.removeEventListener("notes-changed", onNotesChanged);
  }, [fetchNotesBell]);

  return (
    <aside className={cn("flex w-56 shrink-0 flex-col border-e border-ink-200 bg-white", className)}>
      <div className="flex h-14 items-center border-b border-ink-200 px-4">
        <Link href="/" prefetch className="flex items-center gap-2 font-semibold text-ink-900">
          <span className="relative h-8 w-8 shrink-0">
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="object-contain"
              unoptimized
            />
          </span>
          ניהול לקוחות מס
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary-50 text-primary-700" : "text-ink-600 hover:bg-primary-50 hover:text-primary-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.href === "/clients" && hasUnread ? (
                <Bell className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="שאלונים חדשים" title="שאלונים חדשים" />
              ) : null}
              {item.href === "/notes" && hasOpenNotes ? (
                <Bell className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="הערות פתוחות" title="הערות פתוחות" />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink-200 p-3">
        <p className="mb-2 truncate px-3 text-xs text-ink-500">{session?.user?.email}</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-primary-50 hover:text-primary-700"
        >
          <LogOut className="h-4 w-4" />
          התנתק
        </button>
      </div>
    </aside>
  );
}

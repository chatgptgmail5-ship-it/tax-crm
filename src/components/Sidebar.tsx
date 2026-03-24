"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useQuestionnaireNotifications } from "@/components/QuestionnaireNotificationsProvider";

const nav = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/clients", label: "לקוחות", icon: Users },
  { href: "/refunds", label: "החזרים", icon: Receipt },
  { href: "/reports", label: "דוחות", icon: FileBarChart2 },
  { href: "/agents", label: "סוכנים", icon: UserCog },
  { href: "/documents/generator", label: "מחולל מסמכים", icon: FileText },
  { href: "/documents", label: "סוגי מסמכים", icon: FileStack },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { unreadCount } = useQuestionnaireNotifications();

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
          const showQuestionnaireBell = item.href === "/clients" && unreadCount > 0;
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
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">{item.label}</span>
              {showQuestionnaireBell && (
                <span className="relative inline-flex shrink-0" title="שאלון ממתין לצפייה">
                  <Bell className="h-4 w-4 text-ink-600" strokeWidth={2} />
                  <span className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
                </span>
              )}
            </Link>
          );
        })}
        <Link
          href="/users"
          prefetch
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/users" ? "bg-primary-50 text-primary-700" : "text-ink-600 hover:bg-primary-50 hover:text-primary-700"
          )}
        >
          <Shield className="h-4 w-4" />
          משתמשים
        </Link>
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

import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { LayoutShell } from "@/components/LayoutShell";
import { QuestionnaireNotificationsProvider } from "@/components/QuestionnaireNotificationsProvider";

export const metadata: Metadata = {
  title: "ניהול לקוחות מס",
  description: "מערכת ניהול לקוחות יועץ מס",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen antialiased">
        <SessionProvider>
          <QuestionnaireNotificationsProvider>
            <LayoutShell>{children}</LayoutShell>
          </QuestionnaireNotificationsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { LayoutShell } from "@/components/LayoutShell";
import { QuestionnaireUnreadProvider } from "@/contexts/QuestionnaireUnreadContext";

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
          <QuestionnaireUnreadProvider>
            <LayoutShell>{children}</LayoutShell>
          </QuestionnaireUnreadProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

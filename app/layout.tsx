import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell } from "@/components/layout/page-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { AppStorageProvider } from "@/components/providers/app-storage-provider";
import { AppModeProvider } from "@/components/providers/app-mode-provider";
import { ChildStorageProvider } from "@/components/providers/child-storage-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { SupabaseSyncStatus } from "@/components/dev/supabase-sync-status";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { ReminderProvider } from "@/components/providers/reminder-provider";
import { ReminderToast } from "@/components/reminders/reminder-toast";
import { SaveToaster } from "@/components/ui/save-toast";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Baby Monitor",
  description:
    "Track your baby's profile, Baby Plus listening program, and kick activity — all saved locally on your device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <LocaleProvider>
          <AppModeProvider>
          <SupabaseProvider>
            <AppStorageProvider>
              <ChildStorageProvider>
              <ReminderProvider>
              <SiteHeader />
              <SaveToaster />
              <PageShell>{children}</PageShell>
              <BottomNav />
              <ReminderToast />
              <SupabaseSyncStatus />
              </ReminderProvider>
              </ChildStorageProvider>
            </AppStorageProvider>
          </SupabaseProvider>
          </AppModeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

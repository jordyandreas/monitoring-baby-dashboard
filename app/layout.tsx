import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell } from "@/components/layout/page-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { AppStorageProvider } from "@/components/providers/app-storage-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { ReminderProvider } from "@/components/providers/reminder-provider";
import { ReminderToast } from "@/components/reminders/reminder-toast";
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
          <AppStorageProvider>
            <ReminderProvider>
              <SiteHeader />
              <PageShell>{children}</PageShell>
              <BottomNav />
              <ReminderToast />
            </ReminderProvider>
          </AppStorageProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { QuickLogFab } from "@/components/child/quick-log-fab";
import { LoginDialog } from "@/components/layout/account-dialog";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell } from "@/components/layout/page-shell";
import { RequireLogin } from "@/components/layout/require-login";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppModeProvider } from "@/components/providers/app-mode-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { SupabaseSyncStatus } from "@/components/dev/supabase-sync-status";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { SaveToaster } from "@/components/ui/save-toast";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  applicationName: "Nurtory",
  title: {
    default: "Nurtory",
    template: "%s · Nurtory",
  },
  description: "Keep your little one's journey, from pregnancy through childhood.",
  appleWebApp: {
    capable: true,
    title: "Nurtory",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Nurtory",
    description: "Keep your little one's journey, from pregnancy through childhood.",
    siteName: "Nurtory",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${nunito.variable} h-full overflow-x-clip`}>
      <body className="flex min-h-dvh w-full min-w-0 max-w-full flex-col overflow-x-clip font-sans antialiased">
        <LocaleProvider>
          <AppModeProvider>
          <SupabaseProvider>
              <SiteHeader />
              <RequireLogin />
              <LoginDialog />
              <SaveToaster />
              <PageShell>{children}</PageShell>
              <SiteFooter />
              <BottomNav />
              <QuickLogFab />
              <SupabaseSyncStatus />
          </SupabaseProvider>
          </AppModeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

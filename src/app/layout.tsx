import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { UpdatePrompt } from "@/components/layout/update-prompt";
import { GlobalSearch } from "@/components/search/global-search";
import { NotificationPermissionPrompt } from "@/components/notifications/notification-permission-prompt";
import { LangProvider } from "@/lib/i18n/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyPlanerTicket",
  description: "Персональный трекер задач",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Planer",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const themeScript = `
  (function() {
    document.documentElement.classList.add('dark');
  })();
`;

const swScript = `
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
      navigator.serviceWorker.register("/sw.js").then(function(registration) {
        setInterval(function() {
          registration.update();
        }, 60 * 1000);
      }).catch(function() {});
    });
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <LangProvider>
            <AuthProvider>
              <AuthGuard>
                <AppShell>{children}</AppShell>
              </AuthGuard>
              <UpdatePrompt />
              <NotificationPermissionPrompt />
              <GlobalSearch />
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

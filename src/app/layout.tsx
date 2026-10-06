import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/acewears/service-worker-registrar";
import { PwaInstallBanner } from "@/components/acewears/pwa-install-banner";
import { ThemeInitializer } from "@/components/acewears/theme-initializer";
import { SplashLoader } from "@/components/acewears/splash-loader";
import { LiveChatWidget } from "@/components/acewears/live-chat-widget";
import { AppUpdateChecker } from "@/components/acewears/app-update-checker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AceWears — Threads Reimagined",
  description: "High-density adult apparel e-commerce. Shoppable reels, AI fit assistant, verified reviews, and circular trade-in.",
  applicationName: "AceWears",
  keywords: ["AceWears", "fashion", "apparel", "AI fit", "shoppable reels", "trade-in"],
  authors: [{ name: "AceWears" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/acewears-icon.svg",
    shortcut: "/acewears-icon.svg",
    apple: "/acewears-icon.svg",
  },
  openGraph: {
    title: "AceWears — Threads Reimagined",
    description: "Shoppable reels, AI fit assistant, verified reviews, and circular trade-in.",
    siteName: "AceWears",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AceWears",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1128",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A1128" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SplashLoader />
        <ThemeInitializer />
        {children}
        <Toaster />
        <SonnerToaster position="bottom-center" richColors closeButton />
        <ServiceWorkerRegistrar />
        <PwaInstallBanner />
        <AppUpdateChecker />
        <LiveChatWidget />
      </body>
    </html>
  );
}

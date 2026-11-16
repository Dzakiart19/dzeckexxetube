import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/SonnerToaster";
import { PUBLIC_MIN_AGE, PUBLIC_SITE_NAME } from "@/lib/public-config";
import { siteUrl } from "@/lib/urls";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${PUBLIC_SITE_NAME} — Temukan video 18+ dari sumber terverifikasi`,
    template: `%s · ${PUBLIC_SITE_NAME}`,
  },
  description:
    `Jelajahi koleksi video dewasa berdasarkan kategori dan folder. Hanya untuk pengguna berusia ${PUBLIC_MIN_AGE} tahun ke atas. ` +
    `${PUBLIC_SITE_NAME} adalah platform penemuan; konten disajikan dari sumber pihak ketiga yang terverifikasi.`,
  applicationName: PUBLIC_SITE_NAME,
  keywords: ["video dewasa 18+", "katalog video", "sumber terverifikasi", "penemuan video"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: PUBLIC_SITE_NAME,
    locale: "id_ID",
    url: "/",
    title: `${PUBLIC_SITE_NAME} — Temukan video 18+ dari sumber terverifikasi`,
    description:
      "Platform penemuan video dewasa dari sumber terverifikasi, lengkap dengan age gate 18+, moderasi aktif, dan kanal pelaporan.",
  },
  twitter: {
    card: "summary",
    title: `${PUBLIC_SITE_NAME} — Temukan video 18+ dari sumber terverifikasi`,
    description:
      "Platform penemuan video dewasa dari sumber terverifikasi, lengkap dengan age gate 18+, moderasi aktif, dan kanal pelaporan.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0f17",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/SonnerToaster";
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
    default: "videytube - Streaming video minimalis",
    template: "%s · videytube",
  },
  description:
    "Antarmuka streaming video minimalis untuk menjelajahi koleksi folder dan memutar video langsung di browser. videytube tidak mengklaim kepemilikan atas konten pihak ketiga.",
  applicationName: "videytube",
  keywords: ["streaming video", "pemutar video", "nonton online", "koleksi video"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "videytube",
    locale: "id_ID",
    url: "/",
    title: "videytube - Streaming video minimalis",
    description:
      "Jelajahi koleksi folder dan putar video langsung di browser dengan antarmuka yang ringan dan bersih.",
  },
  twitter: {
    card: "summary",
    title: "videytube - Streaming video minimalis",
    description:
      "Jelajahi koleksi folder dan putar video langsung di browser dengan antarmuka yang ringan dan bersih.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0c10",
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

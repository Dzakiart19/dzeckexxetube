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

/**
 * Site-wide SEO configuration. The copy targets the Indonesian 18+ viral
 * video niche ("porn indo viral terbaru") the same way professional adult
 * tube sites structure their metadata: keyword-rich title, descriptive
 * meta description, complete keyword set, adult rating label, and
 * structured data for search engines.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "videytube - Nonton Video Viral Indo 18+ Terbaru",
    template: "%s | videytube",
  },
  description:
    "Nonton video viral indo 18+ terbaru gratis di videytube. Koleksi porn indo viral terlengkap dan video dewasa terbaru, diperbarui setiap hari. Streaming cepat, ringan, dan langsung dari browser tanpa gangguan.",
  applicationName: "videytube",
  keywords: [
    "video viral indo",
    "porn indo",
    "porn indo viral",
    "video viral terbaru",
    "video 18+ terbaru",
    "nonton video dewasa",
    "video dewasa indo",
    "video 18+ indo",
    "viral indo terbaru",
    "streaming video 18+",
    "koleksi video viral",
    "video dewasa terbaru",
  ],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/feed.xml" },
  },
  openGraph: {
    type: "website",
    siteName: "videytube",
    locale: "id_ID",
    url: "/",
    title: "videytube - Nonton Video Viral Indo 18+ Terbaru",
    description:
      "Koleksi video viral indo 18+ terbaru, diperbarui setiap hari. Nonton langsung di browser dengan streaming cepat dan ringan.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "videytube - Nonton Video Viral Indo 18+ Terbaru",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "videytube - Nonton Video Viral Indo 18+ Terbaru",
    description:
      "Koleksi video viral indo 18+ terbaru, diperbarui setiap hari. Nonton langsung di browser dengan streaming cepat dan ringan.",
    images: ["/og-default.png"],
  },
  // Site-ownership verification meta tags for Google Search Console, Bing
  // Webmaster Tools, and Yandex. Values are injected only when the matching
  // environment variable is configured so nothing is hardcoded.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Adult-content rating labels so search engines and filtering tools
  // classify the site correctly. The RTA-5042 code is the industry-standard
  // Restricted To Adults label (ASACP) used by professional adult tube
  // sites; parental-control filters and safe-search systems read it.
  other: {
    rating: "RTA-5042-1996-1400-1577-RTA",
  },
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
        {/* Structured data so search engines understand the site entity and
            can surface a site search box for the brand. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "videytube",
              alternateName: "videytube.asia",
              url: siteUrl() + "/",
              description:
                "Koleksi video viral indo 18+ terbaru. Nonton video dewasa terlengkap langsung di browser, cepat dan tanpa gangguan.",
              inLanguage: "id-ID",
              isFamilyFriendly: false,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl()}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { HomeView } from "@/components/home/HomeView";

export const metadata: Metadata = {
  // No explicit title: the root layout's `title.default`
  // ("videytube - Nonton Video Viral Indo 18+ Terbaru") applies to the home page.
  description:
    "Nonton video viral indo 18+ terbaru gratis di videytube. Koleksi porn indo viral dan video dewasa terlengkap, diperbarui setiap hari. Streaming cepat dan langsung dari browser.",
  keywords: [
    "video viral indo",
    "porn indo viral",
    "video viral terbaru",
    "video 18+ terbaru",
    "nonton video dewasa",
    "viral indo terbaru",
  ],
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeView />;
}

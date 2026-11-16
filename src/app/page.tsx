import type { Metadata } from "next";
import { HomeView } from "@/components/home/HomeView";

export const metadata: Metadata = {
  // No explicit title: the root layout's `title.default`
  // ("videytube - Streaming video minimalis") applies to the home page.
  description:
    "Jelajahi koleksi folder dan putar video langsung di browser dengan antarmuka streaming yang ringan dan bersih. videytube tidak mengklaim kepemilikan atas konten pihak ketiga.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeView />;
}

import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  // 800 was listed but never used — font-extrabold appears nowhere in src.
  // Each listed weight is a separate woff2 the browser fetches.
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Salman Perfumes — me. Eau de Parfum",
  description:
    "Six eaux de parfum, no fillers: Imperial, Orchid, Akhdar, Oud Lavender, Lather and Latheer. Made to be worn.",
  icons: {
    icon: "/logo/favicon-192.png",
    apple: "/logo/favicon-512.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}

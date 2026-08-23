import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteOrigin = process.env.SITE_ORIGIN ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: "Didanix Atlas | Radiological anatomy, understood", template: "%s | Didanix Atlas" },
  description: "Explore clinician-reviewed radiological anatomy and learn through interactive courses. For education and research only.",
  openGraph: {
    title: "Didanix Atlas",
    description: "Radiological anatomy, understood.",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Didanix Atlas — Radiological anatomy, understood." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Didanix Atlas",
    description: "Radiological anatomy, understood.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

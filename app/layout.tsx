import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-atlas-mono", subsets: ["latin"] });
const siteOrigin = process.env.SITE_ORIGIN ?? "http://localhost:3000";

export const metadata: Metadata = {
  applicationName: "Elivion Didanix Atlas",
  metadataBase: new URL(siteOrigin),
  title: { default: "Didanix Atlas by Elivion | Radiological anatomy, understood", template: "%s | Didanix Atlas by Elivion" },
  description: "Explore clinician-reviewed radiological anatomy and learn through interactive courses. For education and research only.",
  icons: { icon: "/elivion-logo.png", shortcut: "/elivion-logo.png" },
  openGraph: {
    siteName: "Elivion Didanix Atlas",
    title: "Elivion · Didanix Atlas",
    description: "Radiological anatomy, understood.",
    type: "website",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "Elivion Didanix Atlas — Radiological anatomy, understood." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elivion · Didanix Atlas",
    description: "Radiological anatomy, understood.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geistMono.variable}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

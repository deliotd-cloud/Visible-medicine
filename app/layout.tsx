import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-atlas-mono", subsets: ["latin"] });
const siteOrigin = process.env.SITE_ORIGIN ?? "http://localhost:3000";

export const metadata: Metadata = {
  applicationName: "Elivion Education",
  metadataBase: new URL(siteOrigin),
  title: { default: "Elivion Education | Learn imaging. Teach with cases.", template: "%s | Elivion Education" },
  description: "Explore radiological anatomy, take guided courses and create secure institutional imaging education. For education and research only.",
  icons: { icon: "/elivion-logo.png", shortcut: "/elivion-logo.png" },
  openGraph: {
    siteName: "Elivion Education",
    title: "Elivion Education",
    description: "Learn imaging. Teach with cases.",
    type: "website",
    images: [{ url: "/og.png", width: 1727, height: 911, alt: "Elivion Education — Atlas, Courses and Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elivion Education",
    description: "Learn imaging. Teach with cases.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geistMono.variable}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

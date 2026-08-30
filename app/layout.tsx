import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { SplashScreen } from "../components/SplashScreen";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-atlas-mono", subsets: ["latin"] });
const siteOrigin = process.env.SITE_ORIGIN ?? "https://visiblemedicine.com";

export const metadata: Metadata = {
  applicationName: "Visible Medicine",
  metadataBase: new URL(siteOrigin),
  title: { default: "Visible Medicine | Learn imaging. Teach with cases.", template: "%s | Visible Medicine" },
  description: "Explore radiological anatomy, take guided courses and create secure institutional imaging education. For education and research only.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: {
    siteName: "Visible Medicine",
    title: "Visible Medicine",
    description: "Interactive medical imaging education, by Elivion.",
    type: "website",
    images: [{ url: "/og.png", width: 1727, height: 911, alt: "Visible Medicine — Atlas, Courses and Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visible Medicine",
    description: "Interactive medical imaging education, by Elivion.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var key="visible-medicine-splash-v1";document.documentElement.dataset.visibleMedicineSplash=sessionStorage.getItem(key)?"hidden":"show";}catch(error){document.documentElement.dataset.visibleMedicineSplash="show";}})();` }} />
      </head>
      <body className={geistMono.variable}>
        <SplashScreen />
        <div id="visible-medicine-site-content">
          <a className="skip-link" href="#main-content">Skip to content</a>
          <SiteHeader />
          <div className="intended-use-strip"><span>Education &amp; research only</span><p>No diagnosis, reporting, patient care or clinical decision-making.</p><a href="/intended-use">Read intended use →</a></div>
          <div id="main-content" tabIndex={-1}>{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}

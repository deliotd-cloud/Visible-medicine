import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { SiteFrame } from "../components/SiteFrame";
import { SplashScreen } from "../components/SplashScreen";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-atlas-mono", subsets: ["latin"] });
const siteOrigin = process.env.SITE_ORIGIN ?? "https://visiblemedicine.com";

export const metadata: Metadata = {
  applicationName: "Visible Medicine",
  metadataBase: new URL(siteOrigin),
  title: { default: "Visible Medicine | Where medicine becomes visible.", template: "%s | Visible Medicine" },
  description: "Explore radiological anatomy, take guided courses and create secure institutional imaging education. For education and research only.",
  icons: {
    icon: [
      { url: "/brand/icons/favicon.ico" },
      { url: "/brand/icons/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/icons/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/brand/icons/favicon.ico",
    apple: [{ url: "/brand/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    siteName: "Visible Medicine",
    title: "Visible Medicine — Where medicine becomes visible.",
    description: "Interactive medical imaging education, by Elivion. Learn imaging and teach with cases.",
    type: "website",
    images: [{ url: "/og.png", width: 1727, height: 911, alt: "Visible Medicine — Atlas, Courses and Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visible Medicine — Where medicine becomes visible.",
    description: "Interactive medical imaging education, by Elivion. Learn imaging and teach with cases.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var root=document.documentElement;try{var key="visible-medicine-splash-v5";root.dataset.visibleMedicineSplash=location.pathname==="/"&&!localStorage.getItem(key)?"show":"hidden";}catch(error){root.dataset.visibleMedicineSplash=location.pathname==="/"?"show":"hidden";}if(root.dataset.visibleMedicineSplash==="show")setTimeout(function(){root.dataset.visibleMedicineSplash="hidden";document.body.classList.remove("splash-open");var content=document.getElementById("visible-medicine-site-content");if(content){content.inert=false;content.removeAttribute("aria-hidden");}},10000);})();` }} />
      </head>
      <body className={geistMono.variable}>
        <SplashScreen />
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}

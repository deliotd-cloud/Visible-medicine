import type { Metadata } from "next";
import { SiteFrame } from "../components/SiteFrame";
import { SplashScreen } from "../components/SplashScreen";
import { LocalAtlasDiagnostics } from "../components/LocalAtlasDiagnostics";
import { SPLASH_BOOTSTRAP_SCRIPT } from "../lib/splash-intro";
import { getChatGPTUser } from "./chatgpt-auth";
import { authorizeClinicalReview } from "../lib/clinical-review-server";
import { optionalReviewAvailability } from "../lib/review-destination";
import "./globals.css";
import "./atlas-navigation.css";

const siteOrigin = process.env.SITE_ORIGIN ?? "https://visiblemedicine.com";
// Only request-scoped UI booleans enter the frame, never identities or roles.
// Navigation availability grants no access; destination guards recheck it.
export const dynamic = "force-dynamic";

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const signedIn = (await getChatGPTUser()) !== null;
  // Optional navigation fails closed; review routes and APIs still authorize each request.
  const reviewAvailable = await optionalReviewAvailability(signedIn, authorizeClinicalReview);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="vm-font-mono">
        <SplashScreen />
        <SiteFrame signedIn={signedIn} reviewAvailable={reviewAvailable}>{children}</SiteFrame>
        {process.env.NODE_ENV === "development" && <LocalAtlasDiagnostics enabled />}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <main className="not-found"><p className="section-index">404</p><h1>This anatomy route does not exist.</h1><p>The module may have moved or is not yet published.</p><Link className="primary-button" href="/atlas">Return to the atlas <span>→</span></Link></main>;
}

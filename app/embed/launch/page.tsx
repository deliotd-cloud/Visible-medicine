import type { Metadata } from "next";
import { EmbeddedLaunchRuntime } from "@/components/EmbeddedLaunchRuntime";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Embedded education launch", robots: { index: false, follow: false }, openGraph: { images: [] }, twitter: { images: [] } };

export default async function EmbedLaunchPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <main className="embed-runtime-page"><EmbeddedLaunchRuntime token={(await searchParams).token ?? ""} /></main>;
}

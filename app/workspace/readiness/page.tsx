import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { PilotReadinessPanel } from "@/components/PilotReadinessPanel";
import { getReadinessSnapshot } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pilot readiness", robots: { index: false, follow: false } };
export default async function ReadinessPage() { const user = await requireChatGPTUser("/workspace/readiness"); const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName }; return <main className="inner-page readiness-page"><section className="workspace-hero"><div><p className="eyebrow"><span /> Non-live configuration</p><h1>Controlled pilot readiness.</h1><p>Evidence, accountable owners and integration gates in one place. Production activation remains locked.</p></div><Link className="outline-button" href="/workspace">Return to workspace <span>→</span></Link></section><PilotReadinessPanel initialSnapshot={await getReadinessSnapshot(auth)} /></main>; }

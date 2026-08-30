import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { PlatformControlCentre } from "@/components/PlatformControlCentre";
import { getControlCentreSnapshot } from "@/lib/platform-governance";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Institution control centre", description: "Configure an Visible Medicine institution, publishing workflow, entitlements and secure embeds.", robots: { index: false, follow: false } };

export default async function InstitutionControlPage() {
  const user = await requireChatGPTUser("/workspace/control");
  const snapshot = await getControlCentreSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  return <main className="inner-page control-centre-page"><section className="control-hero"><p className="eyebrow"><span /> Institution operations</p><h1>Control centre</h1><p>Tenant configuration, governed atlas publication, commercial intent and signed external delivery—kept separate from every clinical Didanix system.</p></section><PlatformControlCentre initialSnapshot={snapshot} /></main>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { InstitutionPeopleManager } from "@/components/InstitutionPeopleManager";
import { getPeopleSnapshot } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Institution people", robots: { index: false, follow: false } };

export default async function InstitutionPeoplePage() {
  const user = await requireChatGPTUser("/workspace/people"); const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  return <main className="inner-page people-page"><section className="workspace-hero"><div><p className="eyebrow"><span /> Institution administration</p><h1>People, roles and invitations.</h1><p>Organisation-scoped access with held email delivery for the non-live pilot.</p></div><Link className="outline-button" href="/workspace">Return to workspace <span>→</span></Link></section><InstitutionPeopleManager initialSnapshot={await getPeopleSnapshot(auth)} /></main>;
}

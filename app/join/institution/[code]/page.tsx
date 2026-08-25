import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { InvitationAcceptance } from "@/components/InvitationAcceptance";
import { getOrganizationInvitation } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Institution invitation", robots: { index: false, follow: false } };
export default async function InstitutionInvitationPage({ params }: { params: Promise<{ code: string }> }) { const code = (await params).code; const user = await requireChatGPTUser(`/join/institution/${encodeURIComponent(code)}`); const invitation = await getOrganizationInvitation({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName }, code); if (!invitation) notFound(); return <main className="inner-page invitation-page"><InvitationAcceptance token={code} organizationName={invitation.organizationName} role={invitation.role} emailMatches={invitation.emailMatches} /></main>; }

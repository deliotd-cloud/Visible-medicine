import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { AccountDataControls } from "@/components/AccountDataControls";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { exportLearnerData, getNotificationPreferences } from "@/lib/institution-operations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account and data", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  const [data, preferences] = await Promise.all([exportLearnerData(auth), getNotificationPreferences(auth)]);
  const security = data.security as { status?: string; identity_provider?: string; registered_at?: string; last_authenticated_at?: string; terms_version?: string; privacy_version?: string } | null;
  return <main className="inner-page account-page"><section className="workspace-hero"><div><p className="eyebrow"><span /> Education account</p><h1>Your account and data.</h1><p>{user.displayName} · {user.email}</p></div><Link className="outline-button" href="/my-learning">Return to My Learning <span>→</span></Link></section><section className="account-security-summary"><header><p className="section-index">Identity and consent</p><h2>Account status</h2><p>Visible Medicine stores your education profile; authentication and recovery remain with the identity provider.</p></header><dl><div><dt>Status</dt><dd>{security?.status ?? "active"}</dd></div><div><dt>Identity provider</dt><dd>{security?.identity_provider ?? "hosting identity"}</dd></div><div><dt>Terms version</dt><dd>{security?.terms_version || "review required"}</dd></div><div><dt>Privacy version</dt><dd>{security?.privacy_version || "review required"}</dd></div></dl><Link href="/onboarding">Review learner profile →</Link></section><NotificationPreferences initialPreferences={preferences} /><AccountDataControls existingRequests={data.requests as Array<{ id: string; request_type: string; status: string; detail: string; created_at: string; resolved_at: string | null }>} /></main>;
}

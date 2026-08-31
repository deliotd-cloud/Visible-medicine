import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import { getPlatformSnapshot } from "../../db/platform";
import { EmbedOriginManager } from "../../components/EmbedOriginManager";
import { ensureEducationUser } from "@/db/bootstrap";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Workspace", description: "Your Visible Medicine institution, learning and publishing workspace.", robots: { index: false, follow: false } };

export default async function WorkspacePage() {
  const user = await requireChatGPTUser("/workspace");
  const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  const account = await ensureEducationUser(auth);
  if (!account.roles.some((role) => ["instructor", "examiner", "administrator"].includes(role))) redirect("/my-learning");
  const snapshot = await getPlatformSnapshot(auth);
  const storageGb = Math.round(snapshot.entitlement.storageBytes / 1073741824);
  return (
    <main className="inner-page workspace-page">
      <section className="workspace-hero"><div><p className="eyebrow"><span /> Institution workspace</p><h1>{snapshot.organization.name}</h1><p>{user.displayName} · {snapshot.organization.role} · {snapshot.entitlement.status}</p></div><Link className="primary-button" href="/studio/workspace">Open Studio <span>→</span></Link></section>
      <section className="workspace-metrics" aria-label="Workspace usage">
        <div><span>Learners</span><b>{snapshot.usage.learners} / {snapshot.entitlement.learnerLimit}</b></div>
        <div><span>Courses</span><b>{snapshot.usage.courses}</b></div>
        <div><span>Workbooks</span><b>{snapshot.usage.workbooks}</b></div>
        <div><span>Governed media</span><b>{snapshot.usage.governedMedia}</b></div>
      </section>
      <section className="workspace-tools expanded">
        <div><p className="section-index">Invite and organise</p><h2>People &amp; roles</h2><p>Create held-delivery invitation links, import bounded rosters and review organisation membership.</p><Link href="/workspace/people">Manage people →</Link></div>
        <div><p className="section-index">Prepare safely</p><h2>Pilot readiness</h2><p>Record identity, tenancy, content, privacy, accessibility, security and operational evidence.</p><Link href="/workspace/readiness">Open readiness centre →</Link></div>
        <div><p className="section-index">Create and deliver</p><h2>Studio</h2><p>Build courses and workbooks, manage cohorts and prepare governed releases.</p><Link href="/studio/workspace">Open Studio workspace →</Link></div>
        <div><p className="section-index">Measure</p><h2>Reporting</h2><p>Review completion, course reach, publication state and cohort trends.</p><Link href="/studio/analytics">Open Studio analytics →</Link><a href="/api/platform/report">Export progress CSV →</a></div>
        <div><p className="section-index">Configure</p><h2>Integrations</h2><p>Prepare education-only identity, LTI and approved embedded delivery.</p><Link href="/workspace/control#identity">Open integration controls →</Link></div>
        <div><p className="section-index">Govern</p><h2>Atlas publishing</h2><p>Version teaching media, build cited structure annotations and manage independent publication review.</p><Link href="/workspace/control#publishing">Open publishing controls →</Link></div>
        <div><p className="section-index">Administer</p><h2>Institution setup</h2><p>Configure tenant branding, identity metadata, commercial intent and signed external delivery.</p><Link href="/workspace/control">Open control centre →</Link></div>
        <div><p className="section-index">Discover</p><h2>Unified search</h2><p>Find anatomy structures, teaching cases, courses and published workbooks from one place.</p><Link href="/search">Search education content →</Link></div>
      </section>
      <section className="entitlement-panel"><div><p className="section-index">Current entitlement</p><h2>{snapshot.entitlement.plan}</h2><p>{storageGb} GB managed media allowance · {snapshot.entitlement.educatorLimit} educator seats · {snapshot.entitlement.learnerLimit} learner seats</p></div><div className="entitlement-flags"><span className={snapshot.entitlement.atlasAccess ? "enabled" : ""}>Atlas</span><span className={snapshot.entitlement.studioAccess ? "enabled" : ""}>Studio</span><span className={snapshot.entitlement.reportingAccess ? "enabled" : ""}>Reporting</span><span className={snapshot.entitlement.embedsAccess ? "enabled" : ""}>Embeds</span></div></section>
      <section className="publication-register"><div><p className="section-index">Publication register</p><h2>Nothing becomes public by accident.</h2></div><div>{snapshot.publications.map((publication) => <article key={publication.id}><span>{publication.resourceType} · v{publication.version}</span><b>{publication.title}</b><p>{publication.status} · rights {publication.rightsStatus} · de-identification {publication.deidentificationStatus} · specialist review {publication.specialistReviewStatus}</p></article>)}</div></section>
      <EmbedOriginManager initialOrigins={snapshot.embedOrigins} enabled={snapshot.entitlement.embedsAccess && snapshot.educationRoles.includes("administrator")} />
    </main>
  );
}

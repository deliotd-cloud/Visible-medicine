import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { getPlatformSnapshot } from "../../db/platform";
import { EmbedOriginManager } from "../../components/EmbedOriginManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Workspace", description: "Your Elivion Education institution, learning and publishing workspace.", robots: { index: false, follow: false } };

export default async function WorkspacePage() {
  const user = await requireChatGPTUser("/workspace");
  const snapshot = await getPlatformSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const storageGb = Math.round(snapshot.entitlement.storageBytes / 1073741824);
  return (
    <main className="inner-page workspace-page">
      <section className="workspace-hero"><div><p className="eyebrow"><span /> Institution workspace</p><h1>{snapshot.organization.name}</h1><p>{user.displayName} · {snapshot.organization.role} · {snapshot.entitlement.status}</p></div><Link className="primary-button" href="/learn">Open learning workspace <span>→</span></Link></section>
      <section className="workspace-metrics" aria-label="Workspace usage">
        <div><span>Learners</span><b>{snapshot.usage.learners} / {snapshot.entitlement.learnerLimit}</b></div>
        <div><span>Courses</span><b>{snapshot.usage.courses}</b></div>
        <div><span>Workbooks</span><b>{snapshot.usage.workbooks}</b></div>
        <div><span>Governed media</span><b>{snapshot.usage.governedMedia}</b></div>
      </section>
      <section className="workspace-tools">
        <div><p className="section-index">Create and deliver</p><h2>Studio</h2><p>Build workbooks, manage questions, run live teaching and review controlled content.</p><Link href="/learn?view=authoring">Open workbook builder →</Link></div>
        <div><p className="section-index">Measure</p><h2>Reporting</h2><p>Review completion, assessment performance, live participation and cohort trends.</p><Link href="/learn?view=insights">Open progress and insights →</Link></div>
        <div><p className="section-index">Configure</p><h2>Integrations</h2><p>Prepare education-only identity, LTI and approved embedded delivery.</p><Link href="/learn?view=integrations">Open integrations →</Link></div>
      </section>
      <section className="entitlement-panel"><div><p className="section-index">Current entitlement</p><h2>{snapshot.entitlement.plan}</h2><p>{storageGb} GB managed media allowance · {snapshot.entitlement.educatorLimit} educator seats · {snapshot.entitlement.learnerLimit} learner seats</p></div><div className="entitlement-flags"><span className={snapshot.entitlement.atlasAccess ? "enabled" : ""}>Atlas</span><span className={snapshot.entitlement.studioAccess ? "enabled" : ""}>Studio</span><span className={snapshot.entitlement.reportingAccess ? "enabled" : ""}>Reporting</span><span className={snapshot.entitlement.embedsAccess ? "enabled" : ""}>Embeds</span></div></section>
      <section className="publication-register"><div><p className="section-index">Publication register</p><h2>Nothing becomes public by accident.</h2></div><div>{snapshot.publications.map((publication) => <article key={publication.id}><span>{publication.resourceType} · v{publication.version}</span><b>{publication.title}</b><p>{publication.status} · rights {publication.rightsStatus} · de-identification {publication.deidentificationStatus} · specialist review {publication.specialistReviewStatus}</p></article>)}</div></section>
      <EmbedOriginManager initialOrigins={snapshot.embedOrigins} enabled={snapshot.entitlement.embedsAccess && snapshot.educationRoles.includes("administrator")} />
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {NativeDisclosure} from "../../components/NativeDisclosure";
import { redirect } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import { getPlatformSnapshot, PlatformAccessError, type PlatformSnapshot } from "../../db/platform";
import { EmbedOriginManager } from "../../components/EmbedOriginManager";
import { ensureEducationUser } from "@/db/bootstrap";
import { authorizeClinicalReview } from "@/lib/clinical-review-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Workspace", description: "Your Visible Medicine institution, learning and publishing workspace.", robots: { index: false, follow: false } };

export default async function WorkspacePage() {
  const user = await requireChatGPTUser("/workspace");
  const auth = { userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName };
  const account = await ensureEducationUser(auth);
  if (!account.roles.some((role) => ["instructor", "examiner", "administrator"].includes(role))) redirect("/my-learning");
  let snapshot: PlatformSnapshot | null;
  try {
    snapshot = await getPlatformSnapshot(auth);
  } catch (error) {
    if (!(error instanceof PlatformAccessError)) throw error;
    snapshot = null;
  }
  const administrator = account.roles.includes("administrator");
  const studioAvailable = snapshot?.entitlement.studioAccess === true;
  let clinicalReviewAvailable = false;
  if (administrator) {
    try {
      await authorizeClinicalReview();
      clinicalReviewAvailable = true;
    } catch {
      // This optional destination must not block the rest of Workspace.
    }
  }
  if (!snapshot) return (
    <main className="inner-page workspace-page workspace-home">
      <header className="workspace-hero"><div><p className="eyebrow"><span /> Your workspace</p><h1>Workspace access is restricted</h1><p>{user.displayName}</p></div></header>
      <section className="workspace-secondary" aria-label="Institution access">
        <p role="status">An active institution membership and workspace entitlement are required. Ask your institution administrator to check your access.</p>
        <p>You can still open My Learning or browse the Atlas. Atlas, imaging cases and lectures keep their separate access requirements.</p>
      </section>
      <nav className="workspace-destinations" aria-label="Available destinations">
        <Link href="/my-learning"><strong>My Learning</strong><span>Continue learning available to your account.</span></Link>
        <Link href="/atlas"><strong>Browse the Atlas</strong><span>Choose an anatomy region manually.</span></Link>
        {clinicalReviewAvailable && <Link href="/workspace/clinical-review-inbox"><strong>Clinical Review</strong><span>Open independently authorized review work.</span></Link>}
      </nav>
    </main>
  );
  const storageGb = Math.round(snapshot.entitlement.storageBytes / 1073741824);
  return (
    <main className="inner-page workspace-page workspace-home">
      <header className="workspace-hero"><div><p className="eyebrow"><span /> Your workspace</p><h1>Where would you like to go?</h1><p>{snapshot.organization.name} · {user.displayName} · {snapshot.organization.role}</p></div></header>
      <nav className="workspace-destinations" aria-label="Choose your work">
        <Link href="/my-learning"><span className="section-index">01 · Learn</span><strong>My Learning</strong><span>Continue your anatomy, cases and lectures.</span><b aria-hidden="true">→</b></Link>
        {studioAvailable && <Link href="/studio/workspace"><span className="section-index">02 · Create</span><strong>Studio</strong><span>Build courses and workbooks, and prepare teaching delivery.</span><b aria-hidden="true">→</b></Link>}
        {clinicalReviewAvailable && <Link href="/workspace/clinical-review-inbox"><span className="section-index">03 · Review</span><strong>Clinical Review</strong><span>Open outstanding anatomy, teaching and source review work.</span><b aria-hidden="true">→</b></Link>}
      </nav>
      <section className="workspace-secondary" aria-label="Other workspace tools">
        <NativeDisclosure><summary>More learning and review tools</summary><div className="workspace-secondary-links">
          <Link href="/search">Search education content</Link>
          {administrator && <><Link href="/workspace/atlas-review">Browse all review selections</Link><Link href="/learn/fracture-review">Open fracture review</Link></>}
        </div></NativeDisclosure>
        {studioAvailable && <NativeDisclosure><summary>Teaching reports <span>Course participation and learning insight</span></summary><div className="workspace-secondary-links">
          <Link href="/studio/analytics">Studio analytics</Link>
        </div></NativeDisclosure>}
        {administrator && <NativeDisclosure><summary>Administration <span>Institution settings and publishing</span></summary><div className="workspace-secondary-links">
          <Link href="/workspace/people">People &amp; roles</Link>
          <Link href="/workspace/readiness">Pilot readiness</Link>
          <a href="/api/platform/report">Export progress CSV</a>
          <Link href="/workspace/control#identity">Integrations</Link>
          <Link href="/workspace/control#publishing">Atlas publishing controls</Link>
          <Link href="/workspace/control">Institution setup</Link>
        </div><EmbedOriginManager initialOrigins={snapshot.embedOrigins} enabled={snapshot.entitlement.embedsAccess && snapshot.educationRoles.includes("administrator")} /></NativeDisclosure>}
      </section>
      <NativeDisclosure className="workspace-overview"><summary>Institution overview <span>{snapshot.entitlement.plan} · {snapshot.entitlement.status}</span></summary>
        <section className="workspace-metrics" aria-label="Workspace usage">
          <div><span>Learners</span><b>{snapshot.usage.learners} / {snapshot.entitlement.learnerLimit}</b></div>
          <div><span>Courses</span><b>{snapshot.usage.courses}</b></div>
          <div><span>Workbooks</span><b>{snapshot.usage.workbooks}</b></div>
          <div><span>Governed media</span><b>{snapshot.usage.governedMedia}</b></div>
        </section>
        <section className="entitlement-panel"><div><p className="section-index">Current entitlement</p><h2>{snapshot.entitlement.plan}</h2><p>{storageGb} GB managed media allowance · {snapshot.entitlement.educatorLimit} educator seats · {snapshot.entitlement.learnerLimit} learner seats</p></div><div className="entitlement-flags"><span className={snapshot.entitlement.atlasAccess ? "enabled" : ""}>Atlas</span><span className={snapshot.entitlement.studioAccess ? "enabled" : ""}>Studio</span><span className={snapshot.entitlement.reportingAccess ? "enabled" : ""}>Reporting</span><span className={snapshot.entitlement.embedsAccess ? "enabled" : ""}>Embeds</span></div></section>
        <section className="publication-register"><div><p className="section-index">Publication register</p><h2>Nothing becomes public by accident.</h2></div><div>{snapshot.publications.map((publication) => <article key={publication.id}><span>{publication.resourceType} · v{publication.version}</span><b>{publication.title}</b><p>{publication.status} · rights {publication.rightsStatus} · de-identification {publication.deidentificationStatus} · specialist review {publication.specialistReviewStatus}</p></article>)}</div></section>
      </NativeDisclosure>
    </main>
  );
}

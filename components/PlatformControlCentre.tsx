"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type Snapshot = {
  platform: {
    organization: { id: string; name: string; role: string };
    entitlement: { plan: string; learnerLimit: number; educatorLimit: number; storageBytes: number; atlasAccess: boolean; studioAccess: boolean; reportingAccess: boolean; embedsAccess: boolean; status: string };
    embedOrigins: Array<{ origin: string; status: string }>;
  };
  profile: null | { displayName: string; primaryColor: string; accentColor: string; logoUrl: string; customDomain: string; supportContact: string; onboardingStage: string; updatedAt: string };
  identities: Array<{ id: string; protocol: string; issuer: string; clientId: string; metadataUrl: string; status: string; version: number; updatedAt: string }>;
  ingestions: Array<{ id: string; title: string; detectedType: string; status: string; deidentified: boolean; publicationCleared: boolean; contentHash: string; createdAt: string }>;
  publications: Array<{ id: string; slug: string; title: string; region: string; modality: string; orientation: string; sourceStatement: string; status: string; rightsStatus: string; deidentificationStatus: string; specialistReviewStatus: string; version: number; contentHash: string; ingestionJobId: string | null; createdBy: string; reviewerId: string | null; reviewNotes: string; updatedAt: string; publishedAt: string | null }>;
  annotations: Array<{ id: string; publicationVersionId: string; structureName: string; synonyms: string[]; description: string; relationships: string[]; citations: string[]; sliceStart: number; sliceEnd: number; status: string; version: number; updatedAt: string }>;
  reviews: Array<{ id: string; publicationVersionId: string; reviewerName: string; decision: string; notes: string; createdAt: string }>;
  billing: null | { provider: string; billingContact: string; currency: string; taxCountry: string; status: string; version: number; updatedAt: string };
  subscriptions: Array<{ id: string; planCode: string; status: string; learnerSeats: number; educatorSeats: number; storageBytes: number; currentPeriodEnd: string | null; updatedAt: string }>;
  launches: Array<{ id: string; origin: string; resourceType: string; resourceId: string; audience: string; status: string; expiresAt: string; createdAt: string; usedAt: string | null }>;
  readiness: { identityActivation: boolean; billingActivation: boolean; signedEmbeds: boolean; clinicalConnectivity: boolean };
};

type ApiResult = { snapshot?: Snapshot; launch?: { token: string; launchPath: string; expiresAt: string; evaluation: boolean }; error?: string };

function pretty(value: string) { return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function shortHash(value: string) { return value.length > 20 ? `${value.slice(0, 12)}…${value.slice(-6)}` : value; }
function iso(value: string | null) { return value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Not set"; }

export function PlatformControlCentre({ initialSnapshot }: { initialSnapshot: Snapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastLaunch, setLastLaunch] = useState<ApiResult["launch"]>();
  const editablePublication = useMemo(() => snapshot.publications.find((item) => ["draft", "changes-requested"].includes(item.status)), [snapshot.publications]);

  async function post(payload: Record<string, unknown>, success: string) {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/platform/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.snapshot) throw new Error(result.error ?? "The institution update failed.");
      setSnapshot(result.snapshot); setLastLaunch(result.launch); setMessage(success);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The institution update failed."); }
    finally { setBusy(false); }
  }

  return <div className="control-centre-shell">
    <aside className="control-centre-nav" aria-label="Institution control sections">
      <p>Control centre</p>
      {[ ["Overview", "overview"], ["Organisation", "organisation"], ["Identity & LMS", "identity"], ["Atlas publishing", "publishing"], ["Entitlements", "billing"], ["Signed embeds", "launches"] ].map(([label, id], index) => <a href={`#${id}`} key={id}><span>0{index + 1}</span>{label}</a>)}
      <div><strong>Product boundary</strong><p>Education and research only. No clinical identity, archive, worklist or diagnostic functionality.</p></div>
    </aside>
    <div className="control-centre-main">
      {(message || error) && <div className={`control-message ${error ? "error" : "success"}`} role={error ? "alert" : "status"}>{error || message}</div>}

      <section className="control-section" id="overview">
        <header><div><span>Institution operations</span><h2>{snapshot.platform.organization.name}</h2><p>A governed view of tenant readiness, education publishing, commercial entitlement and external delivery.</p></div><b className="status-badge">{snapshot.platform.entitlement.status}</b></header>
        <div className="control-metrics">
          <article><span>Atlas versions</span><strong>{snapshot.publications.length}</strong><small>{snapshot.publications.filter((item) => item.status === "published").length} published</small></article>
          <article><span>Identity connections</span><strong>{snapshot.identities.length}</strong><small>Activation remains gated</small></article>
          <article><span>Approved origins</span><strong>{snapshot.platform.embedOrigins.length}</strong><small>{snapshot.launches.length} signed launches</small></article>
          <article><span>Current plan</span><strong>{snapshot.platform.entitlement.plan}</strong><small>{snapshot.platform.entitlement.learnerLimit} learner seats</small></article>
        </div>
        <div className="readiness-grid" aria-label="Production readiness">
          <span className={snapshot.readiness.identityActivation ? "ready" : "gated"}><b>Institution identity</b><small>{snapshot.readiness.identityActivation ? "Active" : "Configuration only"}</small></span>
          <span className={snapshot.readiness.billingActivation ? "ready" : "gated"}><b>Payment provider</b><small>{snapshot.readiness.billingActivation ? "Configured" : "No charging enabled"}</small></span>
          <span className={snapshot.readiness.signedEmbeds ? "ready" : "gated"}><b>Signed embeds</b><small>{snapshot.readiness.signedEmbeds ? "Signing key configured" : "Signing key required"}</small></span>
          <span className="gated"><b>Clinical connectivity</b><small>Prohibited by product boundary</small></span>
        </div>
      </section>

      <ProfileSection snapshot={snapshot} busy={busy} post={post} />
      <IdentitySection snapshot={snapshot} busy={busy} post={post} />
      <PublishingSection snapshot={snapshot} editablePublication={editablePublication} busy={busy} post={post} />
      <BillingSection snapshot={snapshot} busy={busy} post={post} />
      <EmbedSection snapshot={snapshot} busy={busy} post={post} lastLaunch={lastLaunch} />
    </div>
  </div>;
}

function ProfileSection({ snapshot, busy, post }: { snapshot: Snapshot; busy: boolean; post: (payload: Record<string, unknown>, success: string) => Promise<void> }) {
  const profile = snapshot.profile;
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); void post({ action: "save-organization-profile", ...values }, "Organisation profile and brand settings saved."); }
  return <section className="control-section" id="organisation"><header><div><span>Tenant administration</span><h2>Organisation & brand</h2><p>Keep the Visible Medicine product frame while giving each institution a clearly bounded identity.</p></div><b className="status-badge">{profile?.onboardingStage ?? "evaluation"}</b></header>
    <form className="control-form-grid" onSubmit={submit}>
      <label><span>Display name</span><input name="displayName" defaultValue={profile?.displayName ?? snapshot.platform.organization.name} maxLength={120} required /></label>
      <label><span>Support contact</span><input name="supportContact" type="email" defaultValue={profile?.supportContact ?? ""} required /></label>
      <label><span>Primary colour</span><input name="primaryColor" type="color" defaultValue={profile?.primaryColor ?? "#082a31"} /></label>
      <label><span>Accent colour</span><input name="accentColor" type="color" defaultValue={profile?.accentColor ?? "#28c6a8"} /></label>
      <label><span>Logo URL <small>Optional HTTPS</small></span><input name="logoUrl" type="url" defaultValue={profile?.logoUrl ?? ""} placeholder="https://assets.example.edu/logo.png" /></label>
      <label><span>Custom domain <small>DNS activation is separate</small></span><input name="customDomain" defaultValue={profile?.customDomain ?? ""} placeholder="education.example.edu" /></label>
      <div className="form-boundary"><b>White-label boundary</b><p>The institution identity appears within Visible Medicine. It must not obscure the education-only intended use or imply a Didanix clinical connection.</p></div>
      <button className="primary-button" disabled={busy}>Save organisation profile <span>→</span></button>
    </form>
  </section>;
}

function IdentitySection({ snapshot, busy, post }: { snapshot: Snapshot; busy: boolean; post: (payload: Record<string, unknown>, success: string) => Promise<void> }) {
  const connection = snapshot.identities[0];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); void post({ action: "save-identity-draft", expectedVersion: connection?.version ?? 0, ...values }, "Identity metadata draft saved without accepting a client secret."); }
  return <section className="control-section" id="identity"><header><div><span>Institution onboarding</span><h2>Identity & LMS readiness</h2><p>Record non-secret OIDC or SAML metadata, then complete technical validation and institutional approval outside this form.</p></div><b className="status-badge neutral">draft only</b></header>
    <div className="split-control"><form className="stack-form" onSubmit={submit}>
      <label><span>Protocol</span><select name="protocol" defaultValue={connection?.protocol ?? "oidc"}><option value="oidc">OpenID Connect</option><option value="saml">SAML 2.0</option></select></label>
      <label><span>Issuer</span><input name="issuer" type="url" defaultValue={connection?.issuer ?? ""} placeholder="https://identity.example.edu" required /></label>
      <label><span>Client or entity ID</span><input name="clientId" defaultValue={connection?.clientId ?? ""} required /></label>
      <label><span>Discovery or metadata URL</span><input name="metadataUrl" type="url" defaultValue={connection?.metadataUrl ?? ""} placeholder="https://identity.example.edu/.well-known/openid-configuration" required /></label>
      <button className="primary-button" disabled={busy}>Save identity draft <span>→</span></button>
    </form><div className="readiness-checklist">
      {[ ["Tenant and role mapping", Boolean(snapshot.profile)], ["Non-secret identity metadata", Boolean(connection)], ["LTI 1.3 registration", false], ["Institution security approval", false], ["Production activation", false] ].map(([label, ready]) => <div className={ready ? "complete" : "pending"} key={String(label)}><span>{ready ? "✓" : "○"}</span><b>{label}</b></div>)}
      <Link className="inline-control-link" href="/learn?view=integrations">Open LTI 1.3 configuration <span>→</span></Link>
      <p>Client secrets, signing keys and clinical credentials are never accepted through this configuration surface.</p>
    </div></div>
  </section>;
}

function PublishingSection({ snapshot, editablePublication, busy, post }: { snapshot: Snapshot; editablePublication?: Snapshot["publications"][number]; busy: boolean; post: (payload: Record<string, unknown>, success: string) => Promise<void> }) {
  function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); void post({ action: "create-atlas-draft", ...values }, "Versioned atlas draft created from the governed ingestion record."); }
  function annotate(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); void post({ action: "add-atlas-annotation", ...values }, "Cited structure annotation added to the atlas draft."); }
  return <section className="control-section publishing-control" id="publishing"><header><div><span>Editorial governance</span><h2>Atlas publishing</h2><p>Move de-identified, rights-cleared media through cited annotation, independent specialist review and immutable version publication.</p></div><b className="status-badge">draft → review → publish</b></header>
    <div className="publishing-steps">{["Quarantine & inspect", "Build cited annotations", "Independent review", "Immutable release"].map((item, index) => <div key={item}><span>0{index + 1}</span><b>{item}</b></div>)}</div>
    <div className="split-control publishing-forms"><form className="stack-form" onSubmit={create}><h3>Create a governed version</h3>
      <label><span>Eligible ingestion</span><select name="ingestionJobId" required defaultValue=""><option value="" disabled>Choose inspected media</option>{snapshot.ingestions.map((item) => <option value={item.id} key={item.id}>{item.title} · {pretty(item.status)}</option>)}</select></label>
      <div className="two-fields"><label><span>Title</span><input name="title" required /></label><label><span>Slug</span><input name="slug" pattern="[a-z0-9-]+" placeholder="ct-head-axial" required /></label></div>
      <div className="three-fields"><label><span>Region</span><input name="region" placeholder="Neuroanatomy" required /></label><label><span>Modality</span><input name="modality" placeholder="CT" required /></label><label><span>Orientation</span><input name="orientation" placeholder="Axial" required /></label></div>
      <label><span>Source and provenance statement</span><textarea name="sourceStatement" minLength={20} placeholder="Describe source ownership, educational consent or synthetic provenance, de-identification assurance and rights basis." required /></label>
      <button className="primary-button" disabled={busy || !snapshot.ingestions.length}>Create atlas version <span>→</span></button>
    </form>
    <form className="stack-form" onSubmit={annotate}><h3>Add a cited structure</h3>
      <label><span>Editable publication</span><select name="publicationId" required defaultValue={editablePublication?.id ?? ""}><option value="" disabled>Choose an editable version</option>{snapshot.publications.filter((item) => ["draft", "changes-requested"].includes(item.status)).map((item) => <option value={item.id} key={item.id}>{item.title} · v{item.version}</option>)}</select></label>
      <label><span>Structure name</span><input name="structureName" placeholder="Lateral ventricle" required /></label>
      <label><span>Synonyms <small>Comma or line separated</small></span><input name="synonyms" placeholder="Ventriculus lateralis" /></label>
      <label><span>Reviewed description</span><textarea name="description" minLength={20} required /></label>
      <label><span>Relationships</span><textarea name="relationships" placeholder="Medial to…&#10;Communicates with…" /></label>
      <label><span>Citations <small>At least one</small></span><textarea name="citations" placeholder="Textbook, DOI or stable reference URL" required /></label>
      <div className="two-fields"><label><span>First slice</span><input name="sliceStart" type="number" min="1" defaultValue="1" required /></label><label><span>Last slice</span><input name="sliceEnd" type="number" min="1" defaultValue="20" required /></label></div>
      <button className="primary-button" disabled={busy || !editablePublication}>Add annotation <span>→</span></button>
    </form></div>
    <div className="publication-ledger">{snapshot.publications.length ? snapshot.publications.map((publication) => {
      const annotationCount = snapshot.annotations.filter((item) => item.publicationVersionId === publication.id).length;
      const review = snapshot.reviews.find((item) => item.publicationVersionId === publication.id);
      return <article key={publication.id}><div><span>{publication.modality} · {publication.region} · v{publication.version}</span><h3>{publication.title}</h3><p>{publication.sourceStatement}</p><small>{annotationCount} cited structures · {shortHash(publication.contentHash)}</small></div><div className="publication-evidence"><span className={publication.rightsStatus === "cleared" ? "pass" : "hold"}>Rights: {publication.rightsStatus}</span><span className={publication.deidentificationStatus === "verified" ? "pass" : "hold"}>De-ID: {publication.deidentificationStatus}</span><span className={publication.specialistReviewStatus === "approved" ? "pass" : "hold"}>Review: {publication.specialistReviewStatus}</span>{review && <small>{review.reviewerName}: {review.notes}</small>}</div><div className="publication-actions"><b className={`status-badge ${publication.status}`}>{pretty(publication.status)}</b>{["draft", "changes-requested"].includes(publication.status) && <button disabled={busy || annotationCount === 0} onClick={() => void post({ action: "submit-atlas-review", publicationId: publication.id }, "Atlas version submitted for independent review.")}>Submit review</button>}{publication.status === "in-review" && <><button disabled={busy} onClick={() => { const notes = window.prompt("Independent specialist review notes"); if (notes) void post({ action: "review-atlas-publication", publicationId: publication.id, decision: "approved", notes }, "Independent atlas review recorded."); }}>Approve</button><button disabled={busy} onClick={() => { const notes = window.prompt("Describe the required editorial changes"); if (notes) void post({ action: "review-atlas-publication", publicationId: publication.id, decision: "changes-requested", notes }, "Atlas changes requested."); }}>Request changes</button></>}{publication.status === "approved" && <button disabled={busy} onClick={() => window.confirm("Publish this immutable education-only atlas version?") && void post({ action: "publish-atlas-publication", publicationId: publication.id }, "Atlas version published with its governance evidence.")}>Publish version</button>}</div></article>;
    }) : <p className="empty-control">No institution atlas versions exist yet. Begin with an eligible ingestion above.</p>}</div>
  </section>;
}

function BillingSection({ snapshot, busy, post }: { snapshot: Snapshot; busy: boolean; post: (payload: Record<string, unknown>, success: string) => Promise<void> }) {
  const current = snapshot.subscriptions[0];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); void post({ action: "save-billing-intent", expectedVersion: snapshot.billing?.version ?? 0, ...values }, "Commercial brief saved. No payment or subscription was created."); }
  return <section className="control-section" id="billing"><header><div><span>Commercial readiness</span><h2>Plans & entitlements</h2><p>Capture the commercial brief and enforce product capabilities without enabling payment collection prematurely.</p></div><b className="status-badge neutral">no charging</b></header>
    <div className="split-control"><form className="stack-form" onSubmit={submit}>
      <label><span>Billing contact</span><input name="billingContact" type="email" defaultValue={snapshot.billing?.billingContact ?? ""} required /></label>
      <div className="two-fields"><label><span>Plan brief</span><select name="planCode" defaultValue={current?.planCode ?? "founding-institution"}><option value="founding-institution">Founding institution</option><option value="institution">Institution</option><option value="enterprise">Enterprise</option></select></label><label><span>Tax country</span><input name="taxCountry" defaultValue={snapshot.billing?.taxCountry ?? "GB"} maxLength={2} required /></label></div>
      <div className="three-fields"><label><span>Learner seats</span><input name="learnerSeats" type="number" min="1" defaultValue={current?.learnerSeats ?? snapshot.platform.entitlement.learnerLimit} required /></label><label><span>Educator seats</span><input name="educatorSeats" type="number" min="1" defaultValue={current?.educatorSeats ?? snapshot.platform.entitlement.educatorLimit} required /></label><label><span>Storage GB</span><input name="storageGb" type="number" min="1" defaultValue={current ? Math.round(current.storageBytes / 1073741824) : 50} required /></label></div>
      <button className="primary-button" disabled={busy}>Save commercial brief <span>→</span></button>
    </form><div className="entitlement-contract"><h3>Enforced now</h3>{[["Atlas", snapshot.platform.entitlement.atlasAccess], ["Studio", snapshot.platform.entitlement.studioAccess], ["Reporting", snapshot.platform.entitlement.reportingAccess], ["Embeds", snapshot.platform.entitlement.embedsAccess]].map(([label, enabled]) => <div key={String(label)}><span>{label}</span><b>{enabled ? "Included" : "Unavailable"}</b></div>)}<p>Provider customer IDs and subscription IDs remain empty. The platform cannot charge a card or create a paid subscription in this state.</p></div></div>
  </section>;
}

function EmbedSection({ snapshot, busy, post, lastLaunch }: { snapshot: Snapshot; busy: boolean; post: (payload: Record<string, unknown>, success: string) => Promise<void>; lastLaunch: ApiResult["launch"] }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); void post({ action: "issue-embed-launch", ...values }, "A five-minute, origin-bound education launch was issued."); }
  return <section className="control-section" id="launches"><header><div><span>External delivery</span><h2>Signed embeds</h2><p>Issue short-lived launches only for entitled education resources and exact institution origins.</p></div><b className="status-badge">HS256 · 5 min</b></header>
    <div className="split-control"><form className="stack-form" onSubmit={submit}>
      <label><span>Approved host origin</span><select name="origin" required defaultValue=""><option value="" disabled>Choose an exact origin</option>{snapshot.platform.embedOrigins.map((item) => <option value={item.origin} key={item.origin}>{item.origin} · {item.status}</option>)}</select></label>
      <div className="two-fields"><label><span>Resource type</span><select name="resourceType" defaultValue="course"><option value="course">Course</option><option value="atlas">Atlas</option><option value="workbook">Workbook</option></select></label><label><span>Published resource ID</span><input name="resourceId" defaultValue="foundations-ct-head" required /></label></div>
      <label><span>Audience</span><input name="audience" defaultValue="institution-learners" required /></label>
      <button className="primary-button" disabled={busy || !snapshot.platform.embedOrigins.length || !snapshot.readiness.signedEmbeds}>Issue signed launch <span>→</span></button>
      {!snapshot.platform.embedOrigins.length && <p className="form-help">Record an exact HTTPS origin in the workspace before issuing a launch.</p>}
    </form><div className="launch-result"><h3>One-time launch handoff</h3>{lastLaunch ? <><p>This token is shown only in this response and expires at {iso(lastLaunch.expiresAt)}.</p><label><span>Launch path</span><textarea readOnly value={lastLaunch.launchPath} onFocus={(event) => event.currentTarget.select()} /></label><small>{lastLaunch.evaluation ? "Evaluation origin: external production activation remains gated." : "Production origin."}</small></> : <p>Issue a launch to receive the iframe path. The embedded runtime remains locked until the approved parent origin completes its browser-enforced handshake.</p>}</div></div>
    <div className="launch-ledger">{snapshot.launches.map((launch) => <article key={launch.id}><div><b>{launch.resourceType}: {launch.resourceId}</b><span>{launch.origin}</span></div><div><span>{launch.audience}</span><small>Expires {iso(launch.expiresAt)}</small></div><b className="status-badge neutral">{launch.usedAt ? "handshake used" : launch.status}</b></article>)}</div>
  </section>;
}

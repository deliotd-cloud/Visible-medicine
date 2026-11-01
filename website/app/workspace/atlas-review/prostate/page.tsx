import { authorizeClinicalReview } from '@/lib/clinical-review-server';
import { prostateReviewMaterial, prostateReviewPageSelection } from '@/lib/prostate-review-material';
import { prostateReviewContext } from '@/lib/prostate-review-contract';
import { ProstateReviewNotes } from '@/components/ProstateReviewNotes';
import './prostate-review.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Prostate zones · Clinical Review', robots: { index: false, follow: false } };

export default async function ProstateReviewPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try { await authorizeClinicalReview(); }
  catch { return <p role="alert">Sign in with an authorized Clinical Review administrator account to inspect this model.</p>; }
  let material;
  try { material = await prostateReviewMaterial(); }
  catch { return <p role="alert">The prostate review material is unavailable. Return to the review inbox and retry.</p>; }
  const selection = prostateReviewPageSelection(await searchParams, material.revision);
  if (selection === 'invalid') return <main className="review-workspace">
    <h1>Prostate zones</h1><p role="alert">This review link is invalid. Open the prostate entry from the review inbox.</p>
    <a href="/workspace/clinical-review-inbox">Return to review inbox</a>
  </main>;
  return <main className="review-workspace prostate-review-page">
    <a href="/workspace/clinical-review-inbox">← Review inbox</a>
    <h1>Prostate zones</h1>
    <p>Inspect the four regions together, read the teaching, then record your model and teaching decisions separately.</p>
    <div className="prostate-review-layout">
    {selection === 'stale' ? <p role="alert">This review link refers to an earlier version. Current material is withheld. Retained working notes are read-only; export them before opening the current entry from the review inbox.</p> : <iframe title="Prostate zonal review model — original schematic" className="review-model-frame" src={material.modelHref} allowFullScreen />}
    <aside className="prostate-review-notes" aria-label="Prostate review material">
    {selection === 'current' && <>
    <details><summary>What to check</summary><ul>{material.checks.map(check => <li key={check}>{check}</li>)}</ul></details>
    <h2>Anatomy and MRI teaching</h2>
    {material.zones.map(zone => <details key={zone.id}>
      <summary>{zone.shortLabel} · {zone.name}</summary>
      <p>{zone.anatomy}</p><p>{zone.mri}</p>
      <h3>MRI recognition</h3><p>{zone.lesson.landmark}</p><p>{zone.lesson.signal}</p><p>{zone.lesson.caution}</p>
      <h3>Anatomy check</h3><p>{zone.lesson.question}</p>
      <ul>{zone.lesson.choices.map(choice => <li key={choice.id}>{choice.label}{choice.id === zone.lesson.answerId ? ' — correct answer' : ''}</li>)}</ul>
      <p>{zone.lesson.explanation}</p>
      <p>References: {[...new Set([zone.lesson.reference, ...(zone.lesson.cautionReference ? [zone.lesson.cautionReference] : [])])].map((key, index) =>
        <span key={key}>{index > 0 ? '; ' : ''}<a href={material.references[key].href} target="_blank" rel="noreferrer">{material.references[key].title}</a></span>)}</p>
    </details>)}
    <details><summary>Sources, model identity and limits</summary>
      <p>{material.limitation}</p><p>No prostate MRI is paired with this review.</p>
      <p>Model revision: <code>{material.modelRevision}</code></p>
      <p>Review revision: <code>{material.revision}</code></p>
      <p>The BodyParts3D outer-prostate identity provides parent context only; it is not the source of the internal zonal shapes.</p>
    </details>
    </>}
    <ProstateReviewNotes context={prostateReviewContext(material)} externallyRetired={selection === 'stale'} />
    </aside>
    </div>
  </main>;
}

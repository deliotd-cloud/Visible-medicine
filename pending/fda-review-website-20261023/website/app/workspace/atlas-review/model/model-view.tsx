import { notFound } from 'next/navigation';
import { dissectionProfiles } from '@/atlas-review/app/dissection-data';
import { clinicalReviewReturn } from '../../../../lib/clinical-review-return';
import { parseWebsiteFdaSelection } from '@/lib/clinical-review-reference-selection';
import './review-model-embedded.css';

/** Both presentations share the existing exact query validation and private
 * parent layout. Embedded presentation removes navigation, never access checks. */
export async function renderReviewModel(params: Record<string, string | string[] | undefined>, embedded = false) {
  const kind = params.kind ?? 'body';
  const region = params.region ?? 'whole-body';
  if (typeof kind !== 'string' || !['body','shoulder','kidneys','female-pelvis','back-layers','abdominal-wall','lower-limb','fda-shoulder'].includes(kind)
    || typeof region !== 'string' || (kind !== 'fda-shoulder' && !Object.hasOwn(dissectionProfiles, region))) notFound();
  // Independent source coordinates are never parsed as body/specimen study links.
  if (kind === 'fda-shoulder' && !parseWebsiteFdaSelection(params)) notFound();
  if (kind !== 'fda-shoulder' && params.referenceRevision !== undefined) notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!/^(kind|region|study|structure|referenceRevision|side|source|focus|detail|part|partSource|ref|refSpecimen|refFrame|refStructure|refSource|refRevision|refStudy|refView|specimen|specimenScope|specimenPart|specimenSource|specimenRevision|specimenStudy|specimenView|specimenTopic)$/.test(key)
      || typeof value !== 'string' || value.length > 256) notFound();
    query.set(key, value);
  }
  query.set('kind', kind); query.set('region', region);
  const back = await clinicalReviewReturn(Object.fromEntries(query));
  const frame = <iframe className="review-model-frame" title="Clinical Review anatomy model" src={'/atlas-review-viewer/index.html?' + query.toString()} allowFullScreen />;
  if (embedded) return <div className="review-model-embedded"><p>Private anatomy inspection · education only · no decision is recorded here</p>{frame}</div>;
  return <><nav className="review-model-bar" aria-label="Review model navigation"><a data-review-return href={back.href} title={back.name ? `Return to ${back.name} review` : undefined}>{back.name ? '← Back to worksheet' : '← Clinical Review'}</a><span>Review-linked model</span></nav>{frame}</>;
}

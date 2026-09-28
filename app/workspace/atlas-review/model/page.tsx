import { notFound } from 'next/navigation';
import { dissectionProfiles } from '@/atlas-review/app/dissection-data';
import { clinicalReviewReturn } from '../../../../lib/clinical-review-return';
export const dynamic = 'force-dynamic';
export default async function ReviewModel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const kind = params.kind ?? 'body';
  const region = params.region ?? 'whole-body';
  if (typeof kind !== 'string' || !['body','shoulder','kidneys','female-pelvis','back-layers','abdominal-wall','lower-limb'].includes(kind)
    || typeof region !== 'string' || !Object.hasOwn(dissectionProfiles, region)) notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!/^(kind|region|study|structure|side|source|focus|detail|part|partSource|ref|refSpecimen|refFrame|refStructure|refSource|refRevision|refStudy|refView|specimen|specimenScope|specimenPart|specimenSource|specimenRevision|specimenStudy|specimenView|specimenTopic)$/.test(key)
      || typeof value !== 'string' || value.length > 256) notFound();
    query.set(key, value);
  }
  query.set('kind', kind); query.set('region', region);
  const back = await clinicalReviewReturn(Object.fromEntries(query));
  return <><nav className="review-model-bar" aria-label="Review model navigation"><a data-review-return href={back.href} title={back.name ? `Return to ${back.name} review` : undefined}>{back.name ? '← Back to worksheet' : '← Clinical Review'}</a><span>Review-linked model</span></nav>
    <iframe className="review-model-frame" title="Clinical Review anatomy model" src={'/atlas-review-viewer/index.html?' + query.toString()} allowFullScreen /></>;
}

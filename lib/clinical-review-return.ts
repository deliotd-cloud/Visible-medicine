import {clinicalReviewEntries, type ClinicalReviewEntry} from '../atlas-review/lib/clinical-review-index';
import {bodyReviewMaterial} from '../atlas-review/lib/body-review-material';
import {nestedReviewMaterial} from '../atlas-review/lib/nested-review-material';
import {specimenReviewMaterial} from '../atlas-review/lib/specimen-review-material';
import {reviewModelHref} from './clinical-review-links';

const home = {href:'/workspace/atlas-review', name:null};
type Params = Record<string, string | string[] | undefined>;
/** Compare the complete source-bound model link, not just a familiar structure ID.
 * Public material only: no private review records, authorization or approvals. */
function signature(params: Params): string | null {
  const pairs: Array<[string,string]> = [];
  for (const [key,value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (typeof value !== 'string' || value.length > 256) return null;
    pairs.push([key,value]);
  }
  if (!pairs.some(([key])=>key==='kind')) pairs.push(['kind','body']);
  if (!pairs.some(([key])=>key==='region')) pairs.push(['region','whole-body']);
  return JSON.stringify(pairs.sort(([a],[b])=>a.localeCompare(b)));
}
async function entryModelHref(entry: ClinicalReviewEntry): Promise<string> {
  const query = new URL(entry.href,'https://review.invalid').searchParams;
  if (entry.scope === 'shoulder') return reviewModelHref('/shoulder?'+new URLSearchParams({structure:entry.id}));
  if (entry.scope === 'body') return reviewModelHref((await bodyReviewMaterial(entry.id))?.atlasLink ?? null);
  if (entry.scope === 'nested') return reviewModelHref((await nestedReviewMaterial(JSON.stringify([query.get('parent'),query.get('study')]),entry.id))?.atlasLink ?? null);
  return reviewModelHref((await specimenReviewMaterial(query.get('specimen')!,entry.id))?.atlasLink ?? null);
}
export async function clinicalReviewReturn(params: Params): Promise<{href:string;name:string|null}> {
  const requested = signature(params);
  if (!requested) return {...home};
  const kind = params.kind ?? 'body';
  const scope = kind === 'shoulder' ? 'shoulder' : kind === 'body'
    ? params.study === '2' ? 'nested' : 'body' : 'specimens';
  const id = scope === 'nested' ? params.part : scope === 'specimens'
    ? kind === 'lower-limb' ? params.specimenPart : params.refStructure : params.structure;
  if (typeof id !== 'string') return {...home};
  const matches: ClinicalReviewEntry[] = [];
  for (const entry of clinicalReviewEntries.filter(e=>e.scope===scope && e.id===id)) {
    const url = new URL(await entryModelHref(entry),'https://review.invalid');
    if (url.pathname === '/workspace/atlas-review/model'
      && signature(Object.fromEntries(url.searchParams)) === requested) matches.push(entry);
  }
  return matches.length === 1 ? {href:matches[0].href,name:matches[0].name} : {...home};
}

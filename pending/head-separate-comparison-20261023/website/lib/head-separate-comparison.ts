import {HEAD_MANIFEST_SHA256} from './head-atlas-import.ts';
import type {HeadModality} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';
import {headImageHref,parseHeadImageNavigation} from './head-atlas-navigation.ts';

/** Only an exact, current, first-party concept or complete tour step may open separately. */
export function headSeparateComparisonHref(href:string|undefined|null,modality:HeadModality):string|null{
  if(typeof href!=='string'||!href||!headLinksCurrent()||(modality!=='CT'&&modality!=='MRI'))return null;
  const route=modality==='CT'?'/atlas/ct-head':'/atlas/mri-head';
  if(!href.startsWith(`${route}?`)||href.includes('#')||href.includes('\\'))return null;
  const query=new URLSearchParams(href.slice(route.length+1));
  const keys=[...query.keys()];
  const conceptKeys=['concept','headRevision'];
  const stepKeys=['concept','headTour','headStep','headRevision'];
  if(keys.length!==conceptKeys.length&&keys.length!==stepKeys.length)return null;
  const expected=keys.length===conceptKeys.length?conceptKeys:stepKeys;
  if(expected.some(key=>query.getAll(key).length!==1)||keys.some(key=>!expected.includes(key)))return null;
  if(query.get('headRevision')!==HEAD_MANIFEST_SHA256)return null;
  const parsed=parseHeadImageNavigation(query,HEAD_MANIFEST_SHA256,modality);
  if(parsed.invalid||!parsed.conceptId)return null;
  const canonical=headImageHref(modality,parsed.conceptId,parsed.position,HEAD_MANIFEST_SHA256);
  return canonical===href?canonical:null;
}

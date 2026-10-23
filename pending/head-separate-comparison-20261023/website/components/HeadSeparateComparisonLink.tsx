import type {HeadModality} from '../lib/head-atlas-links.ts';
import {headSeparateComparisonHref} from '../lib/head-separate-comparison.ts';

export function HeadSeparateComparisonLink({href,modality}:{href:string|undefined|null;modality:HeadModality}){
  const destination=headSeparateComparisonHref(href,modality);
  if(!destination)return null;
  return <a href={destination} target="_blank" rel="noopener noreferrer" aria-label={`Open mapped ${modality} anatomy in a new tab; keep this scan open`}>
    Open {modality} (new tab)
  </a>;
}

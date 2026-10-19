import {HEAD_LINK_REVISION,headAtlasConcept,type HeadEntry,type HeadModality,type HeadConceptLink} from './head-atlas-links.ts';

const pairs:readonly (readonly [string,string])[]=[
  ['ventricle-left-lateral','ventricle-right-lateral'],
  ['deep-left-caudate','deep-right-caudate'],
  ['deep-left-putamen','deep-right-putamen'],
  ['deep-left-globus-pallidus','deep-right-globus-pallidus'],
  ['deep-left-thalamus','deep-right-thalamus'],
];
const alias=(entry:HeadEntry)=>entry.source!==null&&typeof entry.source==='object'&&'geometry_alias_of' in entry.source&&entry.source.geometry_alias_of!=null;

/** Same-source discovery only: never mirror geometry or infer the other side. */
export function headPairedEntry<T extends HeadEntry>(entry:T|null,entries:readonly T[],modality:HeadModality,revision:string):{entry:T;concept:HeadConceptLink}|null{
  if(revision!==HEAD_LINK_REVISION||!entry||!entries.includes(entry)||alias(entry))return null;
  const current=headAtlasConcept(entry,modality);
  const pair=current?pairs.find(values=>values.includes(current.conceptId)):null;
  if(!pair||!current)return null;
  const counterpartId=pair.find(id=>id!==current.conceptId);
  const mapped=entries.map(candidate=>({entry:candidate,concept:headAtlasConcept(candidate,modality)}));
  if(mapped.filter(candidate=>candidate.concept?.conceptId===current.conceptId).length!==1)return null;
  const matches=mapped.filter(candidate=>candidate.concept?.conceptId===counterpartId);
  const match=matches.length===1?matches[0]:null;
  return match?.concept&&!alias(match.entry)?{entry:match.entry,concept:match.concept}:null;
}

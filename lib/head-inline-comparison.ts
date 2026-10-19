import {atlasStudySuffix} from './atlas-study-transport.ts';
import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';
import {headImageHref} from './head-atlas-navigation.ts';
import type {LiveHeadSelection} from './head-live-selection.ts';
import type {HeadGuidedDestination} from './head-guided-focus.ts';
import regionalManifest from '../public/atlas-runtime/head-neck/manifest.json' with {type:'json'};

export type InlineHeadDestination={conceptId:string;label:string;atlasHref:string;src:string;sourceRevision:string;headRevision:string;scope:string;target:HeadGuidedDestination['target']};

/** The embedded model is built only from the reviewed concept and imported runtime. */
export function headInlineDestination(conceptId:string,revision:string,modality:HeadModality):InlineHeadDestination|null{
  if(!headLinksCurrent()||revision!==HEAD_LINK_REVISION||
    regionalManifest.sourceCommit.length!==40||!/^[a-f0-9]{40}$/.test(regionalManifest.sourceCommit)||
    (modality!=='CT'&&modality!=='MRI'))return null;
  const concept=headConceptById(conceptId);
  if(!concept||concept.headRevision!==revision||!(modality==='CT'?concept.ctHref:concept.mriHref))return null;
  const href=new URL(concept.atlasHref,'https://atlas.invalid');
  if(href.origin!=='https://atlas.invalid'||href.pathname!=='/atlas/head-neck-3d'||href.hash||
    href.searchParams.get('concept')!==conceptId)return null;
  const suffix=atlasStudySuffix(Object.fromEntries(href.searchParams));
  if(!suffix)return null;
  const query=new URLSearchParams(suffix.slice(1)),nested=query.get('study')==='2';
  const id=query.get(nested?'part':'structure'),source=query.get(nested?'partSource':'source');
  if(!id||!source)return null;
  const identity={id,source,laterality:id.split(':')[4]};
  const target:HeadGuidedDestination['target']=nested
    ?{kind:'nested',...identity,parentId:query.get('structure')!,parentSource:query.get('source')!,study:query.get('detail')!}
    :{kind:'root',...identity};
  // Keep model/camera only within the same source, side and anatomical study.
  // Exact selected-piece identity still travels in every acknowledged command.
  const scopeQuery=new URLSearchParams(query);
  // Different sources need their own authored initial model URL and session.
  // Only the selected piece may vary within a reusable source/study frame.
  scopeQuery.delete(nested?'part':'structure');
  const scope=JSON.stringify([regionalManifest.sourceCommit,revision,modality,'head-neck',scopeQuery.toString()]);
  return {conceptId,label:concept.label,atlasHref:concept.atlasHref,src:'/atlas-runtime/head-neck/index.html?region=head-neck'+suffix+'&presentation=compare',sourceRevision:regionalManifest.sourceCommit,headRevision:revision,scope,target};
}

export function headInlineMatches(selection:LiveHeadSelection|null,conceptId:string):boolean{
  return selection?.status==='selected'&&selection.concept?.conceptId===conceptId;
}

/** Reverse navigation requires a fresh, exact model identity and an authored scan target. */
export function headInlineReverseConcept(selection:LiveHeadSelection|null,expectedConceptId:string,modality:HeadModality,revision:string):string|null{
  if(!headLinksCurrent()||revision!==HEAD_LINK_REVISION||!selection||selection.status!=='selected')return null;
  const concept=selection.concept;
  if(!concept||concept.conceptId===expectedConceptId||!headImageHref(modality,concept.conceptId,null,revision))return null;
  return concept.conceptId;
}

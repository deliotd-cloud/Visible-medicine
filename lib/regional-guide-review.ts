import {regionalMriGuideDrafts} from './regional-mri-guided-study.ts';

export type RegionalGuideReviewPacket=Readonly<{
 schema:'vm-regional-guide-review-packet-1';region:'knee';guideId:string;title:string;guideRevision:string;contentRevision:string;
 steps:readonly Readonly<{anatomyId:string;title:string;caption:string;source:Readonly<{title:string;href:string}>}>[];
 approvalScope:'guide-teaching-only';patientRegistration:false;publicationApproval:false;
}>;
export type RegionalGuideReviewSelection=Readonly<{region:'knee';guide:string;revision:string}>;
const ids=['cruciate-ligaments','collateral-ligaments','menisci','extensor-mechanism','posterior-knee'] as const;
const hash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
/** No local MRI binding or scan-derived identity is needed to review authored prose. */
export async function regionalGuideReviewPackets(region='knee'):Promise<readonly RegionalGuideReviewPacket[]>{
 if(region!=='knee')return Object.freeze([]);
 const drafts=regionalMriGuideDrafts(region);
 if(drafts.length!==ids.length||drafts.some((d,i)=>d.id!==ids[i]))throw Error('Native guide authoring catalogue changed.');
 return Object.freeze(await Promise.all(drafts.map(async d=>{
  for(const s of d.steps){const url=new URL(s.source.href);if(url.protocol!=='https:'||url.hostname!=='pubmed.ncbi.nlm.nih.gov'||!/^\/\d+\/$/.test(url.pathname)||url.search||url.hash)throw Error('Unexpected guide citation.');}
  const content={region:'knee' as const,guideId:d.id,title:d.title,guideRevision:d.revision,steps:d.steps};
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(content)));
  const contentRevision=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
  return Object.freeze({schema:'vm-regional-guide-review-packet-1' as const,...content,contentRevision,
   approvalScope:'guide-teaching-only' as const,patientRegistration:false as const,publicationApproval:false as const});
 })));
}
export function parseRegionalGuideReviewSelection(value:unknown):RegionalGuideReviewSelection|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(Object.keys(v).length!==3||!['region','guide','revision'].every(k=>Object.hasOwn(v,k))||v.region!=='knee'||typeof v.guide!=='string'||!ids.some(id=>id===v.guide)||!hash(v.revision))return null;
 return Object.freeze({region:'knee',guide:v.guide,revision:v.revision});
}
export async function resolveRegionalGuideReview(selection:RegionalGuideReviewSelection):Promise<RegionalGuideReviewPacket|null>{
 const parsed=parseRegionalGuideReviewSelection(selection);if(!parsed)return null;
 return(await regionalGuideReviewPackets(parsed.region)).find(p=>p.guideId===parsed.guide&&p.contentRevision===parsed.revision)??null;
}
export function regionalGuideReviewHref(packet:RegionalGuideReviewPacket){
 const selection=parseRegionalGuideReviewSelection({region:packet.region,guide:packet.guideId,revision:packet.contentRevision});
 if(!selection)throw Error('Invalid guide teaching selection.');
 return '/workspace/atlas-review/regional-guides?'+new URLSearchParams(selection);
}

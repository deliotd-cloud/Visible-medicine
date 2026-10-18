import localBinding from 'virtual:visible-medicine-regional-review';

export type RegionalMriReviewSource=Readonly<{revision:string;label:string;region:string}>;
const regions=new Set(['knee','head-neck','shoulder','shoulder-arm','forearm','hand','thorax','abdomen','pelvis','thigh','leg','foot','spine']);

/** Development-only metadata, independently checked before local configuration.
 * This neither reads a folder nor grants clinical, privacy or learner approval. */
export function regionalMriReviewSource():RegionalMriReviewSource|null{
  if(!import.meta.env.DEV)return null;
  const binding:unknown=localBinding;
  if(!binding||typeof binding!=='object'||Array.isArray(binding))return null;
  const value=binding as Record<string,unknown>;
  if(Object.keys(value).length!==3||!['revision','label','region'].every(k=>Object.hasOwn(value,k))||
    typeof value.revision!=='string'||! /^[a-f0-9]{64}$/.test(value.revision)||
    typeof value.label!=='string'||!value.label.trim()||value.label.length>160||/[\u0000-\u001f\u007f]/.test(value.label)||
    typeof value.region!=='string'||!regions.has(value.region))return null;
  return Object.freeze({revision:value.revision,label:value.label,region:value.region});
}

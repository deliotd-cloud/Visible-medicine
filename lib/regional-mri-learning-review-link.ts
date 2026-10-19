import {isRegionalMriLearning,type RegionalMriLearning} from './regional-mri-learning.ts';

export type RegionalLearningReviewRequest={target:string;relation:'same-structure'|'parent-reference'|'group-reference';atlasRevision:string;mappingRevision:string;teachingRevision:string};
const keys=['target','relation','atlasRevision','mappingRevision','teachingRevision'] as const;
const hash=/^[a-f0-9]{64}$/;

/** Public reference identity only. Parsing is neither authorization nor approval. */
export function parseRegionalLearningReviewRequest(params:Record<string,string|string[]|undefined>):RegionalLearningReviewRequest|null{
 if(!params||typeof params!=='object'||Array.isArray(params)||Object.keys(params).sort().join('|')!==[...keys].sort().join('|'))return null;
 if(keys.some(k=>typeof params[k]!=='string'))return null;
 const value=params as Record<typeof keys[number],string>;
 if(!/^[a-zA-Z0-9][a-zA-Z0-9:_.-]{0,239}$/.test(value.target)||!['same-structure','parent-reference','group-reference'].includes(value.relation)||
  !/^[a-f0-9]{40}$/.test(value.atlasRevision)||!hash.test(value.mappingRevision)||!hash.test(value.teachingRevision))return null;
 return {target:value.target,relation:value.relation as RegionalLearningReviewRequest['relation'],atlasRevision:value.atlasRevision,mappingRevision:value.mappingRevision,teachingRevision:value.teachingRevision};
}

/** Never include the MRI identity, proof key, scan paths or coordinates in a URL. */
export function regionalLearningReviewHref(proof:RegionalMriLearning|unknown):string|null{
 if(!isRegionalMriLearning(proof))return null;
 const request=parseRegionalLearningReviewRequest({target:proof.entry.target.id,relation:proof.entry.target.relation,
  atlasRevision:proof.atlasRevision,mappingRevision:proof.mappingRevision,teachingRevision:proof.entry.revision});
 return request?'/workspace/atlas-review/reference-learning?'+new URLSearchParams(request):null;
}

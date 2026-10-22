export type RegionalAtlasBinding={reviewRevision:unknown;learnerRevision:unknown;limbRevision:unknown;viewerRevision:unknown;reviewIntegration:unknown;viewerIntegration:unknown};
export const regionalSpecimenSourcePaths=[
 'lib/um-limb-studies.ts','lib/um-limb-navigation.ts','lib/specimen-links.ts',
 'lib/um-limb-teaching.ts','content/um-limb-clinical.ts','public/models/um-limb/catalog.json',
] as const;
const commit=/^[a-f0-9]{40}$/,hash=/^[a-f0-9]{64}$/;
/** Independent runtime epochs are permitted only for the installed, exact source family.
 * Matching files establish semantic compatibility, never patient-space registration. */
export function regionalAtlasRuntimeBindingCurrent(binding:RegionalAtlasBinding,expected:RegionalAtlasBinding,reviewInputs:unknown,runtimeInputs:unknown):boolean{
 try{
  const keys=Object.keys(expected) as (keyof RegionalAtlasBinding)[];
  if(keys.length!==6||Object.keys(binding).length!==6||keys.some(k=>binding[k]!==expected[k])||
   [expected.reviewRevision,expected.learnerRevision,expected.limbRevision,expected.viewerRevision].some(v=>typeof v!=='string'||!commit.test(v))||
   expected.learnerRevision!==expected.reviewRevision||expected.viewerRevision!==expected.reviewRevision||
   typeof expected.reviewIntegration!=='string'||!hash.test(expected.reviewIntegration)||expected.viewerIntegration!==expected.reviewIntegration||
   !Array.isArray(reviewInputs)||!Array.isArray(runtimeInputs))return false;
  return regionalSpecimenSourcePaths.every(path=>{
   const review=reviewInputs.filter(row=>row?.path===path),runtime=runtimeInputs.filter(row=>row?.path===path);
   return review.length===1&&runtime.length===1&&typeof review[0].sourceSha256==='string'&&hash.test(review[0].sourceSha256)&&
    runtime[0].sha256===review[0].sourceSha256;
  });
 }catch{return false;}
}

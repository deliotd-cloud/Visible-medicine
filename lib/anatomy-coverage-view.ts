export const COVERAGE_SOURCE_REVISION='544e6c63a3428f6a8b24243fee46f6772037396a';
export const COVERAGE_SNAPSHOT_REVISION='dfa189b7f4acc9f19eb80b47de8b874b6790d384038eec09f5766d9cd46ddeb1';
const coverageImportedRevision='e6fc2ff8d77606b082d57103a4a37866912e81f0f7b1b256856bdda801876128';
const coveragePackageSha256='913033f7b974fd7564b2518ed60d70e9e9bc10b4a7344a62a79b96be7b6b9c55';
export const coverageRegions={
 'head-neck':'Head and neck',spine:'Spine',thorax:'Thorax',abdomen:'Abdomen',pelvis:'Pelvis',
 'shoulder-arm':'Shoulder and arm',forearm:'Forearm',hand:'Hand',thigh:'Thigh',leg:'Leg',foot:'Foot',
} as const;
export type CoverageRegion=keyof typeof coverageRegions;
export type CoverageState='missing'|'held'|'partial'|'not-yet-inventoried';
export type CoverageView={
 sourceRevision:string;inventoryRevision:string;
 counts:{root:number;nested:number;specimenViews:number;specimenMemberships:number;specimenSelections:number;shoulder:number};
 targets:{id:string;label:string;state:CoverageState;regions:CoverageRegion[];reason:string}[];
 reference:{files:number;differences:number;nested:number;corrected:number;held:number;unsupported:number};
};
const labels={
 'upper-limb-peripheral-nerves':'Upper-limb peripheral nerves','lower-limb-peripheral-nerves':'Lower-limb peripheral nerves',
 'brachial-plexus':'Brachial plexus','lumbosacral-plexus':'Lumbosacral plexus','spinal-cord-tissue':'Spinal cord tissue',
 'nervous-system-completeness':'Nervous-system coverage','lymphatic-curriculum':'Lymphatic curriculum',
} as const;
export function coverageRegionQuery(params:Record<string,string|string[]|undefined>):CoverageRegion|null{
 if(Object.keys(params).some(k=>k!=='region')||Array.isArray(params.region))throw Error('Invalid region filter');
 if(params.region===undefined||params.region==='')return null;
 if(!Object.hasOwn(coverageRegions,params.region))throw Error('Invalid region filter');
 return params.region as CoverageRegion;
}
/** Metadata projection only: never a clinical decision, completeness score or new asset admission. */
async function digest(value:unknown){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function projectCoverageView(snapshot:unknown,manifest:unknown):Promise<CoverageView|null>{
 try{
  const s=structuredClone(snapshot) as any,m=structuredClone(manifest) as any;
  const hash=await digest(s);
  if(hash!==COVERAGE_SNAPSHOT_REVISION||s.sourceRevision!==COVERAGE_SOURCE_REVISION||m.revision!==COVERAGE_SOURCE_REVISION||!Array.isArray(m.files))return null;
  const byPath=new Map<string,any>();for(const f of m.files){if(typeof f.path!=='string'||byPath.has(f.path))return null;byPath.set(f.path,f);}
  let imported=0,metadataOnly=0;
  for(const[path,sha]of Object.entries(s.evidence.sourceInputs)){
   const f=byPath.get(path);if(f){if(f.sourceSha256!==sha)return null;imported++;}
   else{if(!(path==='package.json'&&sha===coveragePackageSha256)&&!/^(?:LICENSES\/bodyparts3d-v4-index\/|docs\/|scripts\/|content\/(?:reference-male-inventory|source-inventory)\.json$)/.test(path))return null;metadataOnly++;}
  }
  if(imported!==148||metadataOnly!==26||s.assessment.expectedCurriculumInventoried!==false||s.assessment.clinicalApprovalAsserted!==false||s.assessment.anatomicalCompletenessProven!==false)return null;
  const importedIdentity=Object.keys(s.evidence.sourceInputs).sort().flatMap(path=>{const f=byPath.get(path);return f?[{path,sourceSha256:f.sourceSha256,importedSha256:f.importedSha256}]:[];});
  if(await digest(importedIdentity)!==coverageImportedRevision)return null;
  const c=s.scopedCounts,r=c.reference.currentDifferenceCategories;
  const targets=s.documentedRootTargetGroups.map((t:any)=>{
   if(!Object.hasOwn(labels,t.id)||!['missing','held','partial','not-yet-inventoried'].includes(t.state)||!Array.isArray(t.regions)||t.regions.some((v:unknown)=>typeof v!=='string'||!Object.hasOwn(coverageRegions,v))||typeof t.reason!=='string')throw Error('Invalid target');
   return {id:t.id,label:labels[t.id as keyof typeof labels],state:t.state,regions:[...t.regions],reason:t.reason};
  });
  return {sourceRevision:s.sourceRevision,inventoryRevision:hash,
   counts:{root:c.root.rootRepresentations,nested:c.nested.nestedSelections,specimenViews:c.independent.independentViews,specimenMemberships:c.independent.independentSelectionMemberships,specimenSelections:c.independent.independentFrameQualifiedSelectionIds,shoulder:c.independent.dedicatedShoulderSelections},targets,
   reference:{files:c.reference.referenceFiles,differences:c.reference.currentRootDifferences,nested:r['admitted-current-or-reachable-nested'],corrected:r['reviewed-source-difference-or-overlap'],held:r['source-condition-or-identity-hold'],unsupported:r['unsupported-no-current-evidence']}};
 }catch{return null;}
}
/** Call after reviewer authorization; only a sanitized summary leaves this loader. */
export async function verifiedCoverageView():Promise<CoverageView|null>{
 const [{default:snapshot},{default:manifest}]=await Promise.all([import('../docs/anatomy-coverage/index.json'),import('../atlas-review/manifest.json')]);
 return projectCoverageView(snapshot,manifest);
}

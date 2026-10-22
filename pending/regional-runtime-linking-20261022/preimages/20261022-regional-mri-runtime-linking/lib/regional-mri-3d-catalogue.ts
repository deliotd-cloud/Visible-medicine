import raw from '../atlas-review/public/models/bodyparts3d/full-body/catalog.json';
import review from '../atlas-review/manifest.json';
import learner from '../public/atlas-runtime/head-neck/manifest.json';
import limb from '../public/atlas-runtime/lower-limb/manifest.json';
import viewer from '../public/atlas-review-viewer/manifest.json';
import {bodyDisplayCatalog} from '../atlas-review/lib/body-display-catalog';
import type {BodyCatalog} from '../atlas-review/app/body-types';
import {parseStudyLink,resolveStudyLink} from '../atlas-review/lib/study-links';
import {makeSpecimenLink,resolveSpecimenLink} from '../atlas-review/lib/um-limb-navigation';
import {parseSpecimenLink} from '../atlas-review/lib/specimen-links';
import {kneeDefinition} from '../atlas-review/lib/um-limb-studies';
import {kneeReferenceSpecs,kneeBodyReferenceId,kneeReferencePin} from './regional-knee-3d-mappings';
import {buildRegionalLearningCatalogue} from './regional-mri-learning-catalogue';
import type {Regional3dCatalogue,Regional3dTarget} from './regional-mri-3d-comparison';
const canonical=bodyDisplayCatalog(raw as unknown as BodyCatalog);
const identities=new Map(canonical.structures.map(s=>[s.id,JSON.stringify(s)]));
const bundles=new Map(canonical.bundles.map(b=>[b.id,JSON.stringify(b)]));
type Binding={reviewRevision:unknown;learnerRevision:unknown;limbRevision:unknown;viewerRevision:unknown;reviewIntegration:unknown;viewerIntegration:unknown};
const current:Binding={reviewRevision:review.revision,learnerRevision:learner.sourceCommit,limbRevision:limb.sourceCommit,viewerRevision:viewer.sourceCommit,
 reviewIntegration:review.websiteIntegrationSha256,viewerIntegration:viewer.websiteIntegrationSha256};
/** Server projection only: original catalogue coordinates and source scans never reach the client. */
export async function buildRegionalMri3dCatalogue(source:{revision:string;region:string},catalog:BodyCatalog=canonical,binding:Binding=current):Promise<Regional3dCatalogue|null>{
 if(source.region!=='knee'||!/^[a-f0-9]{64}$/.test(source.revision)||typeof binding.reviewRevision!=='string'||! /^[a-f0-9]{40}$/.test(binding.reviewRevision)||
  [binding.learnerRevision,binding.limbRevision,binding.viewerRevision].some(r=>r!==binding.reviewRevision)||typeof binding.reviewIntegration!=='string'||
  !/^[a-f0-9]{64}$/.test(binding.reviewIntegration)||binding.reviewIntegration!==binding.viewerIntegration)return null;
 const revision=binding.reviewRevision,entries:Regional3dCatalogue['entries']=[];
 for(const side of ['left','right'] as const)for(const anatomyId of [...new Set(kneeReferenceSpecs.map(s=>s.anatomyId))]){
  const targets:Regional3dTarget[]=[];
  for(const spec of kneeReferenceSpecs.filter(s=>s.anatomyId===anatomyId)){
   const pin=kneeReferencePin(spec,side);
   if(spec.kind==='body'){
    const id=kneeBodyReferenceId(spec,side)!,matches=catalog.structures.filter(s=>s.id===id);if(matches.length!==1)continue;
    const s=matches[0],matchesBundle=catalog.bundles.filter(b=>b.id===s.bundle);if(matchesBundle.length!==1)continue;
    const bundle=matchesBundle[0];if(identities.get(id)!==JSON.stringify(s)||bundles.get(bundle.id)!==JSON.stringify(bundle)||s.laterality!==side||bundle.sha256!==pin.sourceHash||s.name!==pin.label)continue;
    const params={study:'1',structure:id,side,source:bundle.sha256};
    if(resolveStudyLink(catalog,spec.region,parseStudyLink(params)).status!=='ready')continue;
    targets.push({kind:'body',id,label:s.name,side,region:spec.region as 'leg'|'thigh',sourceHash:bundle.sha256,specimenRevision:null,relation:spec.relation,
     href:'/atlas/3d?'+new URLSearchParams({region:spec.region,...params,atlasRevision:revision})});
   }else{
    const s=kneeDefinition.surfaces.find(s=>s.slug===spec.slug);if(!s||s.laterality!=='right-source-report')continue;
    const href=makeSpecimenLink(kneeDefinition,{selectedId:s.id,view:'anterior'});if(!href)continue;
    const url=new URL(href,'https://visible-medicine.invalid'),parsed=parseSpecimenLink(Object.fromEntries(url.searchParams));
    if(resolveSpecimenLink(parsed).status!=='ready'||parsed.status!=='requested'||parsed.request.sourceHash!==pin.sourceHash||parsed.request.revision!==pin.specimenRevision||s.name!==pin.label)continue;
    targets.push({kind:'specimen',id:s.id,label:s.name,side:'right',region:'knee',sourceHash:parsed.request.sourceHash,specimenRevision:parsed.request.revision,
     relation:spec.relation,href:'/atlas/lower-limb-3d?'+url.searchParams+'&atlasRevision='+revision});
   }
  }
  if(targets.length)entries.push({anatomyId,sourceSide:side,targets});
 }
 const bytes=new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:revision,entries}));
 const digest=await crypto.subtle.digest('SHA-256',bytes),mappingRevision=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 const result:Regional3dCatalogue={schema:'visible-medicine.regional-mri-3d/1',mriRevision:source.revision,atlasRevision:revision,mappingRevision,entries};
 const learning=await buildRegionalLearningCatalogue(result,catalog);
 if(learning)result.learning=learning;
 return result;
}
export const regionalMri3dCatalogue=buildRegionalMri3dCatalogue;

import {assertRegionalMriPackageOwnership,type RegionalMriPackage,type RegionalLoadedSeries,type RegionalLoadedAnnotation} from './regional-mri-package.ts';
import type {RegionalLearningCatalogue} from './regional-mri-learning.ts';
import {kneeReferenceSpecs,kneeBodyReferenceId,kneeReferencePin,type KneeReferenceSpec} from './regional-knee-3d-mappings.ts';
export type Regional3dTarget={kind:'body'|'specimen';id:string;label:string;side:'left'|'right';region:'leg'|'thigh'|'knee';
 sourceHash:string;specimenRevision:string|null;relation:KneeReferenceSpec['relation'];href:string};
export type Regional3dCatalogue={schema:'visible-medicine.regional-mri-3d/1';mriRevision:string;atlasRevision:string;mappingRevision:string;
 entries:{anatomyId:string;sourceSide:'left'|'right';targets:Regional3dTarget[]}[];learning?:RegionalLearningCatalogue};
type BoundSource={revision:string;region:string};
const hash=/^[a-f0-9]{64}$/,commit=/^[a-f0-9]{40}$/;
export function regionalMri3dTargetCurrent(target:Regional3dTarget,spec:KneeReferenceSpec,side:'left'|'right',revision:string):boolean{
 const pin=kneeReferencePin(spec,side);
 if(target.kind!==spec.kind||target.region!==spec.region||target.relation!==spec.relation||!hash.test(target.sourceHash)||
  target.sourceHash!==pin.sourceHash||target.specimenRevision!==pin.specimenRevision||target.label!==pin.label||!['left','right'].includes(target.side)||
  typeof target.href!=='string'||!target.href.startsWith('/atlas/'))return false;
 const url=new URL(target.href,'https://visible-medicine.invalid');
 if(url.origin!=='https://visible-medicine.invalid'||url.hash||url.username||url.password)return false;
 const params=url.searchParams,keys=[...params.keys()];if(new Set(keys).size!==keys.length||params.get('atlasRevision')!==revision)return false;
 if(spec.kind==='body')return target.side===side&&target.id===kneeBodyReferenceId(spec,side)&&target.specimenRevision===null&&url.pathname==='/atlas/3d'&&
  keys.length===6&&['region','study','structure','side','source','atlasRevision'].every(k=>keys.includes(k))&&params.get('region')===spec.region&&params.get('study')==='1'&&
  params.get('structure')===target.id&&params.get('side')===side&&params.get('source')===target.sourceHash;
 return target.side==='right'&&target.id===`vm:reference:um-5t6tz7-v1-2:knee:${spec.slug}`&&typeof target.specimenRevision==='string'&&hash.test(target.specimenRevision)&&
  url.pathname==='/atlas/lower-limb-3d'&&keys.length===7&&['specimen','specimenScope','specimenPart','specimenSource','specimenRevision','specimenView','atlasRevision'].every(k=>keys.includes(k))&&
  params.get('specimen')==='um-limb-1'&&params.get('specimenScope')==='knee'&&params.get('specimenPart')===target.id&&params.get('specimenSource')===target.sourceHash&&
  params.get('specimenRevision')===target.specimenRevision&&params.get('specimenView')==='anterior';
}
/** Reference navigation only. No patient positions, source identifiers or image revision enter a URL. */
export function regionalMri3dComparison(source:BoundSource,catalogue:Regional3dCatalogue|null,pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation){
 try{
  assertRegionalMriPackageOwnership(pkg,study,overlay);
  const a=overlay.annotation;
  if(!catalogue||catalogue.schema!=='visible-medicine.regional-mri-3d/1'||!hash.test(source.revision)||source.revision!==pkg.revision||
   source.region!=='knee'||pkg.manifest.region!==source.region||catalogue.mriRevision!==source.revision||!commit.test(catalogue.atlasRevision)||!hash.test(catalogue.mappingRevision)||
   !Array.isArray(catalogue.entries)||catalogue.entries.length>200||!['left','right'].includes(a.laterality)||a.review.status==='deferred'||a.geometry.kind==='none')return null;
  const side=a.laterality as 'left'|'right',matches=catalogue.entries.filter(e=>e.anatomyId===a.anatomyId&&e.sourceSide===side);
  if(matches.length!==1)return null;
  const row=matches[0];if(!Array.isArray(row.targets)||!row.targets.length||row.targets.length>3)return null;
  const specs=kneeReferenceSpecs.filter(s=>s.anatomyId===a.anatomyId),seen=new Set();
  for(const target of row.targets){const spec=specs.find(s=>s.kind===target.kind);
   if(!spec||seen.has(target.id)||!regionalMri3dTargetCurrent(target,spec,side,catalogue.atlasRevision))return null;seen.add(target.id);}
  return Object.freeze({anatomyId:a.anatomyId,sourceSide:side,reviewStatus:a.review.status,sourceReviewRevision:a.review.revision,
   atlasRevision:catalogue.atlasRevision,mappingRevision:catalogue.mappingRevision,provisional:overlay.purpose==='provisional-inspection',
   targets:row.targets.map(t=>Object.freeze({...t,oppositeSide:t.side!==side}))});
 }catch{return null;}
}

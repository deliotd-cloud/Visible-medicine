import {regionalMri3dComparison,type Regional3dCatalogue} from './regional-mri-3d-comparison.ts';
import type {RegionalMriPackage,RegionalLoadedSeries,RegionalLoadedAnnotation} from './regional-mri-package.ts';

export type RegionalMriInlineInspection={
 key:string;src:string;manifestUrl:string;runtimeRegion:string;atlasRevision:string;mappingRevision:string;
 mri:Readonly<{revision:string;seriesId:string;seriesLabel:string;imageSha256:string;annotationId:string;anatomyId:string;label:string;
  side:string;coverage:string;reviewStatus:string;reviewRevision:string;reviewScope:string;geometryKind:string;gridKind:string|null;geometryMappingRevision:string|null}>;
 target:Readonly<{id:string;label:string;kind:'body'|'specimen';side:'left'|'right';sourceHash:string;specimenRevision:string|null;
  relation:'same-structure'|'parent-reference'|'group-reference';oppositeSide:boolean;href:string}>;
 provisional:boolean;
};
const inspections=new WeakSet<object>();
const inspectionContexts=new WeakMap<object,{pkg:RegionalMriPackage;study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation;
 catalogue:Regional3dCatalogue|null;sourceRevision:string;sourceRegion:string;catalogueSnapshot:string}>();
/** Private in-memory ownership, not clinical approval or a saved review decision. */
export function isRegionalMriInlineInspection(value:unknown):value is RegionalMriInlineInspection{
 return !!value&&typeof value==='object'&&inspections.has(value);
}
/** Exact loader objects and original mapping snapshot; a copied proof cannot borrow another package. */
export function regionalMriInlineContextCurrent(inspection:RegionalMriInlineInspection,source:{revision:string;region:string},
 catalogue:Regional3dCatalogue|null,pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation):boolean{
 const owner=inspectionContexts.get(inspection);
 return !!owner&&owner.pkg===pkg&&owner.study===study&&owner.overlay===overlay&&owner.catalogue===catalogue&&
  owner.sourceRevision===source.revision&&owner.sourceRegion===source.region&&owner.catalogueSnapshot===JSON.stringify(catalogue)&&
  regionalMri3dComparison(source,catalogue,pkg,study,overlay)!==null;
}
/** A mounted specimen frame may be retained only within this exact source family. */
export function regionalMriInlineFamilyKey(value:RegionalMriInlineInspection):string|null{
 if(!isRegionalMriInlineInspection(value)||value.target.kind!=='specimen')return null;
 const {mri,target}=value;
 const url=new URL(value.src,'https://visible-medicine.invalid');
 if(url.origin!=='https://visible-medicine.invalid'||url.pathname!=='/atlas-runtime/lower-limb/index.html')return null;
 url.searchParams.delete('specimenPart');
 return JSON.stringify([value.runtimeRegion,url.pathname+'?'+url.searchParams,value.manifestUrl,value.atlasRevision,value.mappingRevision,
  target.kind,target.side,target.sourceHash,target.specimenRevision,target.relation,mri.revision,mri.seriesId,
  mri.imageSha256,mri.side,value.provisional]);
}
export function regionalMriInlineCompatible(a:RegionalMriInlineInspection,b:RegionalMriInlineInspection):boolean{
 const first=regionalMriInlineReferenceFamilyKey(a),second=regionalMriInlineReferenceFamilyKey(b);
 return first!==null&&first===second;
}
/** Separate opt-in root-body family; the legacy specimen-only family stays unchanged. */
export function regionalMriInlineBodyFamilyKey(value:RegionalMriInlineInspection):string|null{
 if(!isRegionalMriInlineInspection(value)||value.target.kind!=='body'||value.runtimeRegion!=='head-neck')return null;
 const {mri,target}=value,url=new URL(value.src,'https://visible-medicine.invalid'),q=url.searchParams;
 const keys=[...q.keys()],region=q.get('region');
 if(url.origin!=='https://visible-medicine.invalid'||url.pathname!=='/atlas-runtime/head-neck/index.html'||url.hash||
  value.manifestUrl!=='/atlas-runtime/head-neck/manifest.json'||!['leg','thigh'].includes(region??'')||
  keys.length!==5||new Set(keys).size!==5||!['region','study','structure','side','source'].every(key=>keys.includes(key))||
  q.get('study')!=='1'||q.get('structure')!==target.id||q.get('source')!==target.sourceHash||q.get('side')!==target.side||
  target.side!==mri.side||target.oppositeSide||target.specimenRevision!==null)return null;
 q.delete('structure');q.delete('source');
 return JSON.stringify(['body-root',region,url.pathname+'?'+q,value.manifestUrl,value.atlasRevision,value.mappingRevision,
  target.kind,target.side,target.relation,mri.revision,mri.seriesId,mri.imageSha256,mri.side,value.provisional]);
}
export function regionalMriInlineReferenceFamilyKey(value:RegionalMriInlineInspection):string|null{
 return regionalMriInlineFamilyKey(value)??regionalMriInlineBodyFamilyKey(value);
}
/** Only public reference navigation enters an iframe; MRI identity stays in this page. */
export function regionalMriInlineInspection(source:{revision:string;region:string},catalogue:Regional3dCatalogue|null,
 pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,targetId:string):RegionalMriInlineInspection|null{
 const comparison=regionalMri3dComparison(source,catalogue,pkg,study,overlay);
 if(!comparison||typeof targetId!=='string')return null;
 const targets=comparison.targets.filter(t=>t.id===targetId);if(targets.length!==1)return null;
 const target=targets[0],url=new URL(target.href,'https://visible-medicine.invalid'),query=url.searchParams;
 query.delete('atlasRevision');
 const root=target.kind==='body',base='/atlas-runtime/'+(root?'head-neck':'lower-limb');
 const a=overlay.annotation,g=a.geometry;
 const mri=Object.freeze({revision:pkg.revision,seriesId:study.series.id,seriesLabel:study.series.label,imageSha256:study.series.image.sha256,
  annotationId:a.id,anatomyId:a.anatomyId,label:a.label,side:a.laterality,coverage:a.coverage,reviewStatus:a.review.status,
  reviewRevision:a.review.revision,reviewScope:a.review.scope,geometryKind:g.kind,gridKind:g.kind==='mask'?g.gridKind:null,
  geometryMappingRevision:g.kind==='mask'?g.mappingRevision:null});
 const result=Object.freeze({key:JSON.stringify([pkg.revision,study.series.id,a.id,a.review.revision,comparison.mappingRevision,comparison.atlasRevision,target.id,target.sourceHash,target.specimenRevision]),
  src:base+'/index.html?'+query,manifestUrl:base+'/manifest.json',runtimeRegion:root?'head-neck':'independent-right-lower-limb',
  atlasRevision:comparison.atlasRevision,mappingRevision:comparison.mappingRevision,mri,
  target:Object.freeze({...target}),provisional:comparison.provisional});
 inspections.add(result);inspectionContexts.set(result,{pkg,study,overlay,catalogue,sourceRevision:source.revision,
  sourceRegion:source.region,catalogueSnapshot:JSON.stringify(catalogue)});return result;
}
/** Check the current generated runtime and retained model bundle before loading it. */
export function regionalMriInlineManifestCurrent(inspection:RegionalMriInlineInspection,manifest:unknown):boolean{
 if(!isRegionalMriInlineInspection(inspection)||!manifest||typeof manifest!=='object'||Array.isArray(manifest))return false;
 const m=manifest as Record<string,unknown>;
 if(m.sourceCommit!==inspection.atlasRevision||m.region!==inspection.runtimeRegion||m.patientDataIncluded!==false||!Array.isArray(m.files))return false;
 const matches=m.files.filter(f=>f&&typeof f==='object'&&typeof f.path==='string'&&f.path.endsWith('.glb')&&f.sha256===inspection.target.sourceHash);
 return matches.length===1&&matches[0].path.startsWith('models/')&&!matches[0].path.includes('..')&&!matches[0].path.includes('\\');
}

import {assertRegionalMriPackageOwnership,type RegionalMriPackage,type RegionalLoadedSeries,type RegionalLoadedAnnotation,type RegionalAnnotation} from './regional-mri-package.ts';
import {regionalMriInlineContextCurrent,type RegionalMriInlineInspection} from './regional-mri-inline-inspection.ts';
import {isCurrentRegionalMriBodySelection,type RegionalMriBodySelection} from './regional-mri-body-focus.ts';
import {regionalMri3dTargetCurrent,type Regional3dCatalogue} from './regional-mri-3d-comparison.ts';
import {kneeReferenceSpecs} from './regional-knee-3d-mappings.ts';

export type RegionalMriBodyHandoff=Readonly<{annotation:RegionalAnnotation;label:string;targetId:string}>;

/** Explicit semantic navigation within the loaded native sequence; no scan switch or registration. */
export function regionalMriBodyHandoff(source:{revision:string;region:string},catalogue:Regional3dCatalogue|null,
 pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,
 inspection:RegionalMriInlineInspection,selection:RegionalMriBodySelection):RegionalMriBodyHandoff|null{
 try{
  assertRegionalMriPackageOwnership(pkg,study,overlay);
  if(!isCurrentRegionalMriBodySelection(selection)||!catalogue||
   !regionalMriInlineContextCurrent(inspection,source,catalogue,pkg,study,overlay)||
   inspection.target.kind!=='body'||inspection.target.relation!=='same-structure'||
   inspection.target.oppositeSide||inspection.provisional||overlay.purpose!=='scoped-display'||
   overlay.annotation.review.status!=='accepted-scoped'||selection.atlasRevision!==inspection.atlasRevision||
   selection.target.kind!=='root')return null;
  const side=overlay.annotation.laterality;
  if(side!=='left'&&side!=='right'||selection.target.laterality!==side)return null;
  const ownedHref=new URL(inspection.target.href,'https://visible-medicine.invalid');
  const region=ownedHref.searchParams.get('region');
  if((region!=='leg'&&region!=='thigh')||selection.region!==region||
   ownedHref.searchParams.get('structure')!==inspection.target.id||
   ownedHref.searchParams.get('source')!==inspection.target.sourceHash||
   ownedHref.searchParams.get('side')!==side)return null;
  // Count all authored matches before inspecting eligibility. A held duplicate still makes mapping ambiguous.
  const rows=catalogue.entries.filter(row=>row.sourceSide===side&&row.targets.some(target=>
   target.kind==='body'&&target.id===selection.target.id));
  if(rows.length!==1)return null;
  const row=rows[0],specs=kneeReferenceSpecs.filter(spec=>spec.anatomyId===row.anatomyId);
  if(!Array.isArray(row.targets)||!row.targets.length||row.targets.length>3||
   new Set(row.targets.map(target=>target.id)).size!==row.targets.length)return null;
  for(const target of row.targets){
   const spec=specs.find(spec=>spec.kind===target.kind);
   if(!spec||!regionalMri3dTargetCurrent(target,spec,side,catalogue.atlasRevision))return null;
  }
  const targets=row.targets.filter(target=>target.kind==='body'&&target.relation==='same-structure'&&
   target.id===selection.target.id&&target.side===side&&target.region===region&&
   target.sourceHash===selection.target.source&&target.href.startsWith('/atlas/3d?'));
  if(targets.length!==1)return null;
  const candidates=study.series.annotations.filter(annotation=>annotation.anatomyId===row.anatomyId&&annotation.laterality===side);
  if(candidates.length!==1)return null;
  const annotation=candidates[0];
  if(annotation===overlay.annotation||annotation.review.status!=='accepted-scoped'||annotation.geometry.kind==='none'||
   annotation.seriesId!==study.series.id||annotation.sourceImageSha256!==study.series.image.sha256)return null;
  return Object.freeze({annotation,label:annotation.label,targetId:targets[0].id});
 }catch{return null;}
}

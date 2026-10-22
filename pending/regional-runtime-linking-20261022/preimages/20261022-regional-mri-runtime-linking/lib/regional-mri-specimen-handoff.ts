import {assertRegionalMriPackageOwnership,type RegionalMriPackage,type RegionalLoadedSeries,type RegionalLoadedAnnotation,type RegionalAnnotation} from './regional-mri-package.ts';
import {regionalMriInlineContextCurrent,type RegionalMriInlineInspection} from './regional-mri-inline-inspection.ts';
import {isCurrentRegionalMriSpecimenSelection,type RegionalMriSpecimenSelection} from './regional-mri-specimen-focus.ts';
import {regionalMri3dTargetCurrent,type Regional3dCatalogue} from './regional-mri-3d-comparison.ts';
import {kneeReferenceSpecs} from './regional-knee-3d-mappings.ts';

export type RegionalMriSpecimenHandoff=Readonly<{annotation:RegionalAnnotation;label:string;targetId:string}>;
/** Explicit semantic navigation within the already loaded sequence; never image registration. */
export function regionalMriSpecimenHandoff(source:{revision:string;region:string},catalogue:Regional3dCatalogue|null,
 pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,
 inspection:RegionalMriInlineInspection,selection:RegionalMriSpecimenSelection):RegionalMriSpecimenHandoff|null{
 try{
  assertRegionalMriPackageOwnership(pkg,study,overlay);
  if(!isCurrentRegionalMriSpecimenSelection(selection)||
   !regionalMriInlineContextCurrent(inspection,source,catalogue,pkg,study,overlay)||!catalogue||
   inspection.target.kind!=='specimen'||inspection.provisional||overlay.purpose!=='scoped-display'||
   overlay.annotation.review.status!=='accepted-scoped'||selection.atlasRevision!==inspection.atlasRevision||
   selection.target.scope!=='knee'||selection.target.laterality!=='right-source-report'||
   selection.target.source!==inspection.target.sourceHash||selection.target.revision!==inspection.target.specimenRevision)return null;
  const side=overlay.annotation.laterality;
  if(side!=='left'&&side!=='right')return null;
  const rows=catalogue.entries.filter(row=>row.sourceSide===side&&row.targets.some(target=>
   target.kind==='specimen'&&target.relation==='same-structure'&&target.id===selection.target.id));
  if(rows.length!==1)return null;
  const row=rows[0],specs=kneeReferenceSpecs.filter(spec=>spec.anatomyId===row.anatomyId);
  if(!Array.isArray(row.targets)||!row.targets.length||row.targets.length>3||new Set(row.targets.map(target=>target.id)).size!==row.targets.length)return null;
  for(const target of row.targets){const spec=specs.find(spec=>spec.kind===target.kind);
   if(!spec||!regionalMri3dTargetCurrent(target,spec,side,catalogue.atlasRevision))return null;}
  const targets=row.targets.filter(target=>target.kind==='specimen'&&target.relation==='same-structure'&&
   target.id===selection.target.id&&target.sourceHash===selection.target.source&&target.specimenRevision===selection.target.revision);
  if(targets.length!==1)return null;
  // Reject duplicate semantic identities, including held duplicates; do not pick the first accepted one.
  const candidates=study.series.annotations.filter(annotation=>annotation.anatomyId===row.anatomyId&&annotation.laterality===side);
  if(candidates.length!==1)return null;
  const annotation=candidates[0];
  if(annotation===overlay.annotation||annotation.review.status!=='accepted-scoped'||annotation.geometry.kind==='none'||
   annotation.seriesId!==study.series.id||annotation.sourceImageSha256!==study.series.image.sha256)return null;
  return Object.freeze({annotation,label:annotation.label,targetId:targets[0].id});
 }catch{return null;}
}

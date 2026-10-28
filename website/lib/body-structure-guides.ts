import {regionalTours} from '../atlas-review/lib/regional-tours';
import {resolveLectureBodyReference} from './lecture-body-reference';
import {regionalLearningCatalogue} from './regional-learning-catalogue';
import {regionalTourStepHref} from './regional-tour-entry-navigation';

export type BodyStructureGuide={
  id:string;label:string;regionLabel:string;step:number;total:number;href:string;
};

/** Current, admitted draft tours whose authored stop selects this exact structure. */
export function bodyStructureGuides(reference:unknown):BodyStructureGuide[]{
  const body=resolveLectureBodyReference(reference);
  if(!body)return [];
  const catalogue=regionalLearningCatalogue();
  if(!catalogue.available||catalogue.sourceRevision!==body.atlasRevision)return [];
  const guides:BodyStructureGuide[]=[];
  for(const projected of catalogue.tours){
    const tour=regionalTours.find(item=>item.id===projected.id);
    if(!tour||tour.status!=='draft'||tour.revision!==projected.revision||
      tour.region!==projected.regionId||tour.title!==projected.title||
      tour.steps.length!==projected.steps.length)continue;
    const index=tour.steps.findIndex(step=>step.selectedId===body.structureId);
    if(index<0)continue;
    const href=regionalTourStepHref(projected,catalogue.sourceRevision,index);
    if(href)guides.push({id:projected.id,label:projected.title,
      regionLabel:projected.regionLabel,step:index+1,total:tour.steps.length,href});
  }
  return guides;
}

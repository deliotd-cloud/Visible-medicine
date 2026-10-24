import type {BodyCatalog,BodyStructure} from '../app/body-types';
import {sourceCanonical} from './body-source-additions';
import {regionalTours,regionalTourFrame,regionalTourStructures,type RegionalTour} from './regional-tours';

const registered=new Map(regionalTours.map(tour=>[tour,sourceCanonical(tour)]));

export type TourExploreRequest={
  catalog:BodyCatalog;
  catalogSignature:string;
  tour:RegionalTour;
  tourSignature:string;
  tourId:string;
  revision:string;
  stepId:string;
  stepIndex:number;
  selectedId:string;
  sourceRecord:BodyStructure;
};

/** A request is useful only for the exact registered stop and source object that produced it. */
export function tourExploreRequest(catalog:BodyCatalog,tour:RegionalTour,stepIndex:number):TourExploreRequest|null {
  try {
    const signature=registered.get(tour);
    if(!signature||signature!==sourceCanonical(tour)||!Number.isInteger(stepIndex))return null;
    const step=tour.steps[stepIndex];
    if(!step||!step.id||tour.steps.filter(candidate=>candidate.id===step.id).length!==1)return null;
    const selected=regionalTourStructures(catalog,tour).filter(s=>s.id===step.selectedId);
    if(selected.length!==1||catalog.structures.filter(s=>s.id===step.selectedId).length!==1)return null;
    regionalTourFrame(catalog,tour,stepIndex);
    return {catalog,catalogSignature:sourceCanonical(catalog),tour,tourSignature:signature,
      tourId:tour.id,revision:tour.revision,stepId:step.id,stepIndex,
      selectedId:selected[0].id,sourceRecord:structuredClone(selected[0])};
  }catch{return null;}
}

export function resolveTourExplore(catalog:BodyCatalog,region:string,request:TourExploreRequest):
  {structure:BodyStructure;tour:RegionalTour;step:RegionalTour['steps'][number]}|null {
  try {
    if(!request||request.catalog!==catalog||request.catalogSignature!==sourceCanonical(catalog)||
      !registered.has(request.tour)||registered.get(request.tour)!==request.tourSignature||
      request.tourSignature!==sourceCanonical(request.tour)||
      (region!=='whole-body'&&request.tour.region!==region)||
      !Number.isInteger(request.stepIndex))return null;
    const step=request.tour.steps[request.stepIndex];
    if(!step||request.tourId!==request.tour.id||request.revision!==request.tour.revision||
      request.stepId!==step.id||request.selectedId!==step.selectedId||
      request.tour.steps.filter(candidate=>candidate.id===step.id).length!==1)return null;
    const structures=regionalTourStructures(catalog,request.tour);
    const selected=structures.filter(s=>s.id===request.selectedId);
    if(selected.length!==1||catalog.structures.filter(s=>s.id===request.selectedId).length!==1||
      sourceCanonical(selected[0])!==sourceCanonical(request.sourceRecord))return null;
    regionalTourFrame(catalog,request.tour,request.stepIndex);
    return {structure:selected[0],tour:request.tour,step};
  }catch{return null;}
}

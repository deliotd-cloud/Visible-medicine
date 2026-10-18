import review from '../atlas-review/manifest.json';
import learner from '../public/atlas-runtime/head-neck/manifest.json';
import viewer from '../public/atlas-review-viewer/manifest.json';
import raw from '../atlas-review/public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from '../atlas-review/lib/body-display-catalog';
import {regionalTours,regionalTourStructures,regionalTourFrame,regionalTourLimitations,type RegionalTour} from '../atlas-review/lib/regional-tours';
import type {BodyCatalog} from '../atlas-review/app/body-types';
import {atlasBodyRegions} from './atlas-navigation';
import type {RegionalLearningCatalogueData,RegionalLearningTour} from './regional-learning-discovery';

const identities=new Map(regionalTours.map(tour=>[tour.id,JSON.stringify(tour)]));
type Binding={reviewRevision:unknown;learnerRevision:unknown;viewerRevision:unknown;reviewIntegration:unknown;viewerIntegration:unknown};
const unavailable=():RegionalLearningCatalogueData=>({available:false,sourceRevision:null,unavailableTours:0,regions:[],tours:[]});

/** Discovery only. Reuse current generated-source admission/frame checks; never
 * infer image correspondence, entitlements, clinical approval or a tour launch. */
export function buildRegionalLearningCatalogue(catalog:BodyCatalog,tours:RegionalTour[],binding:Binding):RegionalLearningCatalogueData{
  if(typeof binding.reviewRevision!=='string'||!/^[a-f0-9]{40}$/.test(binding.reviewRevision)||
    binding.reviewRevision!==binding.learnerRevision||binding.reviewRevision!==binding.viewerRevision||
    typeof binding.reviewIntegration!=='string'||!/^[a-f0-9]{64}$/.test(binding.reviewIntegration)||
    binding.reviewIntegration!==binding.viewerIntegration||!Array.isArray(tours)||
    tours.length>200||new Set(tours.map(tour=>tour.id)).size!==tours.length)return unavailable();
  const result:RegionalLearningTour[]=[];let unavailableTours=0;
  for(const tour of tours){
    try{
      if(identities.get(tour.id)!==JSON.stringify(tour)||tour.status!=='draft'||!tour.steps.length)throw Error('Tour changed');
      const destination=atlasBodyRegions.find(region=>region.id===tour.region);
      if(!destination)throw Error('Region unavailable');
      const structures=regionalTourStructures(catalog,tour);
      const names=new Map(structures.map(structure=>[structure.id,structure.name]));
      // Ensure an advertised sequence can frame every authored stop, without
      // moving its camera, loading a model, or projecting frame data to clients.
      const steps=tour.steps.map((step,index)=>{
        regionalTourFrame(catalog,tour,index);
        const structureName=names.get(step.selectedId);
        if(!structureName)throw Error('Target unavailable');
        return {title:step.title,structureName};
      });
      result.push({id:tour.id,title:tour.title,description:tour.description,revision:tour.revision,
        regionId:destination.id,regionLabel:destination.label,href:destination.href,
        limitations:regionalTourLimitations(tour),steps});
    }catch{unavailableTours++;}
  }
  return {available:true,sourceRevision:binding.reviewRevision,unavailableTours,
    regions:atlasBodyRegions.filter(region=>result.some(tour=>tour.regionId===region.id)).map(region=>({id:region.id,label:region.label})),tours:result};
}

/** Server-side projection: no source meshes, file hashes, held private reference
 * assets, raw camera coordinates, review decisions or scan data reach this UI. */
export function regionalLearningCatalogue():RegionalLearningCatalogueData{
  try{return buildRegionalLearningCatalogue(bodyDisplayCatalog(raw as unknown as BodyCatalog),regionalTours,{
    reviewRevision:review.revision,learnerRevision:learner.sourceCommit,viewerRevision:viewer.sourceCommit,
    reviewIntegration:review.websiteIntegrationSha256,viewerIntegration:viewer.websiteIntegrationSha256,
  });}catch{return unavailable();}
}

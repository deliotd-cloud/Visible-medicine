import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/orbital-nerve-tour-pins.json' with {type:'json'};

const fmas=['FMA52622','FMA52639','FMA52629','FMA52669','FMA82734','FMA53549'];
if(pins.entries.length!==fmas.length||pins.entries.some((entry,i)=>entry.fmaId!==fmas[i])||
  pins.contextEntries.length!==1||pins.contextEntries[0].fmaId!=='FMA12514'||
  pins.tourRevision!=='right-orbital-nerve-orientation-v1')
  throw Error('Unexpected orbital-nerve tour source pins.');
const entries=pins.entries,admitted=[...entries,...pins.contextEntries];
const eye='https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
const autonomics='https://anatomy.ttuhscep.edu/modules/intro_autonomics_2_module/autonomics_09.html';
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string,references=[eye]):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view,caption,references,
  frameIds:[entries[i].id,pins.contextEntries[0].id],durationMs:14000,fadeOthers:true,
});

/** Source exterior surfaces in a common frame; the tour does not reconstruct fibre paths. */
export const orbitalNerveTour:RegionalTour={
  id:'right-orbital-nerve-orientation',
  title:'Right orbital nerves: V1 branches and ciliary ganglion',
  region:'head-neck',revision:pins.tourRevision,status:'draft',
  description:'Six stops orient selected right orbital nerve surfaces and the ciliary ganglion against the corrected right eyeball.',
  limitations:'Selected, anatomically unvalidated exterior source surfaces and partial courses only. The right eyeball is a corrected source surface, not a complete orbit. Gaps or proximity cannot establish a synapse, fibre tracing, an unshown branch, functional or nuclear map, or complete orbital route. No acquired scan or patient-space registration. Draft pending radiologist sign-off for this exact source and tour revision.',
  contextIds:pins.contextEntries.map(entry=>entry.id),
  requiredDisplayBundles:Object.fromEntries(admitted.map(entry=>[entry.id,entry.bundle])),
  steps:[
    stop(0,'ophthalmic','Ophthalmic nerve · V1','right',
      'Start with V1, the ophthalmic trigeminal division. Its frontal, lacrimal and nasociliary branches carry sensation. The faded globe orients this partial surface.'),
    stop(1,'frontal','Frontal nerve · Forehead sensation','superior',
      'Frontal nerve divides into supraorbital and supratrochlear branches, serving forehead and upper-eyelid sensation. Those terminal branches are not displayed here.'),
    stop(2,'lacrimal','Lacrimal nerve · Lateral branch','right',
      'Lacrimal nerve carries sensation from the lateral upper eyelid and adjacent conjunctiva. Compare its surface with the globe; gland connections are not established.'),
    stop(3,'nasociliary','Nasociliary nerve · Branch comparison','superior',
      'Nasociliary nerve gives rise to long ciliary nerves. Compare these separate surfaces without assuming that a visible gap or junction proves fibre continuity.'),
    stop(4,'long-ciliary','Long ciliary nerve · Bypasses ganglion','left',
      'Long ciliary nerves convey eyeball sensation and bypass the ciliary ganglion. This labelled surface provides orientation, not a verified continuous nerve route.'),
    stop(5,'ciliary-ganglion','Ciliary ganglion · Parasympathetic relay','right',
      'Oculomotor parasympathetic fibres synapse in the ciliary ganglion; outgoing fibres travel in short ciliary nerves. This relay is not the next V1 segment. Its exterior surface does not depict those connections.',[eye,autonomics]),
  ],
};

const tourIdentity=sourceCanonical(orbitalNerveTour);
const records=new Map(admitted.map(entry=>[entry.id,sourceCanonical(entry)]));
const identities=new Set(admitted.map(entry=>entry.fmaId));
export function orbitalNerveTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==tourIdentity||catalog.sourceVersion!==pins.sourceVersion||
    catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||identities.has(s.fmaId));
  if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||
    !found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(bundle=>{
    const found=catalog.bundles.filter(b=>b.id===bundle.id);
    return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);
  });
}

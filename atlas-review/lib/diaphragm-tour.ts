import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/diaphragm-tour-pins.json' with {type:'json'};

const targetFmas=['FMA13295','FMA7131','FMA87217','FMA3789','FMA10951'];
const contextFmas=['FMA7148'];
if(pins.baseline!=='214cec892da967a8057ab1647003200e4f934d92'||
  pins.tourRevision!=='diaphragm-tour-20261010-r1'||
  pins.entries.some((entry,i)=>entry.fmaId!==targetFmas[i])||pins.entries.length!==targetFmas.length||
  pins.contextEntries.some((entry,i)=>entry.fmaId!==contextFmas[i])||pins.contextEntries.length!==contextFmas.length)
  throw Error('Unexpected diaphragm tour source pins.');

const entries=pins.entries;
const stomach=pins.contextEntries[0];
const diaphragm=entries[0].id;
const university='https://anatomy.ttuhscep.edu/schemes/peritoneum_case.html';
const overview='https://pmc.ncbi.nlm.nih.gov/articles/PMC6209484/';
const step=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string,frameIds:string[]):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view,caption,frameIds,
  references:i===0?[overview,university]:[university],durationMs:14000,fadeOthers:true,
});

/** Source surfaces remain assembled; the tour does not construct diaphragmatic openings. */
export const diaphragmTour:RegionalTour={
  id:'diaphragm-boundary-orientation',title:'Diaphragm: thorax and abdomen',
  region:'whole-body',scopeRegions:['thorax','abdomen','pelvis'],revision:pins.tourRevision,status:'draft',
  description:'Five stops use the diaphragm as a constant landmark while comparing adjacent digestive and vascular source surfaces.',
  contextIds:[stomach.id],
  requiredDisplayBundles:Object.fromEntries([...entries,stomach].map(entry=>[entry.id,entry.bundle])),
  limitations:'Draft exterior source surfaces in one reference frame. The diaphragm is a boundary landmark, but these meshes do not resolve its openings or prove continuity of oesophageal, aortic or caval lumens. No breathing motion, patient registration, acquired imaging, individual level measurement or clinical validation is shown. Radiologist sign-off remains pending for these exact sources and this tour revision.',
  steps:[
    step(0,'diaphragm','Diaphragm','anterior',
      'Find the diaphragm between chest and abdomen. Its movement helps breathing; this still source surface shows no motion.',[diaphragm,entries[1].id,stomach.id]),
    step(1,'oesophagus','Oesophagus','anterior',
      'Compare the oesophagus with the diaphragm and stomach. In usual anatomy, its passage through the diaphragm is associated with the right crus.',[diaphragm,entries[1].id,stomach.id]),
    step(2,'thoracic-aorta','Descending thoracic aorta','posterior',
      'Compare the descending thoracic aorta with the diaphragm. In usual anatomy the aorta continues through the aortic hiatus; its margins are not reconstructed here.',[diaphragm,entries[2].id,entries[3].id]),
    step(3,'abdominal-aorta','Abdominal aorta','posterior',
      'Continue below the diaphragm to the abdominal aorta. Compare the two selected aortic surfaces without assuming a continuous modelled lumen.',[diaphragm,entries[2].id,entries[3].id]),
    step(4,'inferior-vena-cava','Inferior vena cava','anterior',
      'Finish beside the inferior vena cava. In usual anatomy, it passes through an opening in the central tendon of the diaphragm.',[diaphragm,entries[4].id]),
  ],
};

const tourIdentity=sourceCanonical(diaphragmTour);
const records=new Map([...entries,stomach].map(entry=>[entry.id,sourceCanonical(entry)]));
const fmas=new Set([...entries,stomach].map(entry=>entry.fmaId));
export function diaphragmTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==tourIdentity||catalog.sourceVersion!==pins.sourceVersion||
    catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||fmas.has(s.fmaId));
  if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||
    !found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(bundle=>{
    const found=catalog.bundles.filter(b=>b.id===bundle.id);
    return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);
  });
}

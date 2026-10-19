import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/pelvic-venous-tour-pins.json' with {type:'json'};

const targetFmas=['FMA18904','FMA18913','FMA18916','FMA18910','FMA18903','FMA18912','FMA18918','FMA18906','FMA18915','FMA18909'];
const contextFmas=['FMA21387','FMA21388','FMA18887','FMA18888','FMA16586','FMA16587','FMA16202'];
if(pins.baseline!=='b3a9ff28f407437a85b9c56278bd31944ba4033e'||
  pins.tourRevision!=='pelvic-venous-tour-20261010-r1'||
  sourceCanonical(pins.entries.map(s=>s.fmaId))!==sourceCanonical(targetFmas)||
  sourceCanonical(pins.contextEntries.map(s=>s.fmaId))!==sourceCanonical(contextFmas))
  throw Error('Unexpected pelvic venous tour source pins.');

const entries=pins.entries;
const context=pins.contextEntries;
const reference='https://anatomy.ttuhscep.edu/anatomytables/veins_pelvis_perineum.html';
const wallReference='https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html';
const iliolumbarReference='https://pubmed.ncbi.nlm.nih.gov/17373712/';
const iliac=(side:'left'|'right',name:'internal'|'common')=>{
  const fma=side==='left'?(name==='internal'?'FMA18888':'FMA21388'):(name==='internal'?'FMA18887':'FMA21387');
  const entry=context.find(s=>s.fmaId===fma);
  if(!entry)throw Error('Missing pelvic venous tour iliac context.');
  return entry.id;
};
const stop=(i:number,title:string,view:RegionalTour['steps'][number]['view'],caption:string,iliacName:'internal'|'common'='internal'):RegionalTour['steps'][number]=>({
  id:entries[i].fmaId.toLowerCase(),title,selectedId:entries[i].id,view,caption,
  frameIds:[entries[i].id,iliac(i<4?'left':'right',iliacName)],
  references:i===0||i===4?[reference,wallReference,iliolumbarReference]:[reference,wallReference],
  durationMs:14000,fadeOthers:true,
});

/** Existing reference surfaces in one source frame; apparent contact is not a verified junction. */
export const pelvicVenousTour:RegionalTour={
  id:'pelvic-venous-tributaries-orientation',title:'Pelvic veins: tributary orientation',
  region:'pelvis',revision:pins.tourRevision,status:'draft',
  description:'Ten guided stops compare paired and right-only pelvic vein surfaces with the iliac veins, hip bones and sacrum in the original source frame.',
  contextIds:context.map(s=>s.id),
  requiredDisplayBundles:Object.fromEntries([...entries,...context].map(s=>[s.id,s.bundle])),
  limitations:'Selected exterior source surfaces, not a complete pelvic venous network. Left internal pudendal and left lateral sacral definitions remain held for laterality and coordinate review; no missing counterpart is mirrored or reconstructed. The short superior gluteal surfaces do not establish a complete drainage territory. Proximity does not prove a connected lumen, junction, valve, patency or flow. Fading and camera framing are display changes, not dissection planes or a safe procedural path. No acquired CT/MRI, patient registration, diagnostic method or clinical approval is supplied. Revision-bound radiologist sign-off remains pending.',
  steps:[
    stop(0,'Left iliolumbar vein','posterior','Begin beside the left common iliac vein. Inspect the supplied iliolumbar surface in place; its receiving pattern can vary.','common'),
    stop(1,'Left inferior gluteal vein','posterior','Compare this left inferior gluteal selection with the internal iliac vein. Their visible extents do not establish a junction.'),
    stop(2,'Left obturator vein','anterior','Find the left obturator surface against the pelvic wall. The adjacent hip bone is orientation context, not a reconstructed canal.'),
    stop(3,'Left superior gluteal vein','posterior','Inspect the short left superior gluteal surface. It represents only a small source extent, not the whole gluteal drainage network.'),
    stop(4,'Right iliolumbar vein','posterior','Move to the separately sourced right iliolumbar surface. Compare its position with the right common iliac vein without inferring an identical termination.','common'),
    stop(5,'Right inferior gluteal vein','posterior','Locate the right inferior gluteal selection near the right internal iliac vein. Fading improves visibility without opening a tissue plane.'),
    stop(6,'Right internal pudendal vein','posterior','Follow the supplied right internal pudendal surface towards the perineal region. The pudendal canal and full route are not reconstructed.'),
    stop(7,'Right lateral sacral vein','posterior','Find the right lateral sacral selection beside the sacrum. Its left-labelled candidate is held for source review, so no paired comparison is implied.'),
    stop(8,'Right obturator vein','anterior','Compare the right obturator surface with its left counterpart by changing stops. Source proximity cannot establish an anastomosis.'),
    stop(9,'Right superior gluteal vein','posterior','Finish with the short right superior gluteal surface. The selected mesh does not map the full drainage territory or show flow.'),
  ],
};

const tourIdentity=sourceCanonical(pelvicVenousTour);
const records=new Map([...entries,...context].map(s=>[s.id,sourceCanonical(s)]));
const fmas=new Set([...entries,...context].map(s=>s.fmaId));
export function pelvicVenousTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
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

import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/lower-venous-tour-v2-pins.json' with {type:'json'};

const targets=[
  ['small','leg','right-small-saphenous-vein','FMA44334','leg-vessels-recovery'],
  ['popliteal','leg','right-popliteal-vein','FMA44328','leg-vessels-recovery'],
  ['anterior','leg','right-anterior-tibial-vein','FMA44336','deep-leg-veins'],
  ['posterior','leg','right-posterior-tibial-vein','FMA44338','deep-leg-veins'],
  ['femoral','thigh','right-femoral-vein','FMA21188','thigh-vessels-recovery'],
  ['deep','thigh','right-deep-femoral-vein','FMA51042','deep-leg-veins'],
  ['great','thigh','right-great-saphenous-vein','FMA21379','thigh-vessels-recovery'],
  ['external','pelvis','right-external-iliac-vein','FMA18885','pelvis-vessels-recovery'],
  ['common','pelvis','right-common-iliac-vein','FMA21387','pelvis-vessels-recovery'],
] as const;
type Target=typeof targets[number][0];
const context=[
  ['pelvis','right-hip-bone','FMA16586','pelvis-skeleton'],
  ['thigh','right-femur','FMA24474','thigh-skeleton'],
  ['leg','right-tibia','FMA24477','leg-skeleton'],
  ['leg','right-fibula','FMA24480','leg-skeleton'],
] as const;
const bundleIds=[
  'pelvis-skeleton','thigh-skeleton','leg-skeleton','pelvis-vessels-recovery',
  'thigh-vessels-recovery','leg-vessels-recovery','deep-leg-veins',
];
const sourceId=(region:string,kind:string,name:string)=>
  'vm:anatomy:body:'+region+':right:'+kind+':'+name;
const entries=targets.map(([,region,name,fma,bundle],index)=>{
  const entry=pins.entries[index];
  if(entry?.id!==sourceId(region,'vessel',name)||entry.fmaId!==fma||entry.bundle!==bundle||entry.laterality!=='right')
    throw Error('Unexpected lower venous tour source pin.');
  return entry;
});
const contextEntries=context.map(([region,name,fma,bundle],index)=>{
  const entry=pins.contextEntries[index];
  if(entry?.id!==sourceId(region,'bone',name)||entry.fmaId!==fma||entry.bundle!==bundle||entry.laterality!=='right')
    throw Error('Unexpected lower venous tour skeletal pin.');
  return entry;
});
if(pins.schemaVersion!==1||pins.baseline!=='c22c42edc7a663be4cce788d882edb0a83b752fd'||
   pins.tourRevision!=='right-lower-limb-venous-orientation-v2'||
   pins.entries.length!==targets.length||pins.contextEntries.length!==context.length||
   pins.bundles.length!==bundleIds.length||
   bundleIds.some(id=>pins.bundles.filter(bundle=>bundle.id===id).length!==1))
  throw Error('Unexpected lower venous tour source set.');
const admitted=[...entries,...contextEntries];
const id=(target:Target)=>entries[targets.findIndex(([name])=>name===target)].id;
const scopeRegions=[...new Set(admitted.flatMap(entry=>entry.regions))];
const anatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-lower-limb/';
const venogram='https://pubmed.ncbi.nlm.nih.gov/12821771/';
const poplitealFormation='https://pubmed.ncbi.nlm.nih.gov/10982994/';
const femoralTerminology='https://pubmed.ncbi.nlm.nih.gov/7563535/';
const profunda='https://pubmed.ncbi.nlm.nih.gov/2313828/';
const stop=(target:Target,title:string,view:RegionalTour['steps'][number]['view'],frame:Target[],caption:string,references:string[]):RegionalTour['steps'][number]=>({
  id:target,title,selectedId:id(target),view,frameIds:frame.map(id),caption,references,
  durationMs:14000,fadeOthers:true,
});

/** Whole source surfaces for orientation; apparent contact does not validate a junction. */
export const lowerVenousTour:RegionalTour={
  id:'right-lower-limb-venous-orientation',title:'Right lower limb: superficial & deep veins',region:'whole-body',
  revision:pins.tourRevision,status:'draft',contextIds:contextEntries.map(entry=>entry.id),
  scopeRegions,
  requiredDisplayBundles:Object.fromEntries(admitted.map(entry=>[entry.id,entry.bundle])),
  description:'Nine source-bound stops compare superficial and deep right-sided venous surfaces from the leg to the pelvis, with faded skeletal landmarks.',
  limitations:'Selected exterior source surfaces only, not a continuous lumen, verified confluence or complete venous tree. The anterior tibial selection retains two source parts, not separately validated companion veins. Other calf groups do not validate complete companions; the profunda is a separate tributary, not the femoral vein’s serial continuation. Exact junctions, valve leaflets and source extents require anatomical review. No flow, reflux, patency, thrombus diagnosis, procedural route, acquired scan, patient registration or clinical approval is established. Fading changes visibility, not anatomy; blue does not encode oxygenation. Right side only. Draft pending revision-bound radiologist sign-off.',
  steps:[
    stop('small','Small saphenous · Superficial posterior leg','posterior',['small','popliteal'],
      'Locate the superficial small saphenous surface behind the calf and compare the deeper popliteal surface. These meshes do not prove its terminal junction.',[anatomy]),
    stop('popliteal','Popliteal · Deep knee region','posterior',['popliteal','small'],
      'Inspect the deep popliteal selection behind the knee. Cadaver and venogram observations show variable tibial and fibular unions, so no exact formation level is assigned here.',[anatomy,poplitealFormation]),
    stop('anterior','Anterior tibial · Deep anterior leg','anterior',['anterior','posterior'],
      'Compare the anterior deep-leg selection with its posterior counterpart. This anterior source label retains two parts; they are not separately validated companion veins.',[anatomy,poplitealFormation]),
    stop('posterior','Posterior tibial · Deep posterior leg','posterior',['posterior','anterior'],
      'Turn to the posterior tibial selection. Variable union near the knee prevents treating surface proximity as a demonstrated confluence.',[anatomy,poplitealFormation]),
    stop('femoral','Femoral · Deep thigh','anterior',['femoral','deep'],
      'Find the femoral vein in the deep thigh system. The term “superficial femoral vein” is misleading; the separate deep femoral selection is not this vessel’s continuation.',[femoralTerminology,venogram]),
    stop('deep','Deep femoral · Profunda tributary','anterior',['deep','femoral'],
      'Compare the deep femoral, or profunda femoris, vein with the femoral selection. It is a separate deep-thigh tributary; observed variants do not establish this mesh’s junction.',[anatomy,profunda]),
    stop('great','Great saphenous · Superficial medial limb','anterior',['great','femoral'],
      'Contrast the superficial great saphenous surface with the femoral vein of the deep system. Its proximal junction and perforators are not separately mapped.',[anatomy]),
    stop('external','External iliac · Pelvic segment','anterior',['external','common'],
      'Move to the external iliac selection in the pelvis. Compare it with the common iliac surface without inferring a continuous lumen between meshes.',[anatomy]),
    stop('common','Common iliac · Proximal comparison','right',['common','external'],
      'Finish at the right common iliac surface. Internal iliac tributaries and the vena cava are outside this focused sequence.',[anatomy]),
  ],
};

const admittedTour=sourceCanonical(lowerVenousTour);
const records=new Map(admitted.map(entry=>[entry.id,sourceCanonical(entry)]));
const fmas=new Set(admitted.map(entry=>entry.fmaId));

/** Exact sequence, thirteen source identities and seven bundle records. */
export function lowerVenousTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==admittedTour||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||
     sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(structure=>records.has(structure.id)||fmas.has(structure.fmaId));
  if(found.length!==records.size||new Set(found.map(structure=>structure.id)).size!==records.size||
     !found.every(structure=>sourceCanonical(structure)===records.get(structure.id)))return false;
  return pins.bundles.every(bundle=>{
    const matches=catalog.bundles.filter(actual=>actual.id===bundle.id);
    return matches.length===1&&sourceCanonical(matches[0])===sourceCanonical(bundle);
  });
}

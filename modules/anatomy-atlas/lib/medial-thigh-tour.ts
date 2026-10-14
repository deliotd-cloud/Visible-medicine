import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/medial-thigh-tour-pins.json' with {type:'json'};

const muscleFmas=['FMA22450','FMA22456','FMA22452','FMA22459','FMA43883'];
if(pins.schemaVersion!==1||pins.baseline!=='c26ef4bf570f05e4b0e078a620db49ca67922ed9'||
  pins.tourRevision!=='right-medial-thigh-20261015-r1'||pins.entries.length!==5||
  pins.entries.some((entry,i)=>entry.fmaId!==muscleFmas[i]||entry.bundle!=='thigh-muscles'||entry.laterality!=='right')||
  pins.contextEntries.length!==1||pins.contextEntries[0].fmaId!=='FMA24474'||pins.contextEntries[0].bundle!=='thigh-skeleton'||
  pins.bundles.length!==2||new Set(pins.bundles.map(bundle=>bundle.id)).size!==2||
  !pins.bundles.some(bundle=>bundle.id==='thigh-muscles')||!pins.bundles.some(bundle=>bundle.id==='thigh-skeleton'))
  throw Error('Unexpected medial-thigh tour source pins.');

const muscles=pins.entries,bone=pins.contextEntries[0];
const anatomy='https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const pectineusSupply='https://pubmed.ncbi.nlm.nih.gov/34156649/';
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string,references=[anatomy]):RegionalTour['steps'][number]=>({
  id,title,selectedId:muscles[i].id,view,caption,references,
  frameIds:[muscles[i].id],durationMs:14000,fadeOthers:true,
});

/** Whole source surfaces only; local camera fits do not reconstruct attachments. */
export const medialThighTour:RegionalTour={
  id:'right-medial-thigh-orientation',title:'Right thigh: medial muscles',region:'thigh',
  revision:pins.tourRevision,status:'draft',
  description:'Five close-up stops compare selected medial-thigh muscles. The femur and neighbouring muscles remain faded in the same source frame.',
  contextIds:[bone.id],
  requiredDisplayBundles:Object.fromEntries([...muscles,bone].map(entry=>[entry.id,entry.bundle])),
  limitations:'Five whole-muscle exterior surfaces and a femur provide orientation only. Pubic and tibial attachments are described, not traced or supplied as landmarks in this tour. Adductor magnus portions, nerve branches and motor territories are not separately segmented. Adductor minimus identity or boundaries are not inferred. No contraction, procedural plane, acquired CT/MRI/ultrasound correspondence, patient registration or clinical approval is established. Revision-bound radiologist sign-off remains pending.',
  steps:[
    stop(0,'pectineus','Pectineus','anterior',
      'Start proximally with pectineus. It helps flex and adduct the hip, extending from the pubic pecten toward the femoral pectineal line. Femoral motor supply is usual, with variable additional obturator contribution; nerves are not mapped here.',[anatomy,pectineusSupply]),
    stop(1,'adductor-longus','Adductor longus','anterior',
      'Compare longus with the faded femur. Its usual distal attachment follows the middle linea aspera, and it draws the thigh inward. The surface is an orientation model, not a validated attachment footprint.'),
    stop(2,'adductor-brevis','Adductor brevis','left',
      'Look from the anatomical left toward brevis, usually deeper than longus. Its proximal femoral attachment differs from the longer muscle beside it. Adduction and assisted hip flexion are functions, not simulated movement.'),
    stop(3,'adductor-magnus','Adductor magnus','posterior',
      'Rotate behind magnus to compare its broad outline. Classical adductor and hamstring regions have different attachments and motor supplies; the hamstring region also assists hip extension. This whole surface does not separate those regions.'),
    stop(4,'gracilis','Gracilis','left',
      'Finish with the slender gracilis. Unlike these femur-attached adductors, it continues across the knee to the upper medial tibia at pes anserinus. The tibia and precise attachment are outside this tour.'),
  ],
};

const admittedTour=sourceCanonical(medialThighTour);
const records=new Map([...muscles,bone].map(entry=>[entry.id,sourceCanonical(entry)]));
const fmas=new Set([...muscleFmas,'FMA24474']);
export function medialThighTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==admittedTour||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||
    sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||fmas.has(s.fmaId));
  if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||!found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(bundle=>{const found=catalog.bundles.filter(actual=>actual.id===bundle.id);return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);});
}

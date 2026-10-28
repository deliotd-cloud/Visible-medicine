import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/quadriceps-tour-pins.json' with {type:'json'};

const fmas=['FMA38928','FMA38930','FMA38932','FMA38934','FMA24486','FMA24477'];
const bundleIds=['thigh-muscles-dissection','thigh-muscles-dissection','thigh-muscles-dissection','thigh-muscles-dissection','leg-skeleton','leg-skeleton'];
const expectedBundles=['thigh-muscles-dissection','leg-skeleton','thigh-skeleton'];
if(pins.schemaVersion!==1||pins.baseline!=='dc0f5d9648b73e4baf25f468e52963b1d503df68'||
  pins.tourRevision!=='right-quadriceps-20261027-r1'||pins.entries.length!==6||
  pins.entries.some((s,i)=>s.fmaId!==fmas[i]||s.bundle!==bundleIds[i]||s.laterality!=='right')||
  pins.contextEntries.length!==1||pins.contextEntries[0].fmaId!=='FMA24474'||
  pins.contextEntries[0].bundle!=='thigh-skeleton'||pins.contextEntries[0].laterality!=='right'||
  sourceCanonical(pins.scopeRegions)!==sourceCanonical(['thigh','pelvis','leg'])||pins.bundles.length!==3||
  sourceCanonical(pins.bundles.map(b=>b.id).sort())!==sourceCanonical([...expectedBundles].sort()))
  throw Error('Unexpected quadriceps tour source pins.');

const rectus='https://rad.uw.edu/muscle-atlas/rectus-femoris';
const lateralis='https://rad.uw.edu/muscle-atlas/vastus-lateralis';
const medialis='https://rad.uw.edu/muscle-atlas/vastus-medialis';
const intermedius='https://rad.uw.edu/muscle-atlas/vastus-intermedius';
const bones='https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html';
const records=[...pins.contextEntries,...pins.entries];
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string,reference:string,frameIds=[pins.entries[i].id]):RegionalTour['steps'][number]=>({
  id,title,selectedId:pins.entries[i].id,view,caption,references:[reference],
  frameIds,durationMs:14000,fadeOthers:true,
});

/** Exact right thigh/pelvis/leg root-catalog union; selected whole surfaces only. */
export const quadricepsTour:RegionalTour={
  id:'right-knee-quadriceps-to-tibia',title:'Right knee: quadriceps to tibia',
  region:'whole-body',scopeRegions:[...pins.scopeRegions],revision:pins.tourRevision,status:'draft',
  description:'Compare four right quadriceps muscle surfaces, then the patella and tibia. The femur remains faded for orientation in the common source frame.',
  contextIds:pins.contextEntries.map(s=>s.id),
  requiredDisplayBundles:Object.fromEntries(records.map(s=>[s.id,s.bundle])),
  limitations:'Selected right whole-muscle and whole-bone exterior surfaces only. The femur is context, not a selected stop. Tendons, patellar ligament, retinacula, entheses, insertion footprints, cartilage, joint spaces, nerves and vessels are not separately segmented here. Surface proximity does not establish continuous tissue or a patient-specific attachment. No contraction, knee movement, load/force simulation, acquired scan correspondence or patient registration is established. Revision-bound radiologist sign-off remains pending; source pins are not clinical approval.',
  steps:[
    stop(0,'rectus-femoris','Rectus femoris · Anterior','anterior',
      'Begin with rectus femoris on the front of the thigh. Its usual proximal origin is near the anterior inferior iliac spine, outside this tour. It contributes to knee extension; the faded femur provides orientation without defining an attachment.',rectus),
    stop(1,'vastus-lateralis','Vastus lateralis · Lateral','right',
      'Compare vastus lateralis on the outer thigh. This quadriceps muscle usually arises from the femur and contributes to knee extension. The selected whole-muscle surface does not resolve its distal tendon fibers.',lateralis),
    stop(2,'vastus-medialis','Vastus medialis · Medial','left',
      'Turn to vastus medialis on the inner thigh. Like the other vasti, it usually arises from the femur and helps extend the knee. Fading its neighbours is a viewing aid, not a dissection of the medial retinaculum.',medialis),
    stop(3,'vastus-intermedius','Vastus intermedius · Deep anterior','anterior',
      'Find vastus intermedius deep to rectus femoris. It usually arises from the femur and contributes to knee extension. Compare the separate source surfaces without inferring a continuous quadriceps tendon.',intermedius),
    stop(4,'patella','Patella · Anterior knee','anterior',
      'Move to the patella, a sesamoid bone within the usual quadriceps tendon apparatus. The selected whole bone gives a knee landmark; this model does not separately show the tendon, retinacula or patellofemoral cartilage.',bones,
      [pins.entries[4].id]),
    stop(5,'tibia','Tibia · Distal context','anterior',
      'Finish with the tibia. In usual anatomy the patellar ligament continues from patella to the tibial tuberosity. This whole-bone selection does not identify an insertion footprint or show that ligament as a separate surface.',bones,
      [pins.entries[5].id,pins.entries[4].id]),
  ],
};

const admitted=sourceCanonical(quadricepsTour),identities=new Map(records.map(s=>[s.id,sourceCanonical(s)]));
const sourceFmas=new Set(records.map(s=>s.fmaId));
export function quadricepsTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==admitted||catalog.version!==pins.catalogVersion||
    catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||
    sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>identities.has(s.id)||sourceFmas.has(s.fmaId));
  if(found.length!==records.length||new Set(found.map(s=>s.id)).size!==records.length||
    !found.every(s=>sourceCanonical(s)===identities.get(s.id)))return false;
  return pins.bundles.every(b=>{const matches=catalog.bundles.filter(actual=>actual.id===b.id);return matches.length===1&&sourceCanonical(matches[0])===sourceCanonical(b);});
}

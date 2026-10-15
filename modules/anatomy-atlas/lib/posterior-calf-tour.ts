import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/posterior-calf-tour-pins.json' with {type:'json'};

const fmas=['FMA45957','FMA45960','FMA22558','FMA258847','FMA24497'];
const bundleIds=['leg-muscles-dissection','leg-muscles-dissection','leg-muscles','leg-connective-gaps','foot-skeleton'];
if(pins.schemaVersion!==1||pins.baseline!=='38f225ff2d4b6cd0f2e4434c0a2d3a759f1af875'||
  pins.tourRevision!=='right-posterior-calf-20261015-r1'||pins.entries.length!==5||
  pins.entries.some((s,i)=>s.fmaId!==fmas[i]||s.bundle!==bundleIds[i]||s.laterality!=='right')||
  pins.contextEntries.length!==2||pins.contextEntries[0].fmaId!=='FMA24477'||pins.contextEntries[1].fmaId!=='FMA24480'||
  pins.contextEntries.some(s=>s.bundle!=='leg-skeleton'||s.laterality!=='right')||
  sourceCanonical(pins.scopeRegions)!==sourceCanonical(['leg','foot'])||pins.bundles.length!==5||
  new Set(pins.bundles.map(b=>b.id)).size!==5)
  throw Error('Unexpected posterior-calf tour source pins.');

const anatomy='https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const heel='https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html';
const records=[...pins.contextEntries,...pins.entries];
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],caption:string,reference=anatomy):RegionalTour['steps'][number]=>({
  id,title,selectedId:pins.entries[i].id,view,caption,references:[reference],
  frameIds:[pins.entries[i].id],durationMs:14000,fadeOthers:true,
});

/** Explicit leg/foot root-catalog union, never an inferred tendon reconstruction. */
export const posteriorCalfTour:RegionalTour={
  id:'right-posterior-calf-achilles-orientation',title:'Right calf to heel: Achilles complex',
  region:'whole-body',scopeRegions:[...pins.scopeRegions],revision:pins.tourRevision,status:'draft',
  description:'Five close-up stops compare both gastrocnemius heads, soleus, the calcaneal tendon and heel bone. Tibia and fibula remain faded in the common source frame.',
  contextIds:pins.contextEntries.map(s=>s.id),
  requiredDisplayBundles:Object.fromEntries(records.map(s=>[s.id,s.bundle])),
  limitations:'Selected right leg and foot exterior surfaces only. The calcaneus keeps its foot identity; this explicit Whole body union does not rewrite regional membership. Femoral origins are described but the femur is not included. Separate surfaces do not establish continuous muscle–tendon junctions, subtendons, an attachment footprint, enthesis, bursa, fascia, nerve course or a procedural plane. No contraction, load/force simulation, acquired CT/MRI/ultrasound correspondence, patient registration or clinical approval is established. Revision-bound radiologist sign-off remains pending.',
  steps:[
    stop(0,'medial-gastrocnemius','Gastrocnemius · Medial head','left',
      'Start at the medial gastrocnemius head. Gastrocnemius usually spans the knee and ankle, contributing to knee flexion and plantarflexion. Its femoral origin is outside this tour; a surface outline does not validate the attachment.'),
    stop(1,'lateral-gastrocnemius','Gastrocnemius · Lateral head','posterior',
      'Compare the separate lateral head behind the upper calf. Both gastrocnemius heads contribute to the calcaneal tendon apparatus. Keeping their source identities separate does not prove a continuous shared tendon junction.'),
    stop(2,'soleus','Soleus','posterior',
      'Now compare soleus with the faded gastrocnemius heads. Its usual origins are on tibia and fibula, and it plantarflexes the foot without crossing the knee. Fading is a viewing aid, not tissue cutting.'),
    stop(3,'calcaneal-tendon','Calcaneal tendon · Achilles','posterior',
      'Follow the separately selected calcaneal tendon toward the heel. Usual anatomy links gastrocnemius and soleus to the calcaneus through this apparatus. Model proximity does not demonstrate continuity, individual subtendons or an intact insertion.'),
    stop(4,'calcaneus','Calcaneus · Heel attachment context','left',
      'Finish at the heel bone. The posterior calcaneal tuberosity is the usual calcaneal-tendon attachment region. This whole-bone surface does not separately segment the enthesis or define a patient-specific attachment footprint.',heel),
  ],
};

const admitted=sourceCanonical(posteriorCalfTour),identities=new Map(records.map(s=>[s.id,sourceCanonical(s)]));
const sourceFmas=new Set(records.map(s=>s.fmaId));
export function posteriorCalfTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==admitted||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||
    sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>identities.has(s.id)||sourceFmas.has(s.fmaId));
  if(found.length!==identities.size||new Set(found.map(s=>s.id)).size!==identities.size||!found.every(s=>sourceCanonical(s)===identities.get(s.id)))return false;
  return pins.bundles.every(b=>{const matches=catalog.bundles.filter(actual=>actual.id===b.id);return matches.length===1&&sourceCanonical(matches[0])===sourceCanonical(b);});
}

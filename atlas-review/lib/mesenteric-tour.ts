import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/mesenteric-tour-pins.json' with {type:'json'};

const fmas=['FMA14749','FMA14810','FMA14815','FMA14750','FMA14826'];
if(pins.entries.length!==5||pins.entries.some((entry,i)=>entry.fmaId!==fmas[i])||
  pins.contextEntries.length!==1||pins.contextEntries[0].fmaId!=='FMA3789'||
  pins.tourRevision!=='mesenteric-arterial-branch-orientation-v1')throw Error('Unexpected mesenteric tour pins.');
const entries=pins.entries,admitted=[...entries,...pins.contextEntries];
const reference='https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html';
const stop=(i:number,id:string,title:string,view:RegionalTour['steps'][number]['view'],frame:number[],caption:string):RegionalTour['steps'][number]=>({
  id,title,selectedId:entries[i].id,view,caption,references:[reference],
  frameIds:frame.map(index=>admitted[index].id),durationMs:14000,fadeOthers:true,
});

export const mesentericTour:RegionalTour={
  id:'mesenteric-arterial-branch-orientation',title:'Mesenteric arteries: SMA and IMA branches',
  region:'abdomen',revision:pins.tourRevision,status:'draft',
  description:'Five stops compare two aortic branches and selected colic branches in their original source frame. The aorta remains a faded landmark.',
  limitations:'Branch comparison, not a serial blood-flow route. Only five selected exterior arterial surfaces and the aorta are shown. Bowel, mesentery, other branches and venous drainage are omitted. No complete marginal arcade, connected lumen, perfusion territory, collateral reserve, stenosis, ischaemia or operative safety plane is established. The supplied branch pattern is not a universal variant map. No acquired CT/MRI/ultrasound or patient-space registration is added. Draft pending exact-revision radiologist review.',
  contextIds:pins.contextEntries.map(entry=>entry.id),
  requiredDisplayBundles:Object.fromEntries(admitted.map(entry=>[entry.id,entry.bundle])),
  steps:[
    stop(0,'sma','Superior mesenteric · Aortic branch','anterior',[0,3,5],
      'Start with the superior mesenteric artery beside the faded aorta. Its usual supply is the midgut. Compare it with the separately arising inferior mesenteric artery; neither the bowel territory nor flow is rendered.'),
    stop(1,'middle-colic','Middle colic · Transverse-colon branch','anterior',[0,1],
      'Focus on the middle colic surface with the superior mesenteric artery retained for orientation. In usual anatomy this branch supplies the transverse colon. The bowel and a complete marginal arcade are not shown.'),
    stop(2,'ileocolic','Ileocolic · Lower branch comparison','right',[0,2],
      'Compare another superior mesenteric branch: the ileocolic artery serves the terminal ileum, caecum and appendix through its branches. It is not a continuation of the middle colic artery visited previously.'),
    stop(3,'ima','Inferior mesenteric · Separate aortic branch','anterior',[0,3,5],
      'Return to the aorta and identify the inferior mesenteric artery. Its branches serve distal colonic and upper rectal regions. This is a separate system to compare, not the next segment of the superior mesenteric artery.'),
    stop(4,'left-colic','Left colic · Descending-colon branch','left',[3,4],
      'Finish with the left colic artery beside its inferior mesenteric parent. It supplies the descending colon. Separate meshes do not establish the anastomoses or collateral capacity between neighbouring colic branches.'),
  ],
};
const tourIdentity=sourceCanonical(mesentericTour),records=new Map(admitted.map(entry=>[entry.id,sourceCanonical(entry)])),identities=new Set(admitted.map(entry=>entry.fmaId));
export function mesentericTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==tourIdentity||catalog.sourceVersion!==pins.sourceVersion||catalog.license!==pins.license||sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||identities.has(s.fmaId));
  return found.length===records.size&&new Set(found.map(s=>s.id)).size===records.size&&found.every(s=>sourceCanonical(s)===records.get(s.id))&&pins.bundles.every(bundle=>{
    const found=catalog.bundles.filter(b=>b.id===bundle.id);return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);
  });
}

import type {BodyCatalog} from '../app/body-types';
import type {RegionalTour} from './regional-tours';
import {sourceCanonical} from './body-source-additions';
import pins from '../content/cervical-disc-tour-pins.json' with {type:'json'};

const discFmas=['FMA25058','FMA13896','FMA13897','FMA13898','FMA13899','FMA13900'];
const boneFmas=['FMA12520','FMA12521','FMA12522','FMA12523','FMA12524','FMA12525','FMA9165'];
if(pins.baseline!=='6b6d9bba99985dfc5ca8deb52ca9e2632b837d25'||
  pins.tourRevision!=='cervical-whole-discs-20261014-r1'||
  pins.entries.length!==discFmas.length||pins.contextEntries.length!==boneFmas.length||
  pins.entries.some((entry,i)=>entry.fmaId!==discFmas[i]||entry.bundle!=='spine-connective-gaps')||
  pins.contextEntries.some((entry,i)=>entry.fmaId!==boneFmas[i]||entry.bundle!=='spine-skeleton')||
  pins.bundles.length!==2||
  new Set(pins.bundles.map(bundle=>bundle.id)).size!==2||
  !pins.bundles.some(bundle=>bundle.id==='spine-connective-gaps')||
  !pins.bundles.some(bundle=>bundle.id==='spine-skeleton'))
  throw Error('Unexpected cervical disc tour source pins.');

const discs=pins.entries;
const bones=pins.contextEntries;
const anatomy='https://anatomy.ttuhscep.edu/anatomytables/joints_back.html';
const boneAnatomy='https://anatomy.ttuhscep.edu/anatomytables/bones_back.html';
const mri='https://accreditationsupport.acr.org/support/solutions/articles/11000061020-mri-exam-specific-parameters-spine-module-revised-5-10-2022-';
const stop=(i:number,id:string,title:string,caption:string,references:string[]):RegionalTour['steps'][number]=>({
  id,title,selectedId:discs[i].id,view:'left',caption,
  frameIds:[discs[i].id,bones[i].id,bones[i+1].id],
  references,durationMs:14000,fadeOthers:true,
});

/** Source-labelled whole discs and neighbouring bones remain in one source frame. */
export const cervicalDiscTour:RegionalTour={
  id:'cervical-whole-discs-orientation',title:'Cervical spine: whole discs',
  region:'spine',revision:pins.tourRevision,status:'draft',
  description:'Six left-side views descend through source-labelled cervical whole-disc surfaces, each shown with its two neighbouring vertebrae.',
  contextIds:bones.map(bone=>bone.id),
  requiredDisplayBundles:Object.fromEntries([...discs,...bones].map(entry=>[entry.id,entry.bundle])),
  limitations:'Only six exterior whole-disc surfaces and seven adjacent bone surfaces are supplied. There is no C1–C2 disc here. Annulus, nucleus, endplates, cord, roots and foramina are not separately segmented. No measured spacing, MR signal, pathology, patient registration, acquired scan or clinical approval is established. Revision-bound radiologist sign-off remains pending.',
  steps:[
    stop(0,'axis-disc','Axis-labelled disc',
      'Below C2, locate the source-labelled axis disc between C2 and C3. Compare its exterior with the two neighbouring vertebrae; this source label does not identify a C1–C2 disc.',[anatomy,boneAnatomy]),
    stop(1,'third-cervical-disc','C3-labelled disc',
      'Move to the next whole-disc surface between C3 and C4. Compare its outline with the axis-labelled example above; source vertebral labels are not a method for numbering a patient scan.',[anatomy,boneAnatomy]),
    stop(2,'fourth-cervical-disc','C4-labelled disc',
      'Compare the C4-labelled disc exterior with the C4 and C5 bones. This model supplies the whole surface; annulus, nucleus and endplates cannot be selected or assessed separately.',[anatomy]),
    stop(3,'fifth-cervical-disc','C5-labelled disc',
      'Use C5 and C6 to orient the selected whole disc. Level assignment and sagittal or axial MRI comparison belong to acquired images; model colour does not represent MR signal.',[anatomy,mri]),
    stop(4,'sixth-cervical-disc','C6-labelled disc',
      'Compare this whole-disc outline with C6 and C7 from the same left view. Its posterior edge does not establish neural contents, compression or any clinical finding.',[anatomy]),
    stop(5,'seventh-cervical-disc','C7-labelled disc',
      'Finish at the cervicothoracic junction, with the C7-labelled whole disc between C7 and T1. Keep these source labels distinct from patient numbering or measured disc spaces.',[anatomy,boneAnatomy]),
  ],
};

const admittedTour=sourceCanonical(cervicalDiscTour);
const records=new Map([...discs,...bones].map(entry=>[entry.id,sourceCanonical(entry)]));
const fmas=new Set([...discFmas,...boneFmas]);

/** Exact tour, thirteen displayed records, two bundles and catalogue metadata. */
export function cervicalDiscTourMatches(catalog:BodyCatalog,tour:RegionalTour):boolean{
  if(sourceCanonical(tour)!==admittedTour||catalog.sourceVersion!==pins.sourceVersion||
    catalog.license!==pins.license||
    sourceCanonical(catalog.coordinateSystem)!==sourceCanonical(pins.coordinateSystem))return false;
  const found=catalog.structures.filter(s=>records.has(s.id)||fmas.has(s.fmaId));
  if(found.length!==records.size||new Set(found.map(s=>s.id)).size!==records.size||
    !found.every(s=>sourceCanonical(s)===records.get(s.id)))return false;
  return pins.bundles.every(bundle=>{
    const found=catalog.bundles.filter(actual=>actual.id===bundle.id);
    return found.length===1&&sourceCanonical(found[0])===sourceCanonical(bundle);
  });
}

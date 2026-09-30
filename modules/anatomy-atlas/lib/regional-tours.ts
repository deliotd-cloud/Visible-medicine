import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { selectionBounds } from './selection-visibility';
import { chestWallTour } from './chest-wall-tour';
export { chestWallTour } from './chest-wall-tour';
import { orbitalTour } from './orbital-tour';
export { orbitalTour } from './orbital-tour';
import { intrinsicLarynxTour } from './intrinsic-larynx-tour';
export { intrinsicLarynxTour } from './intrinsic-larynx-tour';
import { maleDuctTour } from './male-duct-tour';
export { maleDuctTour } from './male-duct-tour';
import { deepBrainTour } from './deep-brain-tour';
export { deepBrainTour } from './deep-brain-tour';
import { subscapularTour } from './subscapular-tour';
export { subscapularTour } from './subscapular-tour';
import { lumbarTour } from './lumbar-tour';
export { lumbarTour } from './lumbar-tour';
import { carpalTour } from './carpal-tour';
export { carpalTour } from './carpal-tour';
import { renalTour } from './renal-tour';
export { renalTour } from './renal-tour';

export type RegionalTour = {
  id: string; title: string; description: string; region: string; revision: string;
  status: 'draft'; contextIds: string[]; limitations?: string;
  requiredDisplayBundles?: Record<string,string>;
  steps: Array<{ id: string; title: string; caption: string; selectedId: string;
    view: DissectionView; durationMs: number; fadeOthers: boolean; references: string[]; frameIds?: string[] }>;
};
const id=(side:string,kind:string,name:string)=>`vm:anatomy:body:thorax:${side}:${kind}:${name}`;
const airway='https://anatomy.ttuhscep.edu/schemes/lungs_ans.html';
const vessels=airway;
const arch='https://www.ncbi.nlm.nih.gov/books/NBK431104/';
const thoraxStep=(slug:string,title:string,selectedId:string,view:DissectionView,caption:string,references:string[])=>({id:slug,title,selectedId,view,caption,references,durationMs:14000,fadeOthers:true});
export const thoraxTour: RegionalTour = {
  id:'thoracic-airways-vessels', title:'Thoracic airways & vessels', region:'thorax',
  revision:'thoracic-airways-vessels-v1',status:'draft',
  description:'Six guided stops through the central airways and adjacent great vessels. Other surfaces fade to keep each target visible.',
  contextIds:[id('right','organ','right-lung'),id('left','organ','left-lung')],
  steps:[
    thoraxStep('trachea','Trachea',id('unpaired','organ','trachea'),'anterior','Begin with the tracheal surface between the lung outlines. This central airway leads towards the main bronchi. These separate exterior surfaces do not demonstrate a continuous airway lumen.',[airway]),
    thoraxStep('right-bronchus','Right main bronchus',id('right','organ','right-main-bronchus'),'right','Follow the proximal right main-bronchus surface towards the right lung. Compare its position with the trachea; this source does not provide a complete lobar bronchial tree.',[airway]),
    thoraxStep('left-bronchus','Left main bronchus',id('left','organ','left-main-bronchus'),'left','Now identify the left main-bronchus surface approaching the left lung. The tour retains the common source frame; fading makes the relationship visible without separating the structures.',[airway]),
    thoraxStep('aortic-arch','Aortic arch',id('midline','vessel','arch-of-aorta'),'left','Locate the aortic arch above the left main-bronchus region. In usual anatomy the arch curves over this airway. Assess the supplied surfaces as an orientation model, not a patient-specific relationship.',[arch]),
    thoraxStep('right-pulmonary-artery','Right pulmonary artery',id('right','vessel','right-pulmonary-artery'),'right','Compare the right pulmonary artery with the right main bronchus. In usual anatomy the artery passes anterior to the bronchus on its route towards the right lung.',[vessels]),
    thoraxStep('left-pulmonary-artery','Left pulmonary artery',id('left','vessel','left-pulmonary-artery'),'left','Compare the left pulmonary artery with the left main bronchus. In usual anatomy the artery is superior to the bronchus. These are selected exterior segments, not a complete hilar or lobar map.',[vessels]),
  ],
};
const cervicalId=(name:string)=>`vm:anatomy:body:spine:midline:bone:${name}`;
const cervicalReference='https://anatomy.ttuhscep.edu/schemes/back_tables.html';
const cervicalStep=(slug:string,title:string,name:string,view:DissectionView,caption:string)=>({
  id:slug,title,selectedId:cervicalId(name),view,caption,references:[cervicalReference],durationMs:14000,fadeOthers:true,
});
export const cervicalSpineTour: RegionalTour = {
  id:'cervical-spine-orientation',title:'Cervical spine: C1 to T1',region:'spine',
  revision:'cervical-spine-orientation-v1',status:'draft',
  description:'Five guided stops from the atlas to the cervicothoracic junction. C4–C6 remain as faded context in the original source frame.',
  limitations:'Selected bony source surfaces only; discs, ligaments, spinal cord and nerve roots are not shown in this tour. Typical features vary between individuals. No joint-motion simulation, acquired imaging or spatial registration. Draft pending radiologist review.',
  contextIds:['fourth-cervical-vertebra','fifth-cervical-vertebra','sixth-cervical-vertebra'].map(cervicalId),
  steps:[
    cervicalStep('c1','C1 · Atlas','atlas','anterior','Begin at C1. Unlike a typical vertebra, atlas forms a ring with anterior and posterior arches rather than a vertebral body. Use the faded C2 surface below for orientation.'),
    cervicalStep('c2','C2 · Axis','axis','right','Locate the dens rising from C2 towards the anterior arch of C1. Compare these neighbouring bones without separating them; this tour does not simulate their movement.'),
    cervicalStep('c3','C3 · Typical cervical vertebra','third-cervical-vertebra','posterior','Use C3 to orient the mid-cervical series. Typical cervical features include a small body, transverse foramina and a bifid spinous process. Compare with the faded C4–C6 surfaces; fine details require source review.'),
    cervicalStep('c7','C7 · Vertebra prominens','seventh-cervical-vertebra','posterior','Follow the series down to C7. Its spinous process is usually longer and non-bifid compared with the mid-cervical vertebrae. This is a typical distinction, not a reliable patient-level numbering rule on its own.'),
    cervicalStep('t1','T1 · Cervicothoracic junction','first-thoracic-vertebra','left','Finish at T1, below C7. Thoracic vertebrae bear rib-articulation facets. Compare the bony transition here; ribs and soft tissues are outside this tour, and no patient scan is aligned.'),
  ],
};
const abdominalVessel=(side:string,name:string)=>`vm:anatomy:body:abdomen:${side}:vessel:${name}`;
const celiacId=abdominalVessel('unspecified','celiac-artery');
const foregutReference='https://anatomy.ttuhscep.edu/gastrointestinal_system/duodenum_tables.html';
const stomachReference='https://anatomy.ttuhscep.edu/gastrointestinal_system/stomach_tables.html';
const celiacStep=(slug:string,title:string,selectedId:string,view:DissectionView,caption:string,references=[foregutReference],frameIds?:string[])=>({
  id:slug,title,selectedId,view,caption,references,durationMs:14000,fadeOthers:true,...(frameIds?{frameIds}:{}),
});
const proximalCeliacFrame=[celiacId,abdominalVessel('left','left-gastric-artery'),abdominalVessel('midline','common-hepatic-artery')];
const hepaticFrame=[celiacId,abdominalVessel('midline','common-hepatic-artery'),abdominalVessel('unspecified','hepatic-artery-proper')];
export const celiacTour: RegionalTour = {
  id:'celiac-branches-orientation',title:'Coeliac trunk & branches',region:'abdomen',
  revision:'celiac-branches-orientation-v2',status:'draft',
  description:'Five stops through the coeliac trunk and selected gastric, splenic and hepatic artery surfaces. The abdominal aorta stays as faded upstream context.',
  limitations:'Selected exterior vessel segments only, not a verified continuous tree or lumen. Branching patterns vary; organs and the complete downstream arterial network are not shown. No patency, calibre, flow, procedural route, patient scan or spatial registration is established. Draft pending radiologist review.',
  contextIds:[abdominalVessel('midline','abdominal-aorta')],
  requiredDisplayBundles:{[celiacId]:'celiac-display-corrected'},
  steps:[
    celiacStep('celiac','Coeliac trunk',celiacId,'anterior','Start with the short coeliac segment near the faded abdominal aorta. In the usual arrangement it gives rise to the left gastric, splenic and common hepatic arteries. Their names describe separate supplied surfaces, not proof of a continuous lumen.',[foregutReference],proximalCeliacFrame),
    celiacStep('left-gastric','Left gastric artery',abdominalVessel('left','left-gastric-artery'),'right','Locate the left gastric surface relative to the coeliac trunk. In usual anatomy this branch supplies the stomach near its lesser curvature. The stomach is not shown here; the selected segment does not map its full supply territory.',[stomachReference],proximalCeliacFrame),
    celiacStep('splenic','Splenic artery',abdominalVessel('unspecified','splenic-artery'),'anterior','Follow the splenic arterial surface towards the anatomical left. The splenic artery is another usual coeliac branch. This tour omits its complete pancreatic and gastric branches and does not demonstrate blood flow.',[stomachReference]),
    celiacStep('common-hepatic','Common hepatic artery',abdominalVessel('midline','common-hepatic-artery'),'right','Return to the common hepatic surface. In the usual arrangement this coeliac branch gives the gastroduodenal and proper hepatic arteries. The gastroduodenal branch is outside this focused tour.',[foregutReference],hepaticFrame),
    celiacStep('proper-hepatic','Hepatic artery proper',abdominalVessel('unspecified','hepatic-artery-proper'),'anterior','Compare the hepatic artery proper with the common hepatic segment. Typical hepatic branching is only an orientation guide: origins vary, and these surfaces are not a patient-specific surgical or angiographic map.',[foregutReference],hepaticFrame),
  ],
};
const forearmId=(kind:string,name:string)=>`vm:anatomy:body:forearm:right:${kind}:right-${name}`;
const forearmReference='https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_ans.html';
const forearmStep=(name:string,title:string,view:DissectionView,caption:string)=>({
  id:name,title,selectedId:forearmId('muscle',name),view,caption,
  references:[forearmReference],durationMs:14000,fadeOthers:true,
  frameIds:[forearmId('muscle',name)],
});
export const forearmTour: RegionalTour = {
  id:'right-forearm-muscle-orientation',title:'Right forearm: muscle orientation',region:'forearm',
  revision:'right-forearm-muscle-orientation-v1',status:'draft',
  description:'Five selected muscles, with radius and ulna as faded context. Follow the lateral, posterior and anterior surfaces, finishing with a distal close-up.',
  limitations:'Right-sided selected source surfaces, not complete muscle compartments or a dissection of fascial planes. Nerves, vessels and the complete wrist/hand skeleton are not shown. Fine tendon continuity and attachments require source review. No simulated contraction, acquired imaging or patient registration. Draft pending radiologist review.',
  contextIds:[forearmId('bone','radius'),forearmId('bone','ulna')],
  steps:[
    forearmStep('brachioradialis','Brachioradialis · Lateral landmark','right','Begin on the lateral side of the right forearm. Brachioradialis belongs to the posterior compartment but acts as an elbow flexor. The faded radius and ulna provide orientation; the humerus is not shown.'),
    forearmStep('extensor-digitorum','Extensor digitorum · Posterior','posterior','Sweep to the posterior surface and identify extensor digitorum. It extends digits two to five. Follow the supplied surface distally without treating it as a verified map of individual tendon insertions.'),
    forearmStep('flexor-carpi-radialis','Flexor carpi radialis · Anterior','anterior','Move to the anterior side. Flexor carpi radialis is a superficial flexor that flexes the wrist and assists radial deviation. Compare its position with the faded forearm bones; wrist motion is not simulated.'),
    forearmStep('flexor-digitorum-superficialis','Flexor digitorum superficialis','anterior','Identify the intermediate anterior flexor, flexor digitorum superficialis. Its action includes proximal interphalangeal flexion in digits two to five. Other muscles fade for visibility; fading is not a true dissection plane.'),
    forearmStep('pronator-quadratus','Pronator quadratus · Distal close-up','anterior','Finish with a close-up of pronator quadratus, deep in the distal anterior forearm between ulna and radius. It contributes to pronation. Nearby context may extend beyond this frame; no nerve course is depicted.'),
  ],
};
const limbId=(region:string,kind:string,name:string)=>`vm:anatomy:body:${region}:right:${kind}:${name}`;
const limbStep=(region:string,name:string,title:string,view:DissectionView,caption:string,reference:string)=>({
  id:name,title,selectedId:limbId(region,'muscle',name),view,caption,
  references:[reference],durationMs:14000,fadeOthers:true,
  frameIds:[limbId(region,'muscle',name)],
});
const topographyReference='https://anatomy.ttuhscep.edu/anatomytables/topogr_alpha.html';
const legReference='https://anatomy.ttuhscep.edu/schemes/leg_tables.html';
const handReference='https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html';
export const thighTour: RegionalTour = {
  id:'right-thigh-muscle-orientation',title:'Right thigh: muscle orientation',region:'thigh',
  revision:'right-thigh-muscle-orientation-v1',status:'draft',
  description:'Five selected muscle surfaces around the femur: anterior, medial and posterior orientation with gentle camera sweeps.',
  limitations:'Selected right-sided surfaces only, not complete compartments or fascial dissection planes. The short head of biceps femoris, pelvic attachments, knee complex, nerves and vessels are outside this tour. Tendon continuity and attachment detail need source review. No simulated motion, acquired imaging or patient registration. Draft pending radiologist review.',
  contextIds:[limbId('thigh','bone','right-femur')],
  steps:[
    limbStep('thigh','right-rectus-femoris','Rectus femoris · Anterior','anterior','Start with rectus femoris in the anterior quadriceps group. The femur remains faded behind it. This is one selected muscle, not the whole quadriceps or its complete attachment system.',topographyReference),
    limbStep('thigh','right-vastus-lateralis','Vastus lateralis · Lateral view','right','Sweep towards the anatomical right to find vastus lateralis. Although lateral in position, it belongs to the anterior quadriceps group. Compare its surface with rectus femoris and the femur.',topographyReference),
    limbStep('thigh','right-adductor-longus','Adductor longus · Medial','left','Move to the medial side of this right thigh. Adductor longus belongs to the medial adductor group. Fading reveals the supplied surface; it does not open a real fascial compartment.',topographyReference),
    limbStep('thigh','long-head-of-right-biceps-femoris','Biceps femoris · Long head','posterior','Turn posteriorly to the long head of biceps femoris, on the lateral hamstring side. Only the long head is highlighted; the separate short head is not included in this tour.',topographyReference),
    limbStep('thigh','right-semitendinosus','Semitendinosus · Posteromedial','posterior','Finish on semitendinosus, a medial hamstring. Compare its position with the faded long head of biceps femoris. The tour does not show all boundaries or contents of the popliteal fossa.',topographyReference),
  ],
};
export const legTour: RegionalTour = {
  id:'right-leg-muscle-orientation',title:'Right leg: muscle orientation',region:'leg',
  revision:'right-leg-muscle-orientation-v1',status:'draft',
  description:'Travel from anterior muscles to the lateral and posterior leg, with tibia and fibula as faded landmarks.',
  limitations:'Selected right-sided muscle surfaces, not complete compartments or verified fascial planes. Gastrocnemius, nerves, vessels and the full foot skeleton are not included. Surface visibility does not establish tendon continuity or precise insertions. No simulated contraction, acquired imaging or patient registration. Draft pending radiologist review.',
  contextIds:['right-tibia','right-fibula'].map(name=>limbId('leg','bone',name)),
  steps:[
    limbStep('leg','right-tibialis-anterior','Tibialis anterior · Anterior','anterior','Begin in the anterior leg beside the faded tibia. Tibialis anterior contributes to ankle dorsiflexion and foot inversion. Use the bones for orientation without assuming the entire tendon insertion is demonstrated.',legReference),
    limbStep('leg','right-extensor-digitorum-longus','Extensor digitorum longus','anterior','Identify another anterior muscle, extensor digitorum longus. It extends the lateral four toes and assists dorsiflexion. The selected surface is not a complete digital tendon map.',legReference),
    limbStep('leg','right-fibularis-longus','Fibularis longus · Lateral','right','Sweep to the lateral side and locate fibularis longus near the fibula. It contributes to eversion and plantarflexion. The foot and the complete plantar tendon route are outside this tour.',legReference),
    limbStep('leg','right-soleus','Soleus · Posterior','posterior','Move behind the leg to soleus, a plantarflexor in the superficial posterior compartment. Superficial compartment does not mean the outermost muscle: gastrocnemius, which normally overlies it, is not shown here.',legReference),
    limbStep('leg','right-tibialis-posterior','Tibialis posterior · Deep posterior','posterior','Finish with tibialis posterior in the deep posterior group. It assists inversion and plantarflexion. The other surfaces fade to reveal this target; this visibility change is not a surgical dissection plane.',legReference),
  ],
};
export const handTour: RegionalTour = {
  id:'right-hand-muscle-orientation',title:'Right hand: thenar to hypothenar',region:'hand',
  revision:'right-hand-muscle-orientation-v1',status:'draft',
  description:'Five close-up stops from thumb-side to little-finger-side intrinsic muscles. First and fifth metacarpals stay as faded context.',
  limitations:'Selected right-hand intrinsic surfaces only, not the complete thenar group or palm. No lumbricals, interossei, full digital skeleton, fascial spaces or neurovascular courses are demonstrated. Small surfaces and attachments need source review. Fading is not physical tissue removal. No animated opposition, acquired imaging or patient registration. Draft pending radiologist review.',
  contextIds:['right-first-metacarpal-bone','right-fifth-metacarpal-bone'].map(name=>limbId('hand','bone',name)),
  steps:[
    limbStep('hand','right-abductor-pollicis-brevis','Abductor pollicis brevis · Thenar','anterior','Begin on the palmar thumb side with abductor pollicis brevis. This thenar muscle abducts the thumb. The faded first metacarpal provides context while the camera frames the smaller muscle surface.',handReference),
    limbStep('hand','right-opponens-pollicis','Opponens pollicis · Deep thenar','anterior','Look deeper in the thenar group for opponens pollicis beside the first metacarpal. Its action contributes to thumb opposition. This static model does not animate the movement or establish complete attachments.',handReference),
    limbStep('hand','abductor-digiti-minimi-of-right-hand','Abductor digiti minimi · Hypothenar','anterior','Cross to the little-finger side and identify abductor digiti minimi of the hand. It abducts the fifth digit. The fifth metacarpal now provides the local bony landmark.',handReference),
    limbStep('hand','flexor-digiti-minimi-brevis-of-right-hand','Flexor digiti minimi brevis','anterior','Compare the neighbouring hypothenar flexor digiti minimi brevis. It contributes to little-finger flexion. Keep the selected surface distinct from the adjacent abductor; the complete finger skeleton is not included.',handReference),
    limbStep('hand','opponens-digiti-minimi-of-right-hand','Opponens digiti minimi','anterior','Finish with opponens digiti minimi alongside the fifth metacarpal. It contributes to opposition on the little-finger side. Fading exposes the small supplied surface, not an intact palmar fascial space.',handReference),
  ],
};
export const footTour: RegionalTour = {
  id:'right-foot-muscle-orientation',title:'Right foot: dorsal to plantar',region:'foot',
  revision:'right-foot-muscle-orientation-v1',status:'draft',
  description:'Five focused stops from the dorsal hallux extensor to selected plantar muscles. Heel and first/fifth metatarsals provide faded landmarks.',
  limitations:'Selected right-foot surfaces, not a complete four-layer sole dissection. Other short extensors, long tendons, digital skeleton, fascia and neurovascular structures are omitted. Flexor accessorius is a combined source surface, not two separately selectable heads. No verified tendon continuity, weight-bearing simulation, acquired imaging or patient registration. Draft pending radiologist review.',
  contextIds:['right-calcaneus','right-first-metatarsal-bone','right-fifth-metatarsal-bone'].map(name=>limbId('foot','bone',name)),
  steps:[
    limbStep('foot','right-extensor-hallucis-brevis','Extensor hallucis brevis · Dorsal','superior','Begin above the foot with the short hallux extensor. It extends the great toe at its base. The highlighted surface is not the long extensor or all of extensor digitorum brevis.',legReference),
    limbStep('foot','right-abductor-hallucis','Abductor hallucis · Medial sole','inferior','Sweep underneath to abductor hallucis on the medial sole. It assists great-toe abduction and flexion. The first metatarsal remains as context; the full hallux skeleton is not shown.',legReference),
    limbStep('foot','right-flexor-digitorum-brevis','Flexor digitorum brevis · Central sole','inferior','Move across to flexor digitorum brevis. It flexes toes two to five. Follow the supplied surface, but do not treat its digital slips as individually selectable or as proof of intact tendon insertions.',legReference),
    limbStep('foot','abductor-digiti-minimi-of-right-foot','Abductor digiti minimi · Lateral sole','inferior','Identify abductor digiti minimi beside the fifth metatarsal on the lateral sole. Compare the selected surface with the medial abductor hallucis, now faded. This is foot anatomy, distinct from the similarly named hand muscle.',legReference),
    limbStep('foot','right-flexor-accessorius','Quadratus plantae · Flexor accessorius','inferior','Finish deeper with quadratus plantae, retained in the source as flexor accessorius. It assists the long digital flexor through its tendon apparatus rather than attaching directly to a toe bone. Fading reveals a surface, not a physical dissection plane.',legReference),
  ],
};
const armReference='https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_tables.html';
export const upperArmTour: RegionalTour = {
  id:'right-upper-arm-muscle-orientation',title:'Right upper arm: flexors & extensors',region:'shoulder-arm',
  revision:'right-upper-arm-muscle-orientation-v1',status:'draft',
  description:'Six stops distinguish both biceps heads, brachialis and all three triceps heads. Humerus and scapula stay in the original source frame.',
  limitations:'Selected right-sided source surfaces only, not complete arm compartments. Forearm bones, complete distal tendon insertions, coracobrachialis, fascia, nerves and vessels are not shown. Individual source heads do not establish complete tendon continuity. No muscle contraction, joint-motion simulation, acquired imaging or patient registration. Draft pending radiologist review.',
  contextIds:['humerus','scapula'].map(name=>`vm:anatomy:upper-limb:shoulder:right:bone:${name}`),
  steps:[
    limbStep('shoulder-arm','long-head-of-right-biceps-brachii','Biceps brachii · Long head','anterior','Begin anteriorly with the long biceps head. Its usual proximal attachment is at the supraglenoid region of the scapula. The source surface does not establish an intact tendon through the shoulder joint.',armReference),
    limbStep('shoulder-arm','short-head-of-right-biceps-brachii','Biceps brachii · Short head','anterior','Compare the short head, which arises from the coracoid process. Both heads contribute to elbow flexion and supination. Their common radial insertion is outside this tour because the radius is not included.',armReference),
    limbStep('shoulder-arm','right-brachialis','Brachialis · Deep anterior','anterior','Fade the biceps heads to reveal brachialis against the anterior humerus. This elbow flexor attaches distally to the ulna; that bone is not shown. Visibility here is not a surgical tissue plane.',armReference),
    limbStep('shoulder-arm','long-head-of-right-triceps-brachii','Triceps brachii · Long head','posterior','Sweep posteriorly to the long triceps head. Its scapular origin lies below the glenoid, unlike the long biceps head above it. It crosses both shoulder and elbow, but no movement is simulated.',armReference),
    limbStep('shoulder-arm','lateral-head-of-right-triceps-brachii','Triceps brachii · Lateral head','posterior','Locate the lateral triceps head along the posterior humerus. Compare its position with the faded long head. The radial nerve and its relation to these muscles are not rendered by this tour.',armReference),
    limbStep('shoulder-arm','medial-head-of-right-triceps-brachii','Triceps brachii · Medial head','posterior','Finish with the deeper medial head. All three triceps heads contribute to elbow extension through a common olecranon attachment. Separate highlighted surfaces do not prove continuous tendon anatomy; the ulna is omitted.',armReference),
  ],
};
const neckId=(side:string,kind:string,name:string)=>`vm:anatomy:body:head-neck:${side}:${kind}:${name}`;
const larynxReference='https://anatomy.ttuhscep.edu/nervous_system/deepneck_tables.html';
const surfaceStep=(id:string,title:string,selectedId:string,view:DissectionView,caption:string,reference:string)=>({
  id,title,selectedId,view,caption,references:[reference],durationMs:14000,fadeOthers:true,frameIds:[selectedId],
});
export const larynxTour: RegionalTour = {
  id:'laryngeal-framework-orientation',title:'Larynx: framework & epiglottis',region:'head-neck',
  revision:'laryngeal-framework-orientation-v1',status:'draft',
  description:'Five close-up stops around the laryngeal framework, using the hyoid as a faded superior landmark. Right and left arytenoids remain separately identified.',
  limitations:'Selected exterior source surfaces only, not a complete larynx, mucosal airway or endoscopic view. The thyroid gland, vocal folds, intrinsic muscles, smaller cartilages, vessels and nerves are not shown. Fading is not tissue dissection; no phonation, swallowing, airway patency, procedural route, acquired scan or patient registration is demonstrated. Draft pending radiologist review.',
  contextIds:[neckId('midline','bone','hyoid-bone')],
  steps:[
    surfaceStep('thyroid','Thyroid cartilage · Anterior shield',neckId('midline','cartilage','thyroid-cartilage'),'anterior','Start with the broad thyroid cartilage below the faded hyoid. Its two laminae meet anteriorly. Do not confuse this cartilage with the thyroid gland, which is outside this tour.',larynxReference),
    surfaceStep('cricoid','Cricoid cartilage · Ring below',neckId('midline','cartilage','cricoid-cartilage'),'right','Sweep to the right side of the cricoid below the thyroid cartilage. In usual anatomy its anterior arch is narrower than its broad posterior lamina. A ring-shaped surface does not establish an open airway.',larynxReference),
    surfaceStep('right-arytenoid','Right arytenoid · Posterior',neckId('right','cartilage','right-arytenoid-cartilage'),'posterior','Turn behind the larynx to the right arytenoid on the upper cricoid lamina. Its vocal process provides a vocal-ligament attachment; those ligaments are not rendered in this sequence.',larynxReference),
    surfaceStep('left-arytenoid','Left arytenoid · Paired comparison',neckId('left','cartilage','left-arytenoid-cartilage'),'posterior','Compare the separately labelled left arytenoid with the faded right one. Both retain their supplied source positions. Their movement and the vocal-fold opening are not simulated.',larynxReference),
    surfaceStep('epiglottis','Epiglottis · Superior landmark',neckId('unpaired','organ','epiglottis'),'left','Finish with the epiglottis in the superior laryngeal region. The catalogue retains it as an organ surface. This static outline does not separate cartilage from mucosa or demonstrate swallowing closure.',larynxReference),
  ],
};
const pelvicOrgan=(side:string,name:string)=>`vm:anatomy:body:pelvis:${side}:organ:${name}`;
const pelvisReference='https://anatomy.ttuhscep.edu/reproductive_system/pelvicvisc_ans.html';
export const malePelvisTour: RegionalTour = {
  id:'male-pelvic-viscera-orientation',title:'Male pelvis: bladder to rectum',region:'pelvis',
  revision:'male-pelvic-viscera-orientation-v1',status:'draft',
  description:'Five source-bound visceral stops with the hip bones and sacrum as faded landmarks. This sequence uses the root male anatomy, not the separate female-pelvis specimen.',
  limitations:'Selected root-body male pelvic surfaces only. Not the female pelvis or a mixed-specimen reconstruction. Ureters, urethra, ducts, pelvic floor, fascial planes and neurovascular structures are omitted. Organ outlines do not establish internal zones, luminal continuity, distension, disease or surgical planes. No acquired CT/MRI, scan registration or procedural simulation. Draft pending radiologist review.',
  contextIds:['vm:anatomy:body:pelvis:right:bone:right-hip-bone','vm:anatomy:body:pelvis:left:bone:left-hip-bone','vm:anatomy:body:spine:midline:bone:sacrum'],
  steps:[
    surfaceStep('bladder','Urinary bladder · Anterior',pelvicOrgan('unpaired','urinary-bladder'),'anterior','Begin with the bladder in the anterior pelvis, using the faded hip bones for orientation. Its shape depends on filling in life; the fixed source surface does not show a measured capacity or bladder wall layers.',pelvisReference),
    surfaceStep('prostate','Prostate · Below the bladder',pelvicOrgan('unpaired','prostate'),'right','Sweep to the right side to compare the prostate below the bladder and in front of the rectum. This is an outer gland surface, not a zonal prostate atlas or a depiction of the urethral lumen.',pelvisReference),
    surfaceStep('right-seminal-vesicle','Right seminal vesicle · Posterior',pelvicOrgan('right','right-seminal-vesicle'),'posterior','Turn posteriorly to identify the right seminal vesicle behind the bladder and above the prostate. The ductal connections are not shown; the surface should not be used to infer a continuous reproductive tract.',pelvisReference),
    surfaceStep('left-seminal-vesicle','Left seminal vesicle · Paired comparison',pelvicOrgan('left','left-seminal-vesicle'),'posterior','Compare the separately labelled left seminal vesicle with the faded right side. Both stay in the original body-source frame. Normal asymmetry and internal duct detail cannot be established by this simplified view.',pelvisReference),
    surfaceStep('rectum','Rectum · Posterior relationship',pelvicOrgan('unpaired','rectum'),'left','Finish from the left with the rectum behind the bladder and prostate. The sacrum provides posterior context. Fading adjacent organs improves visibility but does not reveal a validated rectal wall or mesorectal plane.',pelvisReference),
  ],
};
export const regionalTours=[thoraxTour,chestWallTour,cervicalSpineTour,celiacTour,forearmTour,thighTour,legTour,handTour,footTour,upperArmTour,larynxTour,orbitalTour,intrinsicLarynxTour,malePelvisTour,maleDuctTour,deepBrainTour,subscapularTour,lumbarTour,carpalTour,renalTour];
export const regionalTourFor=(region:string)=>regionalTours.find(t=>t.region===region)??null;
export const regionalToursFor=(region:string)=>regionalTours.filter(t=>t.region===region);
export const regionalTourLimitations=(tour:RegionalTour)=>tour.limitations??'Selected exterior source surfaces only; no complete lumen, bronchial tree, surgical plane, acquired imaging or spatial registration. Draft pending radiologist review.';

/** Resolve exact identities; never substitute a similarly named surface. */
export function regionalTourStructures(catalog:BodyCatalog,tour:RegionalTour):BodyStructure[] {
  const ids=[...new Set([...tour.contextIds,...tour.steps.map(s=>s.selectedId)])];
  return ids.map(id=>{
    const matches=catalog.structures.filter(s=>s.id===id&&s.regions.includes(tour.region));
    if(matches.length!==1||catalog.bundles.filter(b=>b.id===matches[0].bundle).length!==1||
      (tour.requiredDisplayBundles?.[id]&&matches[0].bundle!==tour.requiredDisplayBundles[id]))
      throw Error('The guided tour does not match the available anatomy source.');
    return matches[0];
  });
}
export function regionalTourFrame(catalog:BodyCatalog,tour:RegionalTour,index?:number) {
  const structures=regionalTourStructures(catalog,tour);
  if(index!==undefined&&(!Number.isInteger(index)||index<0||index>=tour.steps.length))throw Error('Invalid tour step.');
  const step=index===undefined?undefined:tour.steps[index];
  const ids=step?.frameIds??tour.steps.map(s=>s.selectedId);
  if(!ids.length||new Set(ids).size!==ids.length||!ids.every(id=>structures.some(s=>s.id===id))||
    (step&&!ids.includes(step.selectedId)))throw Error('Invalid tour camera frame.');
  const frame=selectionBounds(structures.filter(s=>ids.includes(s.id)));
  if(!frame)throw Error('Tour camera bounds unavailable.');
  return frame;
}
export const regionalTourStepFrames=(catalog:BodyCatalog,tour:RegionalTour)=>
  tour.steps.some(s=>s.frameIds)?tour.steps.map((_,i)=>regionalTourFrame(catalog,tour,i)):undefined;
/** Complete sequence plus all visible context is material review evidence. */
export function regionalTourEvidence(catalog:BodyCatalog,structureId:string) {
  return regionalTours.filter(t=>[...t.contextIds,...t.steps.map(s=>s.selectedId)].includes(structureId)).map(tour=>{
    const structures=regionalTourStructures(catalog,tour);
    return structuredClone({tour,structures,bundles:catalog.bundles.filter(b=>structures.some(s=>s.bundle===b.id)),
      coordinateSystem:catalog.coordinateSystem,sourceVersion:catalog.sourceVersion,frame:regionalTourFrame(catalog,tour),
      transitionMs:1800,transition:'quintic-orbit',separation:0,
      limitations:regionalTourLimitations(tour),
      ...(tour.steps.some(s=>s.frameIds)?{stepFrames:regionalTourStepFrames(catalog,tour)}:{})});
  });
}

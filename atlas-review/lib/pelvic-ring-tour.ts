import type {RegionalTour} from './regional-tours';

const rightHip='vm:anatomy:body:pelvis:right:bone:right-hip-bone';
const leftHip='vm:anatomy:body:pelvis:left:bone:left-hip-bone';
const sacrum='vm:anatomy:body:spine:midline:bone:sacrum';
const rightFemur='vm:anatomy:body:thigh:right:bone:right-femur';
const leftFemur='vm:anatomy:body:thigh:left:bone:left-femur';
const ring=[rightHip,leftHip,sacrum];
const reference='https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html';
const step=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],frameIds:string[],caption:string):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,frameIds,caption,references:[reference],durationMs:16000,fadeOthers:true,
});

/** Orientation in one root-body source frame; no added joint or landmark mesh. */
export const pelvicRingTour:RegionalTour={
  id:'pelvic-ring-hip-orientation',title:'Pelvic ring & hips',region:'pelvis',
  revision:'pelvic-ring-hip-orientation-v1',status:'draft',
  description:'Six assembled views compare the hip bones, posterior sacrum and paired femora. Ring and hip camera windows keep each relationship in view.',
  limitations:'Five whole-bone root-body selections, not a complete pelvis or an independent pelvic specimen. Ilium, ischium, pubis, acetabulum, foramina and femoral landmarks are not separately selectable. Coccyx, cartilage, labra, ligaments and the symphyseal disc are omitted. Bone adjacency does not validate joint contact, joint-space measurements, mechanical stability or surgical planes. No fracture, weight-bearing simulation, acquired X-ray/CT/MRI, patient registration or sex-specific normal measurement. Fading is a display aid; all surfaces stay assembled. Draft pending revision-bound radiologist review.',
  contextIds:[],
  requiredDisplayBundles:{[rightHip]:'pelvis-skeleton',[leftHip]:'pelvis-skeleton',
    [sacrum]:'spine-skeleton',[rightFemur]:'thigh-skeleton',[leftFemur]:'thigh-skeleton'},
  steps:[
    step('ring-front','Hip bones · Anterior ring',rightHip,'anterior',ring,
      'Compare the paired hip bones. Each adult bone combines ilium, ischium and pubis. Their anterior pubic relationship is shown without a separate symphyseal disc.'),
    step('sacrum-back','Sacrum · Posterior ring',sacrum,'posterior',ring,
      'Sweep behind the ring to the sacrum between the hip bones. Sacroiliac relationships are orientation landmarks, not separately selected joint surfaces or validated joint spaces.'),
    step('left-socket','Left hip bone · Lateral socket',leftHip,'left',[leftHip],
      'Inspect the left hip bone from its lateral side. The acetabulum receives the femoral head in usual anatomy; no separate socket or labrum is supplied.'),
    step('right-foramen','Right hip bone · Inferior comparison',rightHip,'inferior',[rightHip],
      'Compare the obturator region with the lateral acetabular socket. These are different features of one hip bone, not separately segmented structures or a mapped neurovascular canal.'),
    step('right-femur','Right femur · Hip relationship',rightFemur,'right',[rightHip,rightFemur],
      'Follow the right femur from head through neck towards shaft. Compare it with the right hip bone; assembled surfaces do not demonstrate validated articular contact.'),
    step('left-femur','Left femur · Paired comparison',leftFemur,'left',[leftHip,leftFemur],
      'Compare the left femur and hip bone without mirroring the right source. Whole-bone selections remain intact; this view cannot assess fracture, alignment or normal measurements.'),
  ],
};

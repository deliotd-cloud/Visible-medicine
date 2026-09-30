import type {RegionalTour} from './regional-tours';

const kidney=(side:'right'|'left')=>`vm:anatomy:body:abdomen:${side}:organ:${side}-kidney`;
const artery=(side:'right'|'left')=>`vm:anatomy:body:abdomen:${side}:vessel:${side}-renal-artery`;
const aorta='vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta';
const targets=[kidney('right'),artery('right'),kidney('left'),artery('left')];
const reference='https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_tables.html';
const stop=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],caption:string):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,caption,frameIds:[...targets],references:[reference],durationMs:14000,fadeOthers:true,
});

export const renalTour:RegionalTour={
  id:'renal-organs-arteries-orientation',title:'Kidneys & renal arteries',region:'abdomen',
  revision:'renal-organs-arteries-orientation-v1',status:'draft',
  description:'Compare the paired kidney exteriors and renal artery segments around the faded abdominal aorta. The four targets stay in one camera frame.',
  limitations:'Selected root-body exterior surfaces only. The independent HRA kidney specimen is not fused with this source frame. Kidney interiors, collecting tree, renal veins and surrounding fascia are omitted. The assembled source frame does not establish a continuous vessel lumen, flow, patency, branching variants, or alignment with acquired CT, MRI or ultrasound. Draft pending revision-bound radiologist review.',
  contextIds:[aorta],
  requiredDisplayBundles:{
    [kidney('right')]:'abdomen-organs',[artery('right')]:'abdomen-vessels-recovery',
    [kidney('left')]:'abdomen-organs',[artery('left')]:'abdomen-vessels-recovery',
    [aorta]:'abdomen-vessels-recovery',
  },
  steps:[
    stop('right-kidney','Right kidney · Posterior',kidney('right'),'posterior',
      'Begin at the right kidney against the posterior abdominal wall. In usual anatomy it sits slightly lower than the left kidney; compare these exterior surfaces in the common frame.'),
    stop('right-renal-artery','Right renal artery · Anterior',artery('right'),'anterior',
      'Turn anteriorly to the right renal artery. Renal arteries usually branch from the abdominal aorta; the right is typically longer as it crosses towards the right kidney.'),
    stop('left-kidney','Left kidney · Posterior',kidney('left'),'posterior',
      'Compare the left kidney with the right. Their hila face medially in usual anatomy. These outlines do not show the interior of either kidney.'),
    stop('left-renal-artery','Left renal artery · Anterior',artery('left'),'anterior',
      'Finish at the left renal artery beside the faded aorta. Compare its course with the right artery without inferring vessel continuity or a patient-specific branching pattern.'),
  ],
};

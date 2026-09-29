import type { RegionalTour } from './regional-tours';

const artery=(name:string)=>`vm:anatomy:body:shoulder-arm:right:vessel:right-${name}-artery`;
const axillary=artery('axillary'),subscapular=artery('subscapular');
const circumflex=artery('circumflex-scapular'),thoracodorsal=artery('thoracodorsal');
const scapula='vm:anatomy:upper-limb:shoulder:right:bone:scapula';
const reference='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-upper-limb/';
const stop=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],caption:string,frameIds:string[]):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,caption,frameIds,references:[reference],durationMs:14000,fadeOthers:true,
});

export const subscapularTour:RegionalTour={
  id:'right-subscapular-arterial-relationships',title:'Right shoulder: subscapular branches',
  region:'shoulder-arm',revision:'right-subscapular-arterial-relationships-v1',status:'draft',
  description:'Four arterial stops from the axillary parent to two subscapular branches, with the right scapula as faded orientation.',
  limitations:'Selected right-sided exterior source segments, not a joined lumen or measured branch junction. No complete collateral network, perfusion territory, vessel–nerve relationship, patency, procedural route, acquired angiography or patient registration. Muscles and other branches are omitted; fading is not a dissection plane. Typical branching is not a patient-specific variant map. Draft pending revision-bound radiologist review; no clinical approval.',
  contextIds:[scapula],
  requiredDisplayBundles:{[scapula]:'shoulder-arm-skeleton',[axillary]:'shoulder-arm-vessels-recovery',[subscapular]:'subscapular-arteries',[circumflex]:'shoulder-arm-vessels-recovery',[thoracodorsal]:'shoulder-arm-vessels-recovery'},
  steps:[
    stop('axillary','Axillary artery · Parent',axillary,'anterior',
      'Begin with the right axillary artery. The subscapular artery usually arises from its third part. The scapula provides faded orientation; pectoralis minor, which defines the axillary parts, is not shown.',[axillary,subscapular,circumflex,thoracodorsal]),
    stop('subscapular','Subscapular artery · Branching point',subscapular,'right',
      'Move closer to the short subscapular surface. Its usual branches are the circumflex scapular and thoracodorsal arteries. These separately supplied segments retain their source positions; proximity does not prove a joined lumen.',[subscapular,circumflex]),
    stop('circumflex','Circumflex scapular artery · Posterior',circumflex,'posterior',
      'Turn posteriorly to the circumflex scapular branch. In typical anatomy it contributes to the scapular arterial anastomosis. The other contributors and complete collateral network are outside this tour.',[subscapular,circumflex]),
    stop('thoracodorsal','Thoracodorsal artery · Descending branch',thoracodorsal,'right',
      'Compare the longer descending thoracodorsal segment with its subscapular parent. This artery supplies latissimus dorsi in usual anatomy. The muscle and accompanying nerve are not displayed; no perfusion or nerve course is simulated.',[subscapular,thoracodorsal]),
  ],
};

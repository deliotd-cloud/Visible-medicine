import type { RegionalTour } from './regional-tours';

const bone=(name:string)=>`vm:anatomy:body:spine:midline:bone:${name}`;
const disc=(level:string)=>`vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-${level}-lumbar-vertebra`;
const l4=bone('fourth-lumbar-vertebra'),l5=bone('fifth-lumbar-vertebra'),sacrum=bone('sacrum');
const d4=disc('fourth'),d5=disc('fifth');
const bones='https://anatomy.ttuhscep.edu/schemes/back_tables.html';
const joints='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/joint-tables/joints-and-ligaments-of-the-back-region/';
const stop=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],caption:string,frameIds:string[],reference:string):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,caption,frameIds,references:[reference],durationMs:14000,fadeOthers:true,
});

export const lumbarTour:RegionalTour={
  id:'lower-lumbar-sacral-orientation',title:'Lower lumbar spine & sacrum',
  region:'spine',revision:'lower-lumbar-sacral-orientation-v1',status:'draft',
  description:'Five stops comparing L4, L5, two source-labelled whole discs and the sacrum in their original shared frame.',
  limitations:'Selected bone and whole-disc source surfaces only. Disc names retain the source labels; they do not establish patient-level numbering or a validated two-vertebra imaging interval. Annulus, nucleus and endplates are not separately segmented. Nerve roots, cauda equina, ligaments, capsules and canal contents are not shown. No herniation, stenosis, motion, load, needle route, acquired scan or spatial registration is demonstrated. Draft pending revision-bound radiologist review; no clinical approval.',
  contextIds:[],
  requiredDisplayBundles:{[l4]:'spine-skeleton',[l5]:'spine-skeleton',[sacrum]:'spine-skeleton',[d4]:'spine-connective-gaps',[d5]:'spine-connective-gaps'},
  steps:[
    stop('l4','L4 · Body and posterior arch',l4,'anterior',
      'Begin at the fourth lumbar vertebra. Identify its large body and the posterior arch. The neighbouring L5 and sacrum remain as orientation; the displayed labels are source identities, not a patient-numbering method.',[l4,l5,sacrum],bones),
    stop('disc-l4','Disc labelled L4 · Whole surface',d4,'right',
      'Turn laterally to the disc labelled for the fourth lumbar vertebra. Intervertebral discs connect adjacent vertebral bodies. This single surface does not distinguish annulus from nucleus or demonstrate disc degeneration.',[l4,d4,l5],joints),
    stop('l5','L5 · Posterior elements',l5,'posterior',
      'Inspect L5 from behind. Compare its spinous and articular processes with L4. Facet joints normally link adjacent articular processes; the model does not provide joint capsules or establish canal contents and nerve-root relationships.',[l4,l5],bones),
    stop('disc-l5','Disc labelled L5 · Sacral transition',d5,'left',
      'Compare the lower source-labelled disc with L5 and the sacrum. These surfaces remain assembled. The cutaway-free view shows gross orientation, not internal disc architecture, mechanical loading or a registered MRI slice.',[l5,d5,sacrum],joints),
    stop('sacrum','Sacrum · Anterior surface',sacrum,'anterior',
      'Finish at the triangular sacrum, normally formed by five fused vertebrae. Compare its anterior surface and foramina with the lumbar bones above. The nerves traversing these openings are not displayed.',[l5,sacrum],bones),
  ],
};

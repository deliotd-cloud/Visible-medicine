import type {RegionalTour} from './regional-tours';

const id=(side:string,name:string)=>`vm:anatomy:body:head-neck:${side}:organ:${name}`;
const callosum=id('midline','corpus-callosum'),commissure=id('midline','anterior-commissure');
const rightFornix=id('right','right-fornix-of-forebrain'),leftFornix=id('left','left-fornix-of-forebrain');
const rightAmygdala=id('right','right-amygdala'),leftAmygdala=id('left','left-amygdala');
const mammillary=id('midline','mammillary-body');
const tracts='https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p18_index.html';
const temporal='https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p21_index.html';
const memory='https://nba.uth.tmc.edu/neuroscience/s4/chapter05.html';
const step=(slug:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],frameIds:string[],caption:string,reference:string):RegionalTour['steps'][number]=>({
  id:slug,title,selectedId,view,frameIds,caption,references:[reference],durationMs:16000,fadeOthers:true,
});

/** Existing reference surfaces only. No hippocampus, inferred tract or held
 * commissure-of-fornix surface is introduced by this orientation sequence. */
export const deepBrainTour:RegionalTour={
  id:'deep-brain-commissures-limbic-landmarks',title:'Deep brain: commissures & limbic landmarks',
  region:'head-neck',revision:'deep-brain-commissures-limbic-landmarks-v1',status:'draft',
  description:'Six close-up stops compare midline connections with paired fornix and amygdala surfaces. Other structures fade to keep each landmark visible.',
  limitations:'Seven existing source selections, not a complete brain or memory circuit. The hippocampus is not shown. The unresolved commissure-of-fornix source (FMA61970) is excluded. The mammillary bodies remain one grouped selection. Surface adjacency does not prove fibre continuity, tract direction or function. Fading is a display aid, not tissue removal or a surgical plane. No acquired images, patient registration or diagnostic interpretation. Draft pending revision-bound radiologist review.',
  contextIds:[leftAmygdala],
  requiredDisplayBundles:Object.fromEntries([callosum,commissure,rightFornix,leftFornix,rightAmygdala,leftAmygdala,mammillary].map(value=>[value,'head-neck-nerves-deep-brain'])),
  steps:[
    step('callosum','Corpus callosum · Midline connection',callosum,'right',[callosum,rightFornix,leftFornix],
      'Begin from the anatomical right. The corpus callosum connects the cerebral hemispheres; the smaller fornix surfaces sit beneath its arch. Individual fibres and cortical endpoints are not represented.',tracts),
    step('anterior-commissure','Anterior commissure · Crossing the midline',commissure,'anterior',[commissure,rightFornix,leftFornix],
      'Turn anteriorly to the anterior commissure, a separate midline-crossing bundle with temporal connections. The selected surface does not trace those connections into the cortex.',tracts),
    step('right-fornix','Right fornix · Arching pathway',rightFornix,'right',[rightFornix,leftFornix,mammillary],
      'Follow the right-labelled fornix surface. The fornix carries hippocampal connections and arches beneath the corpus callosum. The hippocampus itself is absent from this scene; no missing connection is drawn.',tracts),
    step('left-fornix','Left fornix · Compare the pair',leftFornix,'left',[rightFornix,leftFornix,mammillary],
      'Sweep across to the left-labelled fornix. Compare the paired source surfaces without assuming their boundaries separate every anatomical subdivision. The unresolved commissure-of-fornix surface is deliberately omitted.',tracts),
    step('amygdala','Amygdalae · Medial temporal landmarks',rightAmygdala,'anterior',[rightAmygdala,leftAmygdala],
      'Compare the paired amygdalae, highlighting the right side. In usual anatomy the amygdala lies anterior to the hippocampus. This isolated reference view does not show the surrounding temporal lobes.',temporal),
    step('mammillary','Mammillary bodies · Grouped landmark',mammillary,'inferior',[mammillary,commissure],
      'Finish from below. Postcommissural fornix fibres reach the mammillary bodies in memory-related circuitry. Both bodies are grouped in this source selection; the connecting fibres and complete circuit are not depicted.',memory),
  ],
};

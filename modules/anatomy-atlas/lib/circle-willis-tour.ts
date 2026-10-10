import type {RegionalTour} from './regional-tours';

const artery=(side:string,name:string)=>`vm:anatomy:body:head-neck:${side}:vessel:${name}`;
const rightIca=artery('right','right-internal-carotid-artery');
const leftIca=artery('left','left-internal-carotid-artery');
const rightAca=artery('right','right-anterior-cerebral-artery');
const leftAca=artery('left','left-anterior-cerebral-artery');
const acom=artery('midline','anterior-communicating-artery');
const rightPcom=artery('right','right-posterior-communicating-artery');
const leftPcom=artery('left','left-posterior-communicating-artery');
const basilar=artery('midline','basilar-artery');
const rightPca=artery('right','right-posterior-cerebral-artery');
const leftPca=artery('left','left-posterior-cerebral-artery');
const targets=[rightIca,leftIca,rightAca,leftAca,acom,rightPcom,leftPcom,basilar,rightPca,leftPca];
const anterior='https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html';
const posterior='https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html';
const cta='https://www.radiologyinfo.org/en/info/angioct';
const mra='https://www.radiologyinfo.org/en/info/angiomr';
const step=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],frameIds:string[],caption:string,references:string[]):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,frameIds,caption,references,durationMs:16000,fadeOthers:true,
});

/** Ten original assembled source vessels; each camera window is a local orientation aid. */
export const circleWillisTour:RegionalTour={
  id:'circle-willis-arterial-orientation',title:'Circle of Willis: arterial orientation',region:'head-neck',
  revision:'circle-willis-arterial-orientation-v1',status:'draft',
  description:'Ten gradual views follow the paired carotid, anterior and posterior cerebral, communicating and basilar artery surfaces in their original assembled coordinates.',
  limitations:'Selected exterior whole-vessel surfaces, not a proven complete arterial ring or continuous lumens. A1, P1 and terminal ICA are not independently segmented; whole-course ICA bounds cannot frame the intracranial portion alone. MCA and other branching are outside this sequence. No flow, variant, stenosis or aneurysm assessment; no patient images, registration or measurements. Fading is a display aid. Draft pending revision-bound radiologist review.',
  contextIds:[],
  requiredDisplayBundles:Object.fromEntries(targets.map(id=>[id,'head-neck-vessels-recovery'])),
  steps:[
    step('right-ica','Right internal carotid artery',rightIca,'anterior',[rightIca],
      'The anterior cerebral artery usually arises from the carotid. This whole-vessel camera cannot isolate terminal ICA.',[anterior]),
    step('left-ica','Left internal carotid artery',leftIca,'left',[leftIca],
      'Compare the whole left carotid. Contrast CTA depicts vessels; noncontrast head CT differs. Neither scan is supplied.',[anterior,cta]),
    step('right-aca','Right anterior cerebral artery',rightAca,'right',[rightAca,rightIca],
      'Follow the right anterior cerebral surface; A1 is not independently selectable.',[anterior]),
    step('left-aca','Left anterior cerebral artery',leftAca,'left',[leftAca,leftIca],
      'Compare the left anterior cerebral surface in its assembled position.',[anterior]),
    step('acom','Anterior communicating artery',acom,'inferior',[rightAca,leftAca,acom],
      'The anterior communicating surface lies between paired anterior cerebral arteries; proximity cannot prove lumen continuity.',[anterior]),
    step('right-pcom','Right posterior communicating artery',rightPcom,'right',[rightPcom,rightPca],
      'The posterior communicating artery usually links carotid and posterior cerebral arteries. This window favors local surfaces.',[anterior]),
    step('left-pcom','Left posterior communicating artery',leftPcom,'left',[leftPcom,leftPca],
      'Compare the left surface. MRA depicts vessels with or without contrast; routine MRI and this mesh differ.',[anterior,mra]),
    step('basilar','Basilar artery',basilar,'posterior',[basilar,rightPca,leftPca],
      'The basilar artery usually gives rise to paired posterior cerebral arteries. These surfaces omit other posterior branches.',[posterior]),
    step('right-pca','Right posterior cerebral artery',rightPca,'right',[rightPca,basilar],
      'Follow the right posterior cerebral surface. Carotid origin can occur; this model cannot establish a variant.',[anterior,posterior]),
    step('left-pca','Left posterior cerebral artery',leftPca,'inferior',[leftPca,basilar],
      'Compare left posterior cerebral and basilar surfaces. Whole-vessel extent is not a measured P1 segment.',[anterior,posterior]),
  ],
};

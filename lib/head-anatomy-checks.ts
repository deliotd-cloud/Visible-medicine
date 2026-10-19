import {HEAD_LINK_REVISION,headConceptById} from './head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingContent} from './head-atlas-teaching.ts';

type Recipe={fact:'anatomy'|'function';prompt:string;correct:string;distractors:readonly [string,string]};
// Original questions about the existing cited facts, not new clinical claims.
const recipes:Record<string,Recipe>={
  'brainstem-midbrain':{fact:'anatomy',prompt:'Where are the colliculi relative to the cerebral aqueduct?',correct:'Behind the aqueduct',distractors:['In front of the aqueduct','Within the aqueduct lumen']},
  'brainstem-pons':{fact:'anatomy',prompt:'The dorsal pons contributes to which ventricular surface?',correct:'The floor of the fourth ventricle',distractors:['The roof of the third ventricle','The floor of the lateral ventricle']},
  'brainstem-medulla':{fact:'anatomy',prompt:'Which statement describes the medulla?',correct:'Caudal brainstem continuous with the spinal cord',distractors:['Rostral brainstem adjoining the diencephalon','A cavity within the diencephalon']},
  lateral:{fact:'function',prompt:'The {structure} communicates with the third ventricle through which route?',correct:'The same-side interventricular foramen',distractors:['The cerebral aqueduct directly','A fourth ventricular lateral aperture directly']},
  'ventricle-third':{fact:'function',prompt:'Which passage connects the third and fourth ventricles?',correct:'The cerebral aqueduct',distractors:['An interventricular foramen','The median fourth ventricular aperture']},
  'ventricle-fourth':{fact:'function',prompt:'Where do the fourth ventricular apertures lead?',correct:'The subarachnoid space',distractors:['Directly into the lateral ventricles','Directly into the third ventricle']},
  caudate:{fact:'function',prompt:'The {structure} and which other structure form the striatum?',correct:'Putamen',distractors:['Thalamus','Globus pallidus']},
  putamen:{fact:'anatomy',prompt:'The {structure} and which other structure form the lentiform nucleus?',correct:'Globus pallidus',distractors:['Caudate','Thalamus']},
  'globus-pallidus':{fact:'function',prompt:'Which pallidal segment is a major basal ganglia output structure?',correct:'Internal segment',distractors:['External segment alone','Both segments are interchangeable labels']},
  thalamus:{fact:'anatomy',prompt:'Which relationship describes the {structure}?',correct:'Medial to the posterior limb of the internal capsule',distractors:['Lateral to the posterior limb of the internal capsule','Within the third ventricular lumen']},
  'frontal-lobe':{fact:'anatomy',prompt:'Where is the {structure} relative to the central sulcus?',correct:'Anterior',distractors:['Posterior','Inside the sulcus']},
  'parietal-lobe':{fact:'anatomy',prompt:'Where is the {structure} relative to the central sulcus?',correct:'Posterior',distractors:['Anterior','Inside the sulcus']},
  'temporal-lobe':{fact:'anatomy',prompt:'Which landmark lies above the {structure}?',correct:'The lateral sulcus',distractors:['The cerebral aqueduct','The third ventricular cavity']},
  'occipital-lobe':{fact:'anatomy',prompt:'Which part of the hemisphere contains the {structure}?',correct:'Posterior part',distractors:['Anterior pole','Midline ventricular cavity']},
  hippocampus:{fact:'anatomy',prompt:'Which relationship describes the {structure}?',correct:'Medial temporal lobe, along the floor of the temporal horn',distractors:['Dorsal pons, along the floor of the fourth ventricle','Diencephalon, along the lateral wall of the third ventricle']},
};

function recipeFor(id:string){
  return recipes[id]??recipes[id.replace(/^(deep|cortex|limbic)-(left|right)-/,'').replace(/^ventricle-(left|right)-lateral$/,'lateral')];
}

export const headAnatomyCheckContent={
  schema:'vm-head-anatomy-checks-1',
  headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',
  teachingRevision:'2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a',
  status:'draft',clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Anatomy knowledge checks awaiting radiologist review. General relationships, not findings or measured function in the displayed scan. CT, MRI and the existing 3D Atlas represent separate, unregistered subjects. Answers are session-only practice, not a graded exam or recorded completion.',
  reuse:'Original questions and existing original factual explanations with source links only. No external text, figures, images, datasets or new dependencies imported.',
  questions:headTeachingContent.notes.flatMap((note,index)=>{
    const recipe=recipeFor(note.conceptId),concept=headConceptById(note.conceptId);
    if(!recipe||!concept)return [];
    const fact=note[recipe.fact],labels=[recipe.correct,...recipe.distractors];
    // Deterministic rotation avoids always placing the answer first.
    const options=labels.map((_,slot)=>({id:`option-${slot+1}`,label:labels[(slot+index)%labels.length]}));
    return [{id:`anatomy-${note.conceptId}`,conceptId:note.conceptId,label:concept.label,
      prompt:recipe.prompt.replace('{structure}',concept.label.toLowerCase()),options,
      correctOptionId:options.find(option=>option.label===recipe.correct)!.id,
      explanation:fact.text,fact:recipe.fact,sources:fact.sources,
    }];
  }),
  reviewChecks:[
    'Check each prompt, one-best-answer key and distractor for accuracy and ambiguity against the cited original anatomy/function note.',
    'Verify left/right identity and exact CT/MRI/existing 3D bindings without implying patient-space registration or full mask extent.',
    'Check correct and incorrect first-answer feedback, keyboard operation and answer reset when source, concept or surface changes.',
    'Review this separate question revision. Anatomy, clinical and guided-sequence reviews do not approve these questions.',
  ],
} as const;

export function headAnatomyCheckPacket(){
  return {content:headAnatomyCheckContent,bindings:headAnatomyCheckContent.questions.map(question=>headConceptById(question.conceptId))};
}
export const HEAD_ANATOMY_CHECK_REVISION='8944f977f4cd9d8c78055e3565587ae60c065f8fc454d8b215c680cd7b9d6f2e';

export function headAnatomyCheckForConcept(conceptId:string,revision:string,questionRevision:string=HEAD_ANATOMY_CHECK_REVISION){
  if(revision!==HEAD_LINK_REVISION||revision!==headAnatomyCheckContent.headRevision||
    HEAD_TEACHING_REVISION!==headAnatomyCheckContent.teachingRevision||questionRevision!==HEAD_ANATOMY_CHECK_REVISION)return null;
  const question=headAnatomyCheckContent.questions.find(item=>item.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!question||!binding||binding.headRevision!==revision||!binding.ctHref||!binding.mriHref||!binding.atlasHref)return null;
  const sourceIds=new Set<string>(question.sources);
  return {question,binding,sources:headTeachingContent.sources.filter(source=>sourceIds.has(source.id)),revision:HEAD_ANATOMY_CHECK_REVISION,scope:headAnatomyCheckContent.scope};
}

/** Protected read-only review must verify the bytes, not merely display a hash. */
export async function verifiedHeadAnatomyCheckRevision(revision:string){
  const packet=headAnatomyCheckPacket();
  if(packet.content.questions.length!==headTeachingContent.notes.length||
    packet.content.questions.some(question=>!headAnatomyCheckForConcept(question.conceptId,revision)))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const actual=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
  return actual===HEAD_ANATOMY_CHECK_REVISION?actual:null;
}

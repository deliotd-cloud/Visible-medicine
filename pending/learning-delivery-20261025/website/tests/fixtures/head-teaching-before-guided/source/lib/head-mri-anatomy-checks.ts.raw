import {HEAD_LINK_REVISION,headConceptById} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,headMriOnlyTeachingContent,headMriOnlyTeachingPacket,verifiedHeadMriOnlyTeachingRevision} from './head-mri-only-teaching.ts';

type Recipe={fact:'anatomy'|'function';prompt:string;correct:string;distractors:readonly [string,string]};
// Original questions about existing cited facts; no new clinical claims or imported text.
const amygdala:Recipe={fact:'function',prompt:'Which role is associated with networks involving the {structure}?',
  correct:'Associating sensory events with emotional significance and learned responses',
  distractors:['Connecting cerebral areas across the two hemispheres','Releasing hormones that regulate water balance']};
const recipes:Record<string,Recipe>={
  'limbic-left-amygdala':amygdala,
  'limbic-right-amygdala':amygdala,
  'commissure-corpus-callosum':{fact:'function',prompt:'Which connection is provided by callosal fibres?',
    correct:'Cerebral areas across the two hemispheres',distractors:['The pituitary gland to its bony container','The third ventricle directly to the subarachnoid space']},
  'endocrine-pituitary-gland':{fact:'anatomy',prompt:'Which bony location contains the pituitary gland?',
    correct:'The sella turcica of the sphenoid bone',distractors:['The cribriform plate of the ethmoid bone','The internal acoustic meatus of the temporal bone']},
};

export const headMriAnatomyCheckContent={
  schema:'vm-head-mri-anatomy-checks-1',
  headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',
  teachingRevision:'fc36d805260460f51b5be65a074a4d70624b7f63e77039f2b670d10c96b5004c',
  status:'draft',clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Anatomy understanding draft awaiting independent, exact-revision radiologist review. General anatomy and function, not findings or measured function in the displayed MRI. MRI and the existing generic 3D Atlas are separate, unregistered subjects. No exact CT counterpart is mapped. Answers are one-session practice only, not a graded exam, saved response or recorded completion.',
  reuse:'Original questions with existing original explanations and credited factual references only. No external text, figures, images, scans, models or datasets imported; source access does not confer reuse rights. No new assets, dependencies or fees.',
  questions:headMriOnlyTeachingContent.notes.flatMap((note,index)=>{
    const recipe=recipes[note.conceptId],binding=headConceptById(note.conceptId);
    if(!recipe||!binding)return [];
    const fact=note[recipe.fact],labels=[recipe.correct,...recipe.distractors];
    const options=labels.map((_,slot)=>({id:`option-${slot+1}`,label:labels[(slot+index)%labels.length]}));
    return [{id:`mri-anatomy-${note.conceptId}`,conceptId:note.conceptId,label:binding.label,
      prompt:recipe.prompt.replace('{structure}',binding.label.toLowerCase()),options,
      correctOptionId:options.find(option=>option.label===recipe.correct)!.id,
      explanation:fact.text,fact:recipe.fact,sources:fact.sources,
    }];
  }),
  reviewChecks:[
    'Check each original prompt, single correct answer and distractor against the cited anatomy/function fact for accuracy and ambiguity.',
    'Verify both amygdala identities and all exact MRI/existing 3D targets; retain the partial callosal and whole-gland limits in the bound teaching packet.',
    'Confirm that no question implies functional activation, tissue normality, complete mask coverage, patient-space registration or an exact CT counterpart.',
    'Check first-answer feedback, keyboard operation and one-session answer reset when question revision, head source, concept or surface changes.',
    'Review this separate question revision and its complete bound MRI teaching packet. Existing anatomy, MRI-only teaching and clinical forms do not save or approve these questions.',
  ],
} as const;

/** Bind every existing teaching fact, source, scope and target, not just answer explanations. */
export function headMriAnatomyCheckPacket(){
  return {content:headMriAnatomyCheckContent,
    bindings:headMriAnatomyCheckContent.questions.map(question=>headConceptById(question.conceptId)),
    teachingRevision:HEAD_MRI_ONLY_TEACHING_REVISION,teachingPacket:headMriOnlyTeachingPacket()};
}
export const HEAD_MRI_ANATOMY_CHECK_REVISION='71f386b735182ce46c0282700b4fe69c1137eb5b8365b706c639deab1222ab2a';

export function headMriAnatomyCheckForConcept(conceptId:string,revision:string,surface:'CT'|'MRI'|'3D',questionRevision:string=HEAD_MRI_ANATOMY_CHECK_REVISION){
  if((surface!=='MRI'&&surface!=='3D')||!headLinksCurrent()||revision!==HEAD_LINK_REVISION||revision!==headMriAnatomyCheckContent.headRevision||
    HEAD_MRI_ONLY_TEACHING_REVISION!==headMriAnatomyCheckContent.teachingRevision||questionRevision!==HEAD_MRI_ANATOMY_CHECK_REVISION)return null;
  const question=headMriAnatomyCheckContent.questions.find(item=>item.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!question||!binding||binding.conceptId!==conceptId||binding.headRevision!==revision||Object.hasOwn(binding,'ctHref')||!binding.mriHref||!binding.atlasHref)return null;
  const sourceIds=new Set<string>(question.sources);
  return {question,binding,sources:headMriOnlyTeachingContent.sources.filter(source=>sourceIds.has(source.id)),revision:HEAD_MRI_ANATOMY_CHECK_REVISION,scope:headMriAnatomyCheckContent.scope};
}

/** Protected read-only Review verifies both complete packets before exposing keys or links. */
export async function verifiedHeadMriAnatomyCheckRevision(manifestRevision:string):Promise<string|null>{
  if(!headLinksCurrent()||await verifiedHeadMriOnlyTeachingRevision(manifestRevision)!==headMriAnatomyCheckContent.teachingRevision)return null;
  const packet=headMriAnatomyCheckPacket();
  if(packet.content.questions.length!==4||packet.content.questions.length!==packet.teachingPacket.content.notes.length||
    packet.content.questions.some(question=>!headMriAnatomyCheckForConcept(question.conceptId,manifestRevision,'MRI')||!headMriAnatomyCheckForConcept(question.conceptId,manifestRevision,'3D')))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const actual=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
  return actual===HEAD_MRI_ANATOMY_CHECK_REVISION?actual:null;
}

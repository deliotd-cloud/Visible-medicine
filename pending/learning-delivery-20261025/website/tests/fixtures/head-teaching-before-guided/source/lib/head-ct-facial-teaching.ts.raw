import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {CT_FACIAL_COMPARISON_CONCEPTS,HEAD_CT_FACIAL_COMPARISON_REVISION,verifiedHeadCtFacialComparisonPacket} from './head-ct-facial-comparison-review.ts';

// Independent draft: source and packet verification do not confer clinical approval.
const identities=[
  {conceptId:'bone-left-zygomatic',id:'cth.fac.zygomatic_bone.left',label:'Left zygomatic bone — limited region',laterality:'left',representation:'partial-mask'},
  {conceptId:'bone-right-zygomatic',id:'cth.fac.zygomatic_bone.right',label:'Right zygomatic bone — limited region',laterality:'right',representation:'partial-mask'},
  {conceptId:'bone-mandible',id:'cth.fac.mandible',label:'Mandible — regional mask',laterality:'midline_or_unpaired',representation:'mask'},
] as const;

export const headCtFacialTeachingContent={
  schema:'vm-head-ct-facial-teaching-1',
  headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',
  comparisonRevision:HEAD_CT_FACIAL_COMPARISON_REVISION,
  status:'draft',reviewedAt:null,clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  sources:[{id:'openstax-skull',title:'OpenStax · Anatomy and Physiology 2e · 7.2 The Skull',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull',accessed:'2026-10-16',reuse:'Factual reference only. Original summaries and questions; no source prose, figures, exercises, datasets or models imported. Citation conveys no reuse licence.'}],
  scope:'CT-only draft for three independent semantic links. The zygomatic masks cover limited regions; a mandible mask label does not establish complete bone coverage. The CT regions and generic 3D bones have different subjects and extents and are not spatially registered. No MRI, X-ray or ultrasound counterpart, acquired view, diagnostic finding, clinical approval or publication approval is claimed. Awaiting revision-bound radiologist review.',
  imaging:{CT:{text:'Confirm native orientation and side, inspect adjacent CT slices with overlay hidden and shown, and describe only the saved region actually visible. Inspect the generic 3D bone separately; do not infer complete coverage or matching coordinates.',sources:[]}},
  notes:[
    {conceptId:'bone-left-zygomatic',anatomy:{text:'The left zygomatic bone contributes to the lateral orbital wall, lateral floor and rim. Its temporal process joins the temporal bone in the arch.',sources:['openstax-skull']},function:{text:'It helps form the orbit and cheek.',sources:['openstax-skull']},task:'Confirm left on native CT. Trace the limited region over adjacent slices, toggle the overlay, and compare the separate generic left zygomatic bone.'},
    {conceptId:'bone-right-zygomatic',anatomy:{text:'The right zygomatic bone contributes to the lateral orbital wall, lateral floor and rim. Its temporal process joins the temporal bone in the arch.',sources:['openstax-skull']},function:{text:'It helps form the orbit and cheek.',sources:['openstax-skull']},task:'Confirm right on native CT. Trace the limited region over adjacent slices, toggle the overlay, and compare the separate generic right zygomatic bone.'},
    {conceptId:'bone-mandible',anatomy:{text:'The mandible forms the lower jaw, supports lower teeth and has a body and two rami. Its condyles articulate with temporal bones.',sources:['openstax-skull']},function:{text:'This articulation permits opening and closing the mouth.',sources:['openstax-skull']},task:'Inspect the saved mandible region on adjacent native CT slices with overlay hidden and shown. Compare the generic mandible separately; verify which parts are actually represented.'},
  ],
  questions:[
    {id:'facial-bone-left-zygomatic',conceptId:'bone-left-zygomatic',prompt:'Which left orbital surfaces include zygomatic bone?',options:[{id:'a',label:'Lateral wall, lateral floor and rim'},{id:'b',label:'Medial wall'},{id:'c',label:'Roof'}],correctOptionId:'a',explanation:'It contributes to the lateral wall, lateral floor and rim.',sources:['openstax-skull']},
    {id:'facial-bone-right-zygomatic',conceptId:'bone-right-zygomatic',prompt:'Which process joins the temporal bone in the right zygomatic arch?',options:[{id:'a',label:'Mandibular condyle'},{id:'b',label:'Right zygomatic temporal process'},{id:'c',label:'Mandibular body'}],correctOptionId:'b',explanation:'The right zygomatic temporal process meets the temporal bone.',sources:['openstax-skull']},
    {id:'facial-bone-mandible',conceptId:'bone-mandible',prompt:'Which mandibular parts articulate with temporal bones?',options:[{id:'a',label:'Teeth'},{id:'b',label:'Body'},{id:'c',label:'Condyles'}],correctOptionId:'c',explanation:'The condyles articulate with temporal bones, allowing mouth movement.',sources:['openstax-skull']},
  ],
  reviewChecks:[
    'Verify each original fact and one-best-answer question against the cited skull anatomy source.',
    'Confirm exact native ID, label, side, representation, source revision and 3D binding; inspect actual extents independently.',
    'Review this teaching and question content as a separate packet; earlier comparison, six-bone, guide and quiz decisions do not approve it.',
  ],
} as const;

// SHA-256 of JSON.stringify(headCtFacialTeachingPacket()).
export const HEAD_CT_FACIAL_TEACHING_REVISION='b3d31a16557f53753c7f45236b94f6f39a3395f3b7b1f7810da6b629a48b4194';
export function headCtFacialTeachingPacket(){return {content:headCtFacialTeachingContent,bindings:headCtFacialTeachingContent.notes.map(note=>headConceptById(note.conceptId))};}

export function headCtFacialTeachingForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(modality!=='CT'||revision!==HEAD_LINK_REVISION||revision!==headCtFacialTeachingContent.headRevision)return null;
  const note=headCtFacialTeachingContent.notes.find(item=>item.conceptId===conceptId),concept=headConceptById(conceptId);
  if(!note||!concept||concept.headRevision!==revision||concept.ctHref!==`/atlas/ct-head?concept=${conceptId}`||Object.hasOwn(concept,'mriHref'))return null;
  return {note,concept,imaging:headCtFacialTeachingContent.imaging.CT,scope:headCtFacialTeachingContent.scope,sources:headCtFacialTeachingContent.sources,revision:HEAD_CT_FACIAL_TEACHING_REVISION};
}
export function headCtFacialTeachingForReference(conceptId:string,revision:string){
  const value=headCtFacialTeachingForConcept(conceptId,'CT',revision);if(!value)return null;
  return {concept:value.concept,anatomy:value.note.anatomy,function:value.note.function,scope:value.scope,sources:value.sources,revision:value.revision};
}
export function headCtFacialQuestionForConcept(conceptId:string,revision:string,questionRevision:string=HEAD_CT_FACIAL_TEACHING_REVISION){
  if(questionRevision!==HEAD_CT_FACIAL_TEACHING_REVISION)return null;
  const teaching=headCtFacialTeachingForConcept(conceptId,'CT',revision),question=headCtFacialTeachingContent.questions.find(item=>item.conceptId===conceptId);
  return teaching&&question?{question,binding:teaching.concept,sources:teaching.sources,scope:teaching.scope,revision:questionRevision}:null;
}

export async function verifiedHeadCtFacialTeachingRevision(manifestRevision:string):Promise<string|null>{
  const comparison=await verifiedHeadCtFacialComparisonPacket(manifestRevision);
  if(!comparison||manifestRevision!==HEAD_LINK_REVISION||headCtFacialTeachingContent.headRevision!==manifestRevision||
    headCtFacialTeachingContent.comparisonRevision!==HEAD_CT_FACIAL_COMPARISON_REVISION||
    headCtFacialTeachingContent.status!=='draft'||headCtFacialTeachingContent.reviewedAt!==null||
    headCtFacialTeachingContent.clinicalApproval||headCtFacialTeachingContent.publicationApproval||headCtFacialTeachingContent.patientRegistration||
    comparison.items.length!==identities.length||headCtFacialTeachingContent.notes.length!==identities.length||
    headCtFacialTeachingContent.questions.length!==identities.length)return null;
  const packet=headCtFacialTeachingPacket();
  for(let index=0;index<identities.length;index++){
    const expected=identities[index],item=comparison.items[index],note=packet.content.notes[index],question=packet.content.questions[index],binding=packet.bindings[index];
    if(CT_FACIAL_COMPARISON_CONCEPTS[index]!==expected.conceptId||item?.conceptId!==expected.conceptId||
      JSON.stringify(item.ct)!==JSON.stringify({id:expected.id,label:expected.label,laterality:expected.laterality,representation:expected.representation})||
      note?.conceptId!==expected.conceptId||question?.conceptId!==expected.conceptId||!binding||
      binding.conceptId!==expected.conceptId||binding.headRevision!==manifestRevision||
      binding.ctHref!==`/atlas/ct-head?concept=${expected.conceptId}`||Object.hasOwn(binding,'mriHref')||
      JSON.stringify(binding)!==JSON.stringify(item.binding)||
      question.options.filter(option=>option.id===question.correctOptionId).length!==1)return null;
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  return actual===HEAD_CT_FACIAL_TEACHING_REVISION?actual:null;
}

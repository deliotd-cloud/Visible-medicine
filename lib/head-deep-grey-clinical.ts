import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';

/** Shared bilateral principles: laterality is an identity, not a different disease claim. */
const topics=[
  {part:'caudate',label:'Caudate',title:'localisation is not a syndrome lookup',text:'Use the caudate label for anatomical orientation, not to predict a fixed clinical syndrome. The lacunar-syndrome study found that similar clinical presentations could accompany different lesion locations, including deep grey and neighbouring white matter.',caution:'The study did not isolate a caudate-only cohort. This whole-structure mask outlines neither an infarct nor the connected pathways that determine an individual presentation.',sources:['chung-2006'],question:'Does identifying the caudate prove a particular lacunar syndrome?',answer:'No. An anatomical label does not establish a lesion or a clinical syndrome; imaging and clinical localisation are separate evidence.'},
  {part:'putamen',label:'Putamen',title:'an unrevealing CT is not exclusion',text:'Small acute subcortical infarcts may be inconspicuous on non-contrast CT. In the cited early-stroke cohort, adding CT angiography and perfusion improved detection, but the combined protocol still missed infarcts.',caution:'This was a selected lacunar-syndrome cohort, not putamen-specific test performance. A coloured anatomical mask cannot establish perfusion or exclude an acute lesion.',sources:['das-2015'],question:'Does a clear putamen outline exclude a small acute infarct?',answer:'No. The outline is teaching anatomy; lesion detection depends on the acquired images, protocol, timing and clinical assessment.'},
  {part:'globus-pallidus',label:'Globus pallidus',title:'age and MRI measurements need context',text:'A healthy-adult study found age-related differences in pallidal morphology and T1-weighted/T2-weighted signal ratios. A single reference surface or colour therefore cannot serve as a universal normal appearance or quantitative age standard.',caution:'This was cross-sectional research, not a diagnostic threshold. A T1w/T2w ratio is not the signal of either sequence alone or a direct measurement of tissue pathology.',sources:['tullo-2019'],question:'Can this pallidal colour or shape define a normal MRI signal?',answer:'No. Atlas colour is illustrative, and research ratios and group age associations do not diagnose an individual scan.'},
  {part:'thalamus',label:'Thalamus',title:'recent infarct is not synonymous with a chronic lacune',text:'In a longitudinal study that included thalamic and other small subcortical infarcts, some recent MRI-defined lesions developed cavities and others did not. A recent infarct and a later cavity describe different stages of evidence.',caution:'Only a selected subgroup had follow-up MRI. The cohort result is not a thalamus-specific probability, and this anatomical mask supplies no lesion age or cavity boundary.',sources:['okazaki-2015'],question:'Must every recent small subcortical infarct become a visible cavity?',answer:'No. Follow-up appearances varied in the study; a regional anatomical label cannot establish infarct evolution.'},
] as const;

/** Original source-limited factual paraphrases; no third-party assets imported. */
export const deepGreyClinicalContent={
  schema:'vm-deep-grey-clinical-1',headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',status:'draft',
  clinicalApproval:false,publicationApproval:false,patientRegistration:false,
  scope:'Clinical teaching drafts awaiting radiologist review, not findings in the displayed scans. CT, MRI and the existing reference 3D Atlas are separate, unregistered subjects. Regional masks do not delineate lesions, perforator territories, functional pathways or validated quantitative measurements. The same clinical principle applies to both sides; left/right labels identify the selected anatomy only.',
  sources:[
    {id:'das-2015',title:'Das et al. (2015) · Multimodal CT and lacunar infarct detection',url:'https://pubmed.ncbi.nlm.nih.gov/25721075/',evidence:'Final cohort: 88 early lacunar-syndrome presentations, 59 with DWI/ADC-confirmed infarcts. Incremental CT improved detection but remained imperfect; no putamen-specific sensitivity established here.'},
    {id:'chung-2006',title:'Chung et al. (2006) · Primary DWI in lacunar syndromes',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2564205/',evidence:'151 presentations, selected for classic syndromes and 3–48-hour symptoms. Some clinically diagnosed infarcts lacked initial DWI findings; ADC maps were not routinely acquired. Not a caudate-only cohort or a modern protocol recommendation.'},
    {id:'tullo-2019',title:'Tullo et al. (2019) · Adult deep-grey morphology and MRI signal ratios',url:'https://pubmed.ncbi.nlm.nih.gov/31452289/',evidence:'Cross-sectional healthy-adult research: 178 morphological analyses and 162 T1w/T2w analyses after quality control. Group age associations are not individual diagnostic cut-offs.'},
    {id:'okazaki-2015',title:'Okazaki et al. (2015) · Evolution of recent small subcortical infarcts',url:'https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2015.00118/full',evidence:'62 selected follow-up cases from 537 patients; 13 thalamic lesions. Cavitation varied across the cohort. Follow-up selection and mixed locations limit generalisation.'},
  ],
  reuse:'Original factual paraphrases and primary-source links only. No article passages, figures, scans, models or datasets copied. Reading these references does not grant image-reuse rights. No new dependency, asset licence or fee.',
  accessed:'2026-10-11',
  imaging:{
    CT:{text:'Do not use a normal-looking anatomical outline to exclude acute small subcortical infarction. The early-stroke CT study showed incomplete detection even after adding angiography and perfusion. Its findings are not sensitivity estimates for each deep-grey nucleus or every current protocol.',sources:['das-2015']},
    MRI:{text:'Check which sequence is actually displayed; structural MRI is not automatically DWI. In the selected lacunar-syndrome study, some clinically diagnosed infarcts had no initial DWI lesion. Its historical limited acquisition did not routinely include ADC maps and is not a current diagnostic protocol.',sources:['chung-2006']},
  },
  notes:['left','right'].flatMap(side=>topics.map(({part,label,title,...note})=>({conceptId:`deep-${side}-${part}`,title:`${side==='left'?'Left':'Right'} ${label.toLowerCase()} · ${title}`,...note}))),
  reviewChecks:[
    'Check each factual statement against its primary study; retain cohort, timing, acquisition, follow-up and population limitations.',
    'Verify all eight native CT/MRI concepts and existing 3D selections against the exact head revision, including left/right identity.',
    'Confirm no inferred lesion, artery territory, clinical syndrome, tissue measurement or patient-space registration is attributed to an anatomical mask.',
    'Review this independent clinical packet. Anatomy, quiz, guided-sequence and earlier clinical decisions do not approve it.',
  ],
} as const;

export const DEEP_GREY_CLINICAL_REVISION='6f966b9f29ebd4a77fd8d6547c29c509e8c616f9158e3c0994ca05b7bb5d81e9';
export function deepGreyClinicalPacket(){return {content:deepGreyClinicalContent,bindings:deepGreyClinicalContent.notes.map(note=>headConceptById(note.conceptId))};}
export function deepGreyClinicalForConcept(conceptId:string,modality:HeadModality,revision:string){
  if(!headLinksCurrent()||revision!==HEAD_LINK_REVISION||revision!==deepGreyClinicalContent.headRevision||(modality!=='CT'&&modality!=='MRI'))return null;
  const note=deepGreyClinicalContent.notes.find(item=>item.conceptId===conceptId),binding=headConceptById(conceptId);
  if(!note||!binding||binding.conceptId!==conceptId||binding.headRevision!==revision||!binding.atlasHref||!binding.ctHref||!binding.mriHref)return null;
  const imaging=deepGreyClinicalContent.imaging[modality],ids=new Set<string>([...note.sources,...imaging.sources]);
  return {note,binding,imaging,sources:deepGreyClinicalContent.sources.filter(source=>ids.has(source.id)),scope:deepGreyClinicalContent.scope,revision:DEEP_GREY_CLINICAL_REVISION};
}

/** Separate read-only Review identity: changed content or any binding refuses. */
export async function verifiedDeepGreyClinicalRevision(manifestRevision:string):Promise<string|null>{
  if(!headLinksCurrent()||manifestRevision!==HEAD_LINK_REVISION||manifestRevision!==deepGreyClinicalContent.headRevision)return null;
  const packet=deepGreyClinicalPacket();
  if(packet.bindings.some((binding,index)=>!binding||binding.headRevision!==manifestRevision||binding.conceptId!==packet.content.notes[index].conceptId||!binding.atlasHref||!binding.ctHref||!binding.mriHref))return null;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return revision===DEEP_GREY_CLINICAL_REVISION?revision:null;
}

import {authorizeClinicalReview} from '@/lib/clinical-review-server';
import {HeadAtlasTeachingReview} from '@/components/HeadAtlasTeachingReview';
import {HEAD_MANIFEST_SHA256} from '@/lib/head-atlas-import';
import {headTeachingDraftContext} from '@/lib/head-teaching-review-contract';
import {HeadTeachingReviewNotes} from '@/components/HeadTeachingReviewNotes';
import {HeadMriComparisonReview} from '@/components/HeadMriComparisonReview';
import {verifiedHeadMriComparisonPacket} from '@/lib/head-mri-comparison-review';
import {verifiedHeadMriOnlyTeachingRevision} from '@/lib/head-mri-only-teaching';
import {verifiedHeadMriLearningRevision} from '@/lib/head-mri-learning';
import {headMriLearningSequences} from '@/lib/head-mri-learning';
import {headLearningSequences,HEAD_LEARNING_REVISION} from '@/lib/head-atlas-learning';
import {headMriDraftContext} from '@/lib/head-mri-review-draft-contract';
import {HeadMriReviewNotes} from '@/components/HeadMriReviewNotes';
import {HeadInsulaComparisonReview} from '@/components/HeadInsulaComparisonReview';
import {verifiedHeadInsulaComparisonPacket} from '@/lib/head-insula-comparison-review';
import {verifiedHeadInsulaTeachingRevision} from '@/lib/head-insula-teaching';
import {verifiedHeadInsulaLearningRevision} from '@/lib/head-insula-learning';
import {headInsulaLearningSequences} from '@/lib/head-insula-learning';
import {HeadOrbitalComparisonReview} from '@/components/HeadOrbitalComparisonReview';
import {verifiedHeadOrbitalComparisonPacket} from '@/lib/head-orbital-comparison-review';
import {verifiedHeadOrbitalTeachingRevision} from '@/lib/head-orbital-teaching';
import {verifiedHeadOrbitalLearningRevision} from '@/lib/head-orbital-learning';
import {headOrbitalLearningSequences} from '@/lib/head-orbital-learning';
import {HeadCtBoneComparisonReview} from '@/components/HeadCtBoneComparisonReview';
import {verifiedHeadCtBoneComparisonPacket} from '@/lib/head-ct-bone-comparison-review';
import {headCtBoneLearningSequences,verifiedHeadCtBoneLearningRevision} from '@/lib/head-ct-bone-learning';
import {HeadCtFacialComparisonReview} from '@/components/HeadCtFacialComparisonReview';
import {verifiedHeadCtFacialComparisonPacket} from '@/lib/head-ct-facial-comparison-review';
import {HeadCtFacialLearningReview} from '@/components/HeadCtFacialLearningReview';
import {verifiedHeadCtFacialLearningRevision} from '@/lib/head-ct-facial-learning';
import {verifiedHeadCtBoneTeachingRevision} from '@/lib/head-ct-bone-teaching';
import {HeadCtFacialTeachingReview} from '@/components/HeadCtFacialTeachingReview';
import {verifiedHeadCtFacialTeachingRevision} from '@/lib/head-ct-facial-teaching.ts';
import {verifiedHeadCtFacialClinicalRevision} from '@/lib/head-ct-facial-clinical.ts';
import {HeadImageOnlyComparisonReview} from '@/components/HeadImageOnlyComparisonReview';
import {verifiedHeadImageOnlyComparisonPacket} from '@/lib/head-image-only-comparison-review';
import {headImageConceptById} from '@/lib/head-image-only-links';
import {verifiedHeadCerebellarTeachingRevision} from '@/lib/head-cerebellar-teaching';
import {verifiedHeadCerebellarLearningRevision} from '@/lib/head-cerebellar-learning';
import {headCerebellarLearningSequences} from '@/lib/head-cerebellar-learning';
import {verifiedHeadAnatomyCheckRevision} from '@/lib/head-anatomy-checks';
import {HeadAnatomyChecksReview} from '@/components/HeadAnatomyChecksReview';
import {HeadMriAnatomyChecksReview} from '@/components/HeadMriAnatomyChecksReview';
import {headMriAnatomyCheckContent,verifiedHeadMriAnatomyCheckRevision} from '@/lib/head-mri-anatomy-checks';
import {HeadCerebellarClinicalReview} from '@/components/HeadCerebellarClinicalReview';
import {verifiedCerebellarClinicalRevision} from '@/lib/head-cerebellar-clinical';
import {HeadDeepGreyClinicalReview} from '@/components/HeadDeepGreyClinicalReview';
import {verifiedDeepGreyClinicalRevision} from '@/lib/head-deep-grey-clinical';
import {HeadLobarClinicalReview} from '@/components/HeadLobarClinicalReview';
import {verifiedLobarClinicalRevision} from '@/lib/head-lobar-clinical';
import {HeadHippocampalClinicalReview} from '@/components/HeadHippocampalClinicalReview';
import {verifiedHippocampalClinicalRevision} from '@/lib/head-hippocampal-clinical';
import {HeadMriOnlyClinicalReview} from '@/components/HeadMriOnlyClinicalReview';
import {mriOnlyClinicalContent,verifiedMriOnlyClinicalRevision} from '@/lib/head-mri-only-clinical';

export const dynamic='force-dynamic';
export const metadata={title:'Head learning draft · Clinical Review',robots:{index:false,follow:false}};
export default async function HeadLearningReviewPage(){
  try{await authorizeClinicalReview();}
  catch{return <p role="alert">Open Clinical Review with an authorized administrator account to inspect this teaching draft.</p>;}
  let context;
  try{context=await headTeachingDraftContext(HEAD_MANIFEST_SHA256);}
  catch{return <p role="alert">The head source or teaching packet changed. Draft review is unavailable until the exact binding is restored.</p>;}
  let clinicalContext;
  try{clinicalContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'brainstem-clinical');}
  catch{/* Do not attach an unverified clinical extension to the original notes. */}
  let ventricularContext;
  try{ventricularContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'ventricular-clinical');}
  catch{/* The independent packet remains readable without offering an unverified save. */}
  const comparisons=await verifiedHeadMriComparisonPacket(HEAD_MANIFEST_SHA256);
  const mriTeachingRevision=await verifiedHeadMriOnlyTeachingRevision(HEAD_MANIFEST_SHA256);
  const mriLearningRevision=await verifiedHeadMriLearningRevision(HEAD_MANIFEST_SHA256);
  let mriContext;
  try{mriContext=await headMriDraftContext(HEAD_MANIFEST_SHA256);}
  catch{/* Keep independently valid evidence readable, but withhold the save form. */}
  const insulaComparisons=await verifiedHeadInsulaComparisonPacket(HEAD_MANIFEST_SHA256);
  const insulaTeachingRevision=await verifiedHeadInsulaTeachingRevision(HEAD_MANIFEST_SHA256);
  const insulaLearningRevision=await verifiedHeadInsulaLearningRevision(HEAD_MANIFEST_SHA256);
  const orbitalComparisons=await verifiedHeadOrbitalComparisonPacket(HEAD_MANIFEST_SHA256);
  const orbitalTeachingRevision=await verifiedHeadOrbitalTeachingRevision(HEAD_MANIFEST_SHA256);
  const orbitalLearningRevision=await verifiedHeadOrbitalLearningRevision(HEAD_MANIFEST_SHA256);
  const ctBoneComparisons=await verifiedHeadCtBoneComparisonPacket(HEAD_MANIFEST_SHA256);
  const ctBoneLearningRevision=ctBoneComparisons?await verifiedHeadCtBoneLearningRevision(HEAD_MANIFEST_SHA256):null;
  const ctFacialComparisons=await verifiedHeadCtFacialComparisonPacket(HEAD_MANIFEST_SHA256);
  const ctFacialLearningRevision=await verifiedHeadCtFacialLearningRevision(HEAD_MANIFEST_SHA256);
  const ctBoneTeachingRevision=await verifiedHeadCtBoneTeachingRevision(HEAD_MANIFEST_SHA256);
  const ctFacialTeachingRevision=await verifiedHeadCtFacialTeachingRevision(HEAD_MANIFEST_SHA256);
  const ctFacialClinicalRevision=await verifiedHeadCtFacialClinicalRevision(HEAD_MANIFEST_SHA256);
  const imageOnlyComparisons=await verifiedHeadImageOnlyComparisonPacket(HEAD_MANIFEST_SHA256);
  const cerebellarTeachingRevision=await verifiedHeadCerebellarTeachingRevision(HEAD_MANIFEST_SHA256);
  const cerebellarLearningRevision=await verifiedHeadCerebellarLearningRevision(HEAD_MANIFEST_SHA256);
  const questionRevision=await verifiedHeadAnatomyCheckRevision(HEAD_MANIFEST_SHA256);
  const mriQuestionRevision=await verifiedHeadMriAnatomyCheckRevision(HEAD_MANIFEST_SHA256);
  const cerebellarClinicalRevision=await verifiedCerebellarClinicalRevision(HEAD_MANIFEST_SHA256);
  const deepGreyClinicalRevision=await verifiedDeepGreyClinicalRevision(HEAD_MANIFEST_SHA256);
  const lobarClinicalRevision=await verifiedLobarClinicalRevision(HEAD_MANIFEST_SHA256);
  const hippocampalClinicalRevision=await verifiedHippocampalClinicalRevision(HEAD_MANIFEST_SHA256);
  const mriOnlyClinicalRevision=await verifiedMriOnlyClinicalRevision(HEAD_MANIFEST_SHA256);
  let cerebellarContext;
  if(cerebellarClinicalRevision)try{cerebellarContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'cerebellar-clinical');}
  catch{/* Keep valid evidence readable, without offering an unverified save. */}
  let deepGreyContext;
  if(deepGreyClinicalRevision)try{deepGreyContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'deep-grey-clinical');}
  catch{/* Keep valid evidence readable, without offering an unverified save. */}
  let lobarContext;
  if(lobarClinicalRevision)try{lobarContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'lobar-clinical');}
  catch{/* Keep valid evidence readable, without offering an unverified save. */}
  let hippocampalContext;
  if(hippocampalClinicalRevision)try{hippocampalContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'hippocampal-clinical');}
  catch{/* Keep valid evidence readable, without offering an unverified save. */}
  let mriOnlyClinicalContext;
  if(mriOnlyClinicalRevision)try{mriOnlyClinicalContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'mri-only-clinical');}
  catch{/* No save form for a changed independent clinical packet. */}
  let mriQuestionContext;
  if(mriQuestionRevision)try{mriQuestionContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'mri-anatomy-checks');}
  catch{/* No save form for changed questions or their bound teaching source. */}
  const sequenceTargets=(sequences:readonly {id:string;label:string}[],revision:string)=>sequences.map(sequence=>({id:'head-guided-sequence-'+sequence.id,label:`Guided · ${sequence.label} · Draft · ${revision.slice(0,12)}`}));
  const additionalTargets=[
    ...sequenceTargets(headLearningSequences,HEAD_LEARNING_REVISION),
    ...(comparisons&&mriLearningRevision?sequenceTargets(headMriLearningSequences,mriLearningRevision):[]),
    ...(insulaComparisons&&insulaLearningRevision?sequenceTargets(headInsulaLearningSequences,insulaLearningRevision):[]),
    ...(orbitalComparisons&&orbitalLearningRevision?sequenceTargets(headOrbitalLearningSequences,orbitalLearningRevision):[]),
    ...(ctBoneComparisons&&ctBoneLearningRevision?sequenceTargets(headCtBoneLearningSequences,ctBoneLearningRevision):[]),
    ...(imageOnlyComparisons&&cerebellarLearningRevision?sequenceTargets(headCerebellarLearningSequences,cerebellarLearningRevision):[]),
    ...(mriQuestionRevision?[
      {id:'head-mri-anatomy-check-review',label:'MRI-only anatomy checks · Draft'},
      ...headMriAnatomyCheckContent.questions.map(question=>({id:'head-mri-anatomy-check-'+question.conceptId,label:question.label+' · Anatomy check draft'})),
    ]:[]),
    ...(comparisons?.items.map(item=>({id:'head-mri-comparison-'+item.conceptId,label:item.binding!.label+' · MRI-only evidence'}))??[]),
    ...(insulaComparisons?.items.map(item=>({id:'head-insula-comparison-'+item.conceptId,label:item.binding!.label+' · Insula evidence'}))??[]),
    ...(orbitalComparisons?.items.map(item=>({id:'head-orbital-comparison-'+item.conceptId,label:item.binding!.label+' · Globe evidence'}))??[]),
    ...(ctBoneComparisons?.items.map(item=>({id:'head-ct-bone-comparison-'+item.conceptId,label:item.binding!.label+' · CT-only bone evidence'}))??[]),
    ...(ctFacialComparisons?.items.map(item=>({id:'head-ct-bone-comparison-'+item.conceptId,label:item.binding!.label+' · Independent CT facial evidence'}))??[]),
    ...(ctFacialLearningRevision?[{id:'ct-facial-learning',label:'Facial guided sequence · Draft inspection'}]:[]),
    ...(ctFacialTeachingRevision&&ctFacialClinicalRevision?[{id:'head-ct-facial-teaching-review',label:'CT facial teaching and clinical orientation · Independent drafts'},...['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'].map(id=>({id:'head-ct-facial-teaching-'+id,label:id.replace('bone-','').replaceAll('-',' ')+' · Facial draft'}))]:[]),
    ...(imageOnlyComparisons?.bindings.map(item=>({id:'head-image-only-comparison-'+item.conceptId,label:headImageConceptById(item.conceptId)!.label+' · CT/MRI-only evidence'}))??[]),
    ...(cerebellarClinicalRevision?[{id:'cerebellar-clinical-review',label:'Cerebellar clinical correlations · Draft'}]:[]),
    ...(cerebellarContext?[{id:'cerebellar-clinical-corrections',label:'Cerebellar clinical corrections · Private notes'}]:[]),
    ...(deepGreyClinicalRevision?[{id:'deep-grey-clinical-review',label:'Deep-grey clinical correlations · Draft'}]:[]),
    ...(deepGreyContext?[{id:'deep-grey-clinical-corrections',label:'Deep-grey clinical corrections · Private notes'}]:[]),
    ...(lobarClinicalRevision?[{id:'lobar-clinical-review',label:'Cerebral-lobe clinical correlations · Draft'}]:[]),
    ...(lobarContext?[{id:'lobar-clinical-corrections',label:'Cerebral-lobe clinical corrections · Private notes'}]:[]),
    ...(hippocampalClinicalRevision?[{id:'hippocampal-clinical-review',label:'Hippocampal clinical correlations · Draft'}]:[]),
    ...(hippocampalContext?[{id:'hippocampal-clinical-corrections',label:'Hippocampal clinical corrections · Private notes'}]:[]),
    ...(mriOnlyClinicalContext?[{id:'mri-only-clinical-corrections',label:'MRI-only clinical corrections · Private notes'}]:[]),
    ...(mriQuestionContext?[{id:'mri-anatomy-checks-corrections',label:'MRI-only anatomy check corrections · Private notes'}]:[]),
    ...(mriOnlyClinicalRevision?[
      {id:'mri-only-clinical-review',label:'MRI-only clinical correlations · Draft'},
      ...mriOnlyClinicalContent.notes.map(note=>({id:'mri-only-clinical-'+note.conceptId,label:note.title+' · Clinical draft'})),
    ]:[]),
  ];
  return <HeadAtlasTeachingReview
    revision={HEAD_MANIFEST_SHA256}
    mriKnowledgeReview={mriQuestionRevision?<HeadMriAnatomyChecksReview revision={HEAD_MANIFEST_SHA256} questionRevision={mriQuestionRevision} reviewNotes={mriQuestionContext?<HeadTeachingReviewNotes key={JSON.stringify(mriQuestionContext)} context={mriQuestionContext}/>:undefined}/>:undefined}
    mriOnlyClinicalReview={mriOnlyClinicalRevision?<HeadMriOnlyClinicalReview revision={HEAD_MANIFEST_SHA256} clinicalRevision={mriOnlyClinicalRevision} reviewNotes={mriOnlyClinicalContext?<HeadTeachingReviewNotes key={JSON.stringify(mriOnlyClinicalContext)} context={mriOnlyClinicalContext}/>:undefined}/>:undefined}
    hippocampalReview={<HeadHippocampalClinicalReview revision={HEAD_MANIFEST_SHA256} clinicalRevision={hippocampalClinicalRevision} reviewNotes={hippocampalContext?<HeadTeachingReviewNotes key={JSON.stringify(hippocampalContext)} context={hippocampalContext}/>:undefined}/>}
    lobarReview={<HeadLobarClinicalReview revision={HEAD_MANIFEST_SHA256} clinicalRevision={lobarClinicalRevision} reviewNotes={lobarContext?<HeadTeachingReviewNotes key={JSON.stringify(lobarContext)} context={lobarContext}/>:undefined}/>}
    knowledgeReview={<HeadAnatomyChecksReview revision={HEAD_MANIFEST_SHA256} questionRevision={questionRevision}/>}
    deepGreyReview={<HeadDeepGreyClinicalReview revision={HEAD_MANIFEST_SHA256} clinicalRevision={deepGreyClinicalRevision} reviewNotes={deepGreyContext?<HeadTeachingReviewNotes key={JSON.stringify(deepGreyContext)} context={deepGreyContext}/>:undefined}/>}
    ventricularNotes={ventricularContext?<HeadTeachingReviewNotes key={JSON.stringify(ventricularContext)} context={ventricularContext}/>:undefined}
    clinicalNotes={clinicalContext?<HeadTeachingReviewNotes key={clinicalContext.packetId+clinicalContext.packetRevision+clinicalContext.headRevision+clinicalContext.checklistVersion} context={clinicalContext}/>:undefined}
    imageOnlyReview={<><HeadImageOnlyComparisonReview packet={imageOnlyComparisons} teachingRevision={cerebellarTeachingRevision} learningRevision={cerebellarLearningRevision}/><HeadCerebellarClinicalReview revision={HEAD_MANIFEST_SHA256} clinicalRevision={cerebellarClinicalRevision} reviewNotes={cerebellarContext?<HeadTeachingReviewNotes key={JSON.stringify(cerebellarContext)} context={cerebellarContext}/>:undefined}/></>}
    ctBoneReview={<><HeadCtBoneComparisonReview packet={ctBoneComparisons} teachingRevision={ctBoneTeachingRevision}/><HeadCtFacialComparisonReview packet={ctFacialComparisons}/><HeadCtFacialLearningReview manifestRevision={HEAD_MANIFEST_SHA256}/><HeadCtFacialTeachingReview manifestRevision={HEAD_MANIFEST_SHA256} teachingRevision={ctFacialTeachingRevision} clinicalRevision={ctFacialClinicalRevision}/></>}
    orbitalReview={<HeadOrbitalComparisonReview packet={orbitalComparisons} teachingRevision={orbitalTeachingRevision} learningRevision={orbitalLearningRevision}/>}
    additionalTargets={additionalTargets}
    comparisonReview={<HeadMriComparisonReview packet={comparisons} teachingRevision={mriTeachingRevision} learningRevision={mriLearningRevision} reviewNotes={mriContext?<HeadMriReviewNotes key={JSON.stringify(mriContext)} context={mriContext}/>:undefined}/>}
    insulaReview={<HeadInsulaComparisonReview packet={insulaComparisons} teachingRevision={insulaTeachingRevision} learningRevision={insulaLearningRevision}/>}
    reviewNotes={<HeadTeachingReviewNotes key={context.packetRevision+context.headRevision+context.checklistVersion} context={context}/>}
  />;
}

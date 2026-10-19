import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headMriComparisonPacket} from '../lib/head-mri-comparison-review.ts';
import {headInsulaComparisonPacket} from '../lib/head-insula-comparison-review.ts';
import {HEAD_INSULA_TEACHING_REVISION} from '../lib/head-insula-teaching.ts';
import {HEAD_INSULA_LEARNING_REVISION} from '../lib/head-insula-learning.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION} from '../lib/head-mri-only-teaching.ts';
import {HEAD_MRI_LEARNING_REVISION} from '../lib/head-mri-learning.ts';
import {headMriDraftContext} from '../lib/head-mri-review-draft-contract.ts';
import {HEAD_ORBITAL_TEACHING_REVISION} from '../lib/head-orbital-teaching.ts';
import {headOrbitalComparisonPacket} from '../lib/head-orbital-comparison-review.ts';
import {headCtBoneComparisonPacket,verifiedHeadCtBoneComparisonPacket} from '../lib/head-ct-bone-comparison-review.ts';
import {headImageOnlyComparisonPacket,headImageConceptById} from '../lib/head-image-only-links.ts';
import {verifiedHeadImageOnlyComparisonPacket} from '../lib/head-image-only-comparison-review.ts';
import {HEAD_CEREBELLAR_TEACHING_REVISION,verifiedHeadCerebellarTeachingRevision} from '../lib/head-cerebellar-teaching.ts';
import {HEAD_CEREBELLAR_LEARNING_REVISION,verifiedHeadCerebellarLearningRevision} from '../lib/head-cerebellar-learning.ts';
const orbitalTargets=headOrbitalComparisonPacket().items.map(item=>({id:`head-orbital-comparison-${item.conceptId}`,label:`${item.binding!.label} · Globe evidence`}));
const mriContext=await headMriDraftContext(HEAD_LINK_REVISION);

const pageSourcePath=process.env.PAGE_SOURCE ?? new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url);
const source=readFileSync(pageSourcePath,'utf8');
const prepared=source.includes('verifiedHeadCtFacialTeachingRevision');
const facialCalls=['facial:'+HEAD_LINK_REVISION,'facialLearning:'+HEAD_LINK_REVISION,...(prepared?['facialTeaching:'+HEAD_LINK_REVISION,'facialClinical:'+HEAD_LINK_REVISION]:[])];
const require=createRequire(import.meta.url);
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context={packetRevision:'teaching-packet',headRevision:HEAD_LINK_REVISION,checklistVersion:'head-teaching-draft-review-2'};
type ReviewPageProps={
  imageOnlyReview:React.ReactElement<{children:[React.ReactElement<{packet:ReturnType<typeof headImageOnlyComparisonPacket>|null;teachingRevision:string|null;learningRevision:string|null}>,React.ReactElement]}>;
  ctBoneReview:React.ReactElement<{children:readonly React.ReactElement<{packet:ReturnType<typeof headCtBoneComparisonPacket>|null}>[]}>;
  revision:string;
  orbitalReview:React.ReactElement<{packet:ReturnType<typeof headOrbitalComparisonPacket>|null;teachingRevision:string|null;learningRevision:string|null}>;
  additionalTargets:readonly {id:string;label:string}[];
  insulaReview:React.ReactElement<{packet:ReturnType<typeof headInsulaComparisonPacket>|null;teachingRevision:string|null;learningRevision:string|null}>;
  comparisonReview:React.ReactElement<{packet:ReturnType<typeof headMriComparisonPacket>|null;teachingRevision:string|null;learningRevision:string|null;reviewNotes?:React.ReactElement<{context:typeof mriContext}>}>;
  reviewNotes:React.ReactElement<{context:typeof context}>;
};
type Page=()=>Promise<React.ReactElement<ReviewPageProps>>;

test('image-only evidence has independent verified cards and navigator targets',async()=>{
 const valid=await fixture({imageOnly:true}).page();
 const imageOnly=valid.props.imageOnlyReview.props.children[0];
 assert.deepEqual(imageOnly.props.packet,headImageOnlyComparisonPacket());
 assert.equal(imageOnly.props.teachingRevision,HEAD_CEREBELLAR_TEACHING_REVISION);
 assert.equal(imageOnly.props.learningRevision,HEAD_CEREBELLAR_LEARNING_REVISION);
 for(const item of headImageOnlyComparisonPacket().bindings){
  assert(valid.props.additionalTargets.some(target=>target.id==='head-image-only-comparison-'+item.conceptId));
 }
 const absent=await fixture().page();
 const absentImageOnly=absent.props.imageOnlyReview.props.children[0];
 assert.equal(absentImageOnly.props.packet,null);
 assert.equal(absentImageOnly.props.teachingRevision,null);
 assert.equal(absentImageOnly.props.learningRevision,null);
 assert(!absent.props.additionalTargets.some(target=>target.id.startsWith('head-image-only-comparison-')));
 assert(absent.props.orbitalReview.props.packet,'independent valid evidence remains available');
});

test('orbital sequence verification is supplied independently and a mismatch withholds its steps',async()=>{
  const valid=await fixture().page();
  assert.equal(valid.props.orbitalReview.props.learningRevision,'orbital-sequence-revision');
  const unavailable=await fixture({orbitalLearning:false}).page();
  assert.equal(unavailable.props.orbitalReview.props.learningRevision,null);
  assert(unavailable.props.orbitalReview.props.packet,'valid comparison evidence remains available');
  assert.equal(unavailable.props.orbitalReview.props.teachingRevision,HEAD_ORBITAL_TEACHING_REVISION);
});

function fixture(options:{authorize?:boolean;teaching?:boolean;comparison?:boolean;mriTeaching?:boolean;mriLearning?:boolean;mriContext?:boolean;insula?:boolean;insulaTeaching?:boolean;insulaLearning?:boolean;orbital?:boolean;orbitalTeaching?:boolean;orbitalLearning?:boolean;ctBone?:boolean;imageOnly?:boolean}={}){
  const calls:string[]=[],packet=headMriComparisonPacket();
  function TeachingReview(){return null;}
  function ComparisonReview(){return null;}
  function ReviewNotes(){return null;}
  function MriReviewNotes(){return null;}
  function InsulaReview(){return null;}
  function OrbitalReview(){return null;}
  const imports:Record<string,unknown>={
    // These MRI/comparison scenarios deliberately leave separate clinical packets unavailable.
    '@/lib/head-deep-grey-clinical':{verifiedDeepGreyClinicalRevision:async()=>null},
    '@/components/HeadDeepGreyClinicalReview':{HeadDeepGreyClinicalReview:()=>null},
    '@/lib/head-lobar-clinical':{verifiedLobarClinicalRevision:async()=>null},
    '@/components/HeadLobarClinicalReview':{HeadLobarClinicalReview:()=>null},
    '@/lib/head-hippocampal-clinical':{verifiedHippocampalClinicalRevision:async()=>null},
    '@/components/HeadHippocampalClinicalReview':{HeadHippocampalClinicalReview:()=>null},
    '@/lib/head-mri-only-clinical':{verifiedMriOnlyClinicalRevision:async()=>null,mriOnlyClinicalContent:{notes:[]}},
    '@/components/HeadMriOnlyClinicalReview':{HeadMriOnlyClinicalReview:()=>null},
    '@/lib/head-anatomy-checks':{verifiedHeadAnatomyCheckRevision:async()=>null},
    '@/components/HeadAnatomyChecksReview':{HeadAnatomyChecksReview:()=>null},
    '@/lib/head-mri-anatomy-checks':{verifiedHeadMriAnatomyCheckRevision:async()=>null,headMriAnatomyCheckContent:{questions:[]}},
    '@/components/HeadMriAnatomyChecksReview':{HeadMriAnatomyChecksReview:()=>null},
    '@/lib/head-cerebellar-clinical':{verifiedCerebellarClinicalRevision:async()=>null},
    '@/components/HeadCerebellarClinicalReview':{HeadCerebellarClinicalReview:()=>null},
    '@/lib/head-cerebellar-learning':{verifiedHeadCerebellarLearningRevision:async(revision:string)=>{
      assert.equal(calls[0],'authorize');return options.imageOnly?verifiedHeadCerebellarLearningRevision(revision):null;}},
    '@/lib/head-cerebellar-teaching':{verifiedHeadCerebellarTeachingRevision:async(revision:string)=>{
      assert.equal(calls[0],'authorize');
      return options.imageOnly?verifiedHeadCerebellarTeachingRevision(revision):null;}},
    '@/lib/head-ct-bone-teaching':{verifiedHeadCtBoneTeachingRevision:async()=>null},
    '@/components/HeadCtFacialComparisonReview':{HeadCtFacialComparisonReview:()=>null},
    '@/lib/head-ct-facial-comparison-review':{verifiedHeadCtFacialComparisonPacket:async(revision:string)=>{calls.push('facial:'+revision);return null;}},
    '@/components/HeadCtFacialLearningReview':{HeadCtFacialLearningReview:()=>null},
    '@/lib/head-ct-facial-learning':{verifiedHeadCtFacialLearningRevision:async(revision:string)=>{calls.push('facialLearning:'+revision);return null;}},
    '@/components/HeadCtFacialTeachingReview':{HeadCtFacialTeachingReview:()=>null},
    '@/lib/head-ct-facial-teaching.ts':{verifiedHeadCtFacialTeachingRevision:async(revision:string)=>{calls.push('facialTeaching:'+revision);return null;}},
    '@/lib/head-ct-facial-clinical.ts':{verifiedHeadCtFacialClinicalRevision:async(revision:string)=>{calls.push('facialClinical:'+revision);return null;}},
    '@/components/HeadImageOnlyComparisonReview':{HeadImageOnlyComparisonReview:()=>null},
    '@/lib/head-image-only-links':{headImageConceptById},
    '@/lib/head-image-only-comparison-review':{verifiedHeadImageOnlyComparisonPacket:async(revision:string)=>{
      calls.push('imageOnly:'+revision);return options.imageOnly?verifiedHeadImageOnlyComparisonPacket(revision):null;}},
    '@/components/HeadCtBoneComparisonReview':{HeadCtBoneComparisonReview:()=>null},
    // Existing MRI/insula/globe scenarios leave this independent packet unavailable.
    '@/lib/head-ct-bone-comparison-review':{verifiedHeadCtBoneComparisonPacket:async(revision:string)=>{
      calls.push('ctBone:'+revision);return options.ctBone?verifiedHeadCtBoneComparisonPacket(revision):null;}},
    '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls.push('authorize');if(options.authorize===false)throw Error('private denial marker');}},
    '@/lib/head-atlas-import':{HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION},
    '@/lib/head-teaching-review-contract':{headTeachingDraftContext:async(revision:string)=>{
      calls.push('teaching:'+revision);if(options.teaching===false)throw Error('private teaching marker');return context;}},
    '@/lib/head-mri-comparison-review':{verifiedHeadMriComparisonPacket:async(revision:string)=>{
      calls.push('comparison:'+revision);return options.comparison===false?null:packet;}},
    '@/lib/head-mri-only-teaching':{verifiedHeadMriOnlyTeachingRevision:async(revision:string)=>{
      calls.push('mriTeaching:'+revision);return options.mriTeaching===false?null:HEAD_MRI_ONLY_TEACHING_REVISION;}},
    '@/lib/head-mri-learning':{verifiedHeadMriLearningRevision:async(revision:string)=>{
      calls.push('mriLearning:'+revision);return options.mriLearning===false?null:HEAD_MRI_LEARNING_REVISION;}},
    '@/components/HeadAtlasTeachingReview':{HeadAtlasTeachingReview:TeachingReview},
    '@/components/HeadMriComparisonReview':{HeadMriComparisonReview:ComparisonReview},
    '@/components/HeadTeachingReviewNotes':{HeadTeachingReviewNotes:ReviewNotes},
    '@/components/HeadMriReviewNotes':{HeadMriReviewNotes:MriReviewNotes},
    '@/components/HeadInsulaComparisonReview':{HeadInsulaComparisonReview:InsulaReview},
    '@/lib/head-insula-comparison-review':{verifiedHeadInsulaComparisonPacket:async(revision:string)=>{
      calls.push('insula:'+revision);return options.insula===false?null:headInsulaComparisonPacket();}},
    '@/lib/head-insula-teaching':{verifiedHeadInsulaTeachingRevision:async(revision:string)=>{
      calls.push('insulaTeaching:'+revision);return options.insulaTeaching===false?null:HEAD_INSULA_TEACHING_REVISION;}},
    '@/lib/head-insula-learning':{verifiedHeadInsulaLearningRevision:async(revision:string)=>{
      calls.push('insulaLearning:'+revision);return options.insulaLearning===false?null:HEAD_INSULA_LEARNING_REVISION;}},
    '@/lib/head-mri-review-draft-contract':{headMriDraftContext:async(revision:string)=>{
      calls.push('mriContext:'+revision);
      if(options.mriContext===false||options.comparison===false||options.mriTeaching===false||options.mriLearning===false)throw Error('private MRI context marker');
      return mriContext;
    }},
    '@/components/HeadOrbitalComparisonReview':{HeadOrbitalComparisonReview:OrbitalReview},
    '@/lib/head-orbital-comparison-review':{verifiedHeadOrbitalComparisonPacket:async(revision:string)=>{calls.push('orbital:'+revision);return options.orbital===false?null:headOrbitalComparisonPacket();}},
    '@/lib/head-orbital-teaching':{verifiedHeadOrbitalTeachingRevision:async(revision:string)=>{calls.push('orbitalTeaching:'+revision);return options.orbitalTeaching===false?null:HEAD_ORBITAL_TEACHING_REVISION;}},
    '@/lib/head-orbital-learning':{verifiedHeadOrbitalLearningRevision:async(revision:string)=>{calls.push('orbitalLearning:'+revision);return options.orbitalLearning===false?null:'orbital-sequence-revision';}},
    'react/jsx-runtime':require('react/jsx-runtime'),
  };
  const mod={exports:{} as {default:Page;dynamic:string;metadata:{robots:{index:boolean;follow:boolean}}}};
  new Function('require','module','exports',compiled)((name:string)=>{assert(Object.hasOwn(imports,name),name);return imports[name];},mod,mod.exports);
  return {page:mod.exports.default,calls,packet,types:{TeachingReview,ComparisonReview,ReviewNotes,MriReviewNotes,InsulaReview},meta:mod.exports};
}
test('authorization precedes every packet getter and denial reveals no review material',async()=>{
  const f=fixture({authorize:false});
  const result=await f.page();
  assert.deepEqual(f.calls,['authorize']);
  const html=renderToStaticMarkup(result);
  assert.match(html,/authorized administrator account/);
  assert.doesNotMatch(html,/private denial marker|MRI-only|teaching-packet|Inspect MRI/);
  assert.equal(f.meta.dynamic,'force-dynamic');
  assert.deepEqual(f.meta.metadata.robots,{index:false,follow:false});
});

test('CT-only evidence adds six exact picker targets without changing original notes; stale evidence adds none',async()=>{
  const valid=await fixture({ctBone:true}).page();
  assert.deepEqual(valid.props.ctBoneReview.props.children[0].props.packet,headCtBoneComparisonPacket());
  assert.equal(valid.props.additionalTargets.length,14);
  assert.equal(new Set(valid.props.additionalTargets.map(item=>item.id)).size,14);
  assert.deepEqual(valid.props.additionalTargets.slice(-6),headCtBoneComparisonPacket().items.map(item=>({id:'head-ct-bone-comparison-'+item.conceptId,label:item.binding!.label+' · CT-only bone evidence'})));
  assert.equal(valid.props.reviewNotes.props.context,context);
  assert.equal(valid.props.comparisonReview.props.reviewNotes?.props.context,mriContext);
  const stale=await fixture({ctBone:false}).page();assert.equal(stale.props.ctBoneReview.props.children[0].props.packet,null);
  assert(!stale.props.additionalTargets.some(item=>item.id.startsWith('head-ct-bone-')));
  const denied=fixture({ctBone:true,authorize:false});await denied.page();assert.deepEqual(denied.calls,['authorize']);
});

test('teaching-context failure prevents comparison verification and emits only a generic alert',async()=>{
  const f=fixture({teaching:false});
  const result=await f.page();
  assert.deepEqual(f.calls,['authorize','teaching:'+HEAD_LINK_REVISION]);
  const html=renderToStaticMarkup(result);
  assert.match(html,/head source or teaching packet changed/);
  assert.doesNotMatch(html,/private teaching marker|MRI-only comparisons|comparison packet|Inspect MRI/);
});

test('authorized page verifies exact manifest and passes an independent comparison before teaching notes',async()=>{
  const f=fixture(),result=await f.page();
  assert.deepEqual(f.calls,['authorize',...Array(3).fill('teaching:'+HEAD_LINK_REVISION),'comparison:'+HEAD_LINK_REVISION,'mriTeaching:'+HEAD_LINK_REVISION,'mriLearning:'+HEAD_LINK_REVISION,'mriContext:'+HEAD_LINK_REVISION,'insula:'+HEAD_LINK_REVISION,'insulaTeaching:'+HEAD_LINK_REVISION,'insulaLearning:'+HEAD_LINK_REVISION,'orbital:'+HEAD_LINK_REVISION,'orbitalTeaching:'+HEAD_LINK_REVISION,'orbitalLearning:'+HEAD_LINK_REVISION,'ctBone:'+HEAD_LINK_REVISION,...facialCalls,'imageOnly:'+HEAD_LINK_REVISION]);
  assert.equal(result.type,f.types.TeachingReview);
  assert.equal(result.props.revision,HEAD_LINK_REVISION);
  assert.deepEqual(result.props.additionalTargets,[
    ...f.packet.items.map(item=>({id:`head-mri-comparison-${item.conceptId}`,label:`${item.binding!.label} · MRI-only evidence`})),
    ...headInsulaComparisonPacket().items.map(item=>({id:`head-insula-comparison-${item.conceptId}`,label:`${item.binding!.label} · Insula evidence`})),
    ...orbitalTargets,
  ]);
  assert.equal(result.props.additionalTargets.length,8);
  assert.equal(new Set(result.props.additionalTargets.map(target=>target.id)).size,8);
  const comparison=result.props.comparisonReview;
  const notes=result.props.reviewNotes;
  assert.equal(comparison.type,f.types.ComparisonReview);
  assert.equal(comparison.props.packet,f.packet);
  assert.equal(comparison.props.teachingRevision,HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(comparison.props.learningRevision,HEAD_MRI_LEARNING_REVISION);
  assert.equal(notes.type,f.types.ReviewNotes);
  assert.equal(notes.props.context,context);
  assert.equal(notes.key,context.packetRevision+context.headRevision+context.checklistVersion);
  assert.equal(comparison.props.reviewNotes?.type,f.types.MriReviewNotes);
  assert.equal(comparison.props.reviewNotes?.props.context,mriContext);
  assert.equal(comparison.props.reviewNotes?.key,JSON.stringify(mriContext));
  assert(source.indexOf('comparisonReview={<HeadMriComparisonReview')<source.indexOf('reviewNotes={<HeadTeachingReviewNotes'));
});

test('independent comparison verification failure leaves authorized teaching review available',async()=>{
  const f=fixture({comparison:false}),result=await f.page();
  assert.deepEqual(f.calls,['authorize',...Array(3).fill('teaching:'+HEAD_LINK_REVISION),'comparison:'+HEAD_LINK_REVISION,'mriTeaching:'+HEAD_LINK_REVISION,'mriLearning:'+HEAD_LINK_REVISION,'mriContext:'+HEAD_LINK_REVISION,'insula:'+HEAD_LINK_REVISION,'insulaTeaching:'+HEAD_LINK_REVISION,'insulaLearning:'+HEAD_LINK_REVISION,'orbital:'+HEAD_LINK_REVISION,'orbitalTeaching:'+HEAD_LINK_REVISION,'orbitalLearning:'+HEAD_LINK_REVISION,'ctBone:'+HEAD_LINK_REVISION,...facialCalls,'imageOnly:'+HEAD_LINK_REVISION]);
  assert.equal(result.props.comparisonReview.props.reviewNotes,undefined);
  assert.equal(result.type,f.types.TeachingReview);
  assert.equal(result.props.revision,HEAD_LINK_REVISION);
  assert.equal(result.props.comparisonReview.props.packet,null);
  assert.deepEqual(result.props.additionalTargets,[...headInsulaComparisonPacket().items.map(item=>({id:`head-insula-comparison-${item.conceptId}`,label:`${item.binding!.label} · Insula evidence`})),...orbitalTargets]);
  assert.equal(result.props.reviewNotes.props.context,context);
  assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(|postMessage|dangerouslySetInnerHTML/);
});

test('unavailable MRI-only teaching leaves independent comparison and existing teaching available',async()=>{
  const f=fixture({mriTeaching:false}),result=await f.page();
  assert.deepEqual(f.calls,['authorize',...Array(3).fill('teaching:'+HEAD_LINK_REVISION),'comparison:'+HEAD_LINK_REVISION,'mriTeaching:'+HEAD_LINK_REVISION,'mriLearning:'+HEAD_LINK_REVISION,'mriContext:'+HEAD_LINK_REVISION,'insula:'+HEAD_LINK_REVISION,'insulaTeaching:'+HEAD_LINK_REVISION,'insulaLearning:'+HEAD_LINK_REVISION,'orbital:'+HEAD_LINK_REVISION,'orbitalTeaching:'+HEAD_LINK_REVISION,'orbitalLearning:'+HEAD_LINK_REVISION,'ctBone:'+HEAD_LINK_REVISION,...facialCalls,'imageOnly:'+HEAD_LINK_REVISION]);
  assert.equal(result.props.comparisonReview.props.reviewNotes,undefined);
  assert.equal(result.type,f.types.TeachingReview);
  assert.equal(result.props.comparisonReview.props.packet,f.packet);
  assert.equal(result.props.comparisonReview.props.teachingRevision,null);
  assert.equal(result.props.reviewNotes.props.context,context);
});

test('unavailable MRI-only learning leaves comparison, teaching and original review available',async()=>{
  const f=fixture({mriLearning:false}),result=await f.page();
  assert.deepEqual(f.calls,['authorize',...Array(3).fill('teaching:'+HEAD_LINK_REVISION),'comparison:'+HEAD_LINK_REVISION,'mriTeaching:'+HEAD_LINK_REVISION,'mriLearning:'+HEAD_LINK_REVISION,'mriContext:'+HEAD_LINK_REVISION,'insula:'+HEAD_LINK_REVISION,'insulaTeaching:'+HEAD_LINK_REVISION,'insulaLearning:'+HEAD_LINK_REVISION,'orbital:'+HEAD_LINK_REVISION,'orbitalTeaching:'+HEAD_LINK_REVISION,'orbitalLearning:'+HEAD_LINK_REVISION,'ctBone:'+HEAD_LINK_REVISION,...facialCalls,'imageOnly:'+HEAD_LINK_REVISION]);
  assert.equal(result.props.comparisonReview.props.reviewNotes,undefined);
  assert.equal(result.type,f.types.TeachingReview);
  assert.equal(result.props.comparisonReview.props.packet,f.packet);
  assert.equal(result.props.comparisonReview.props.teachingRevision,HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(result.props.comparisonReview.props.learningRevision,null);
  assert.equal(result.props.reviewNotes.props.context,context);
});

test('unavailable MRI correction context leaves verified evidence and original notes intact',async()=>{
  const f=fixture({mriContext:false}),result=await f.page();
  assert.equal(result.props.comparisonReview.props.packet,f.packet);
  assert.equal(result.props.comparisonReview.props.teachingRevision,HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(result.props.comparisonReview.props.learningRevision,HEAD_MRI_LEARNING_REVISION);
  assert.equal(result.props.comparisonReview.props.reviewNotes,undefined);
  assert.equal(result.props.reviewNotes.props.context,context);
});

test('insula evidence is independently verified after authorization without changing existing review contexts',async()=>{
  const f=fixture(),result=await f.page();
  assert.equal(result.props.insulaReview.type,f.types.InsulaReview);
  assert.deepEqual(result.props.insulaReview.props.packet,headInsulaComparisonPacket());
  assert.equal(result.props.insulaReview.props.teachingRevision,HEAD_INSULA_TEACHING_REVISION);
  assert.equal(result.props.insulaReview.props.learningRevision,HEAD_INSULA_LEARNING_REVISION);
  assert.equal(result.props.reviewNotes.props.context,context);
  assert.equal(result.props.comparisonReview.props.reviewNotes?.props.context,mriContext);
  const failed=await fixture({insula:false}).page();
  assert.equal(failed.props.insulaReview.props.packet,null);
  assert.deepEqual(failed.props.additionalTargets,[...headMriComparisonPacket().items.map(item=>({id:`head-mri-comparison-${item.conceptId}`,label:`${item.binding!.label} · MRI-only evidence`})),...orbitalTargets]);
  assert.equal(failed.props.reviewNotes.props.context,context);
  assert.equal(failed.props.comparisonReview.props.reviewNotes?.props.context,mriContext);
  const teachingFailed=await fixture({insulaTeaching:false}).page();
  assert.deepEqual(teachingFailed.props.insulaReview.props.packet,headInsulaComparisonPacket());
  assert.equal(teachingFailed.props.insulaReview.props.teachingRevision,null);
  assert.equal(teachingFailed.props.reviewNotes.props.context,context);
  assert.equal(teachingFailed.props.comparisonReview.props.reviewNotes?.props.context,mriContext);
  assert(source.indexOf('await verifiedHeadInsulaComparisonPacket')<source.indexOf('await verifiedHeadInsulaTeachingRevision'));
  assert(source.indexOf('await verifiedHeadInsulaTeachingRevision')<source.indexOf('await verifiedHeadInsulaLearningRevision'));
  const learningFailed=await fixture({insulaLearning:false}).page();
  assert.equal(learningFailed.props.insulaReview.props.learningRevision,null);
  assert.deepEqual(learningFailed.props.insulaReview.props.packet,headInsulaComparisonPacket());
  assert.equal(learningFailed.props.insulaReview.props.teachingRevision,HEAD_INSULA_TEACHING_REVISION);
  assert.equal(learningFailed.props.reviewNotes.props.context,context);
});

test('all stale comparison packets withhold their picker entries while original teaching remains',async()=>{
  const f=fixture({comparison:false,insula:false,orbital:false}),result=await f.page();
  assert.equal(result.type,f.types.TeachingReview);
  assert.equal(result.props.revision,HEAD_LINK_REVISION);
  assert.deepEqual(result.props.additionalTargets,[]);
  assert.equal(result.props.reviewNotes.props.context,context);
  assert.equal(result.props.comparisonReview.props.packet,null);
  assert.equal(result.props.insulaReview.props.packet,null);
});

test('orbital comparisons independently fail closed without changing previous review contexts',async()=>{
  const good=await fixture().page();
  assert.deepEqual(good.props.orbitalReview.props.packet,headOrbitalComparisonPacket());
  const failed=await fixture({orbital:false}).page();
  assert.equal(failed.props.orbitalReview.props.packet,null);
  assert(!failed.props.additionalTargets.some(x=>x.id.startsWith('head-orbital-')));
  assert.equal(failed.props.additionalTargets.length,6);
  assert.equal(failed.props.reviewNotes.props.context,context);
  assert.equal(failed.props.comparisonReview.props.reviewNotes?.props.context,mriContext);
  assert.deepEqual(failed.props.insulaReview.props.packet,headInsulaComparisonPacket());
});

test('globe teaching has its own verified revision and failure leaves comparison and previous notes intact',async()=>{
  const good=await fixture().page();assert.equal(good.props.orbitalReview.props.teachingRevision,HEAD_ORBITAL_TEACHING_REVISION);
  const failed=await fixture({orbitalTeaching:false}).page();
  assert.equal(failed.props.orbitalReview.props.teachingRevision,null);
  assert.deepEqual(failed.props.orbitalReview.props.packet,headOrbitalComparisonPacket());
  assert.equal(failed.props.reviewNotes.props.context,context);
  assert.equal(failed.props.comparisonReview.props.reviewNotes?.props.context,mriContext);
});

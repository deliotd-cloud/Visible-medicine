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

import {headLearningSequences,HEAD_LEARNING_REVISION} from '../lib/head-atlas-learning.ts';
import {headMriLearningSequences} from '../lib/head-mri-learning.ts';
import {headInsulaLearningSequences} from '../lib/head-insula-learning.ts';
import {headOrbitalLearningSequences,HEAD_ORBITAL_LEARNING_REVISION} from '../lib/head-orbital-learning.ts';
import {headCtBoneLearningSequences,HEAD_CT_BONE_LEARNING_REVISION} from '../lib/head-ct-bone-learning.ts';
import {headCerebellarLearningSequences} from '../lib/head-cerebellar-learning.ts';
function fixture(options:{authorize?:boolean;teaching?:boolean;comparison?:boolean;mriTeaching?:boolean;mriLearning?:boolean;mriContext?:boolean;insula?:boolean;insulaTeaching?:boolean;insulaLearning?:boolean;orbital?:boolean;orbitalTeaching?:boolean;orbitalLearning?:boolean;ctBone?:boolean;imageOnly?:boolean;ctBoneLearning?:boolean}={}){
  const calls:string[]=[],packet=headMriComparisonPacket();
  function TeachingReview(){return null;}
  function ComparisonReview(){return null;}
  function ReviewNotes(){return null;}
  function MriReviewNotes(){return null;}
  function InsulaReview(){return null;}
  function OrbitalReview(){return null;}
  const imports:Record<string,unknown>={
    '@/lib/head-atlas-learning':{headLearningSequences,HEAD_LEARNING_REVISION},
    '@/lib/head-ct-bone-learning':{headCtBoneLearningSequences,verifiedHeadCtBoneLearningRevision:async(revision:string)=>{calls.push('ctBoneLearning:'+revision);assert.equal(calls[0],'authorize');return options.ctBoneLearning===false?null:HEAD_CT_BONE_LEARNING_REVISION;}},

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
    '@/lib/head-cerebellar-learning':{headCerebellarLearningSequences,verifiedHeadCerebellarLearningRevision:async(revision:string)=>{
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
    '@/lib/head-mri-learning':{headMriLearningSequences,verifiedHeadMriLearningRevision:async(revision:string)=>{
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
    '@/lib/head-insula-learning':{headInsulaLearningSequences,verifiedHeadInsulaLearningRevision:async(revision:string)=>{
      calls.push('insulaLearning:'+revision);return options.insulaLearning===false?null:HEAD_INSULA_LEARNING_REVISION;}},
    '@/lib/head-mri-review-draft-contract':{headMriDraftContext:async(revision:string)=>{
      calls.push('mriContext:'+revision);
      if(options.mriContext===false||options.comparison===false||options.mriTeaching===false||options.mriLearning===false)throw Error('private MRI context marker');
      return mriContext;
    }},
    '@/components/HeadOrbitalComparisonReview':{HeadOrbitalComparisonReview:OrbitalReview},
    '@/lib/head-orbital-comparison-review':{verifiedHeadOrbitalComparisonPacket:async(revision:string)=>{calls.push('orbital:'+revision);return options.orbital===false?null:headOrbitalComparisonPacket();}},
    '@/lib/head-orbital-teaching':{verifiedHeadOrbitalTeachingRevision:async(revision:string)=>{calls.push('orbitalTeaching:'+revision);return options.orbitalTeaching===false?null:HEAD_ORBITAL_TEACHING_REVISION;}},
    '@/lib/head-orbital-learning':{headOrbitalLearningSequences,verifiedHeadOrbitalLearningRevision:async(revision:string)=>{calls.push('orbitalLearning:'+revision);return options.orbitalLearning===false?null:HEAD_ORBITAL_LEARNING_REVISION;}},
    'react/jsx-runtime':require('react/jsx-runtime'),
  };
  const mod={exports:{} as {default:Page;dynamic:string;metadata:{robots:{index:boolean;follow:boolean}}}};
  new Function('require','module','exports',compiled)((name:string)=>{assert(Object.hasOwn(imports,name),name);return imports[name];},mod,mod.exports);
  return {page:mod.exports.default,calls,packet,types:{TeachingReview,ComparisonReview,ReviewNotes,MriReviewNotes,InsulaReview},meta:mod.exports};
}
type Options=NonNullable<Parameters<typeof fixture>[0]>;
const targets=(sequences:readonly {id:string;label:string}[],revision:string)=>sequences.map(sequence=>({id:'head-guided-sequence-'+sequence.id,label:`Guided · ${sequence.label} · Draft · ${revision.slice(0,12)}`}));
function expected(o:Options){
 return [
  ...targets(headLearningSequences,HEAD_LEARNING_REVISION),
  ...(o.comparison!==false&&o.mriLearning!==false?targets(headMriLearningSequences,HEAD_MRI_LEARNING_REVISION):[]),
  ...(o.insula!==false&&o.insulaLearning!==false?targets(headInsulaLearningSequences,HEAD_INSULA_LEARNING_REVISION):[]),
  ...(o.orbital!==false&&o.orbitalLearning!==false?targets(headOrbitalLearningSequences,HEAD_ORBITAL_LEARNING_REVISION):[]),
  ...(o.ctBone&&o.ctBoneLearning!==false?targets(headCtBoneLearningSequences,HEAD_CT_BONE_LEARNING_REVISION):[]),
  ...(o.imageOnly?targets(headCerebellarLearningSequences,HEAD_CEREBELLAR_LEARNING_REVISION):[]),
  ...(o.comparison!==false?headMriComparisonPacket().items.map(item=>({id:'head-mri-comparison-'+item.conceptId,label:item.binding!.label+' · MRI-only evidence'})):[]),
  ...(o.insula!==false?headInsulaComparisonPacket().items.map(item=>({id:'head-insula-comparison-'+item.conceptId,label:item.binding!.label+' · Insula evidence'})):[]),
  ...(o.orbital!==false?orbitalTargets:[]),
  ...(o.ctBone?headCtBoneComparisonPacket().items.map(item=>({id:'head-ct-bone-comparison-'+item.conceptId,label:item.binding!.label+' · CT-only bone evidence'})):[]),
  ...(o.imageOnly?headImageOnlyComparisonPacket().bindings.map(item=>({id:'head-image-only-comparison-'+item.conceptId,label:headImageConceptById(item.conceptId)!.label+' · CT/MRI-only evidence'})):[]),
 ];
}
for(const [name,options]of [
 ['all default verified packets',{}],
 ['all independent groups',{ctBone:true,imageOnly:true}],
 ['MRI comparison missing',{comparison:false}],
 ['MRI learning missing',{mriLearning:false}],
 ['insula comparison missing',{insula:false}],
 ['insula learning missing',{insulaLearning:false}],
 ['orbital comparison missing',{orbital:false}],
 ['orbital learning missing',{orbitalLearning:false}],
 ['CT bone learning missing',{ctBone:true,ctBoneLearning:false}],
 ['all extension comparisons missing',{comparison:false,insula:false,orbital:false}],
 ['MRI teaching missing but independently valid sequences retained',{mriTeaching:false}],
] as const)test('current page: '+name,async()=>{
 const f=fixture(options),result=await f.page();
 assert.deepEqual(result.props.additionalTargets,expected(options),'Whole current navigator, not filtered compatibility targets');
 assert.equal(new Set(result.props.additionalTargets.map(row=>row.id)).size,result.props.additionalTargets.length);
 assert.equal(f.calls[0],'authorize');
 assert.equal(result.props.reviewNotes.props.context,context);
 if(options.ctBone)assert(f.calls.includes('ctBoneLearning:'+HEAD_LINK_REVISION));
 else assert(!f.calls.some(call=>call.startsWith('ctBoneLearning:')));
});
for(const options of [{authorize:false},{teaching:false}])test('current page: denial or stale base source exposes no targets',async()=>{
 const f=fixture(options),result=await f.page(),html=renderToStaticMarkup(result);
 assert(!html.includes('head-guided-sequence-'));assert(!html.includes('private denial marker'));assert(!html.includes('private teaching marker'));
 assert.deepEqual(f.calls,options.authorize===false?['authorize']:['authorize','teaching:'+HEAD_LINK_REVISION]);
});

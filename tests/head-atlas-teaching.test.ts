import assert from 'node:assert/strict';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import * as teaching from '../lib/head-atlas-teaching.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as comparison from '../lib/head-mri-comparison-review.ts';
import * as mriTeaching from '../lib/head-mri-only-teaching.ts';
import * as mriLearning from '../lib/head-mri-learning.ts';
import * as insulaComparison from '../lib/head-insula-comparison-review.ts';
import * as insulaTeaching from '../lib/head-insula-teaching.ts';
import * as insulaLearning from '../lib/head-insula-learning.ts';
import {headTeachingDraftContext} from '../lib/head-teaching-review-contract.ts';
import {headMriDraftContext} from '../lib/head-mri-review-draft-contract.ts';
import {HEAD_LINK_REVISION,headConceptFromAtlasQuery} from '../lib/head-atlas-links.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
function component(file:string){
  const source=readFileSync(new URL('../components/'+file+'.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as Record<string,React.ComponentType<any>>};
  new Function('require','module','exports',compiled)((id:string)=>id==='./HeadReviewImageLink'?headReviewImageLinkModule:id==='../lib/head-atlas-teaching'?teaching:id==='../lib/head-mri-only-teaching'?mriTeaching:id==='../lib/head-insula-teaching'?insulaTeaching:id==='../lib/head-atlas-learning'?learning:id==='../lib/head-mri-learning'?mriLearning:id==='../lib/head-mri-comparison-review'?comparison:id==='./HeadAtlasTeaching'?{HeadAtlasTeaching:Summary}:id==='./HeadTeachingReviewNavigator'?{HeadTeachingReviewNavigator:Navigator}:id.endsWith('.css')?{}:id==='../lib/head-orbital-teaching'?require('../lib/head-orbital-teaching.ts'):id==='../lib/head-ct-bone-teaching'?require('../lib/head-ct-bone-teaching.ts'):id==='../lib/head-cerebellar-teaching'?require('../lib/head-cerebellar-teaching.ts'):id==='./HeadAnatomyCheck'?headAnatomyCheckModule:require(id),mod,mod.exports);
  return mod.exports[file];
}
const Summary=component('HeadAtlasTeaching'),Navigator=component('HeadTeachingReviewNavigator'),Review=component('HeadAtlasTeachingReview'),Comparison=component('HeadMriComparisonReview');
const render=(conceptId:string,modality:'CT'|'MRI',revision=HEAD_LINK_REVISION)=>renderToStaticMarkup(React.createElement(Summary,{conceptId,modality,revision}));

test('MRI-only notes use their separate revision and never extend the original twenty-five-note packet',()=>{
  assert.equal(teaching.headTeachingPacket().content.notes.length,25);
  assert.equal(teaching.HEAD_TEACHING_REVISION,'2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a');
  for(const note of mriTeaching.headMriOnlyTeachingContent.notes){
    const html=render(note.conceptId,'MRI');
    assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));assert(html.includes(note.imaging.text));
    assert(html.includes(mriTeaching.HEAD_MRI_ONLY_TEACHING_REVISION));
    assert(!html.includes(teaching.HEAD_TEACHING_REVISION));
    assert.equal(render(note.conceptId,'CT'),'');assert.equal(render(note.conceptId,'MRI','stale'),'');
  }
});

test('exact packet hash includes references, source bindings and unchanged draft status',()=>{
  const packet=teaching.headTeachingPacket();
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),teaching.HEAD_TEACHING_REVISION);
  assert.equal(packet.content.headRevision,HEAD_LINK_REVISION);assert.equal(packet.content.status,'draft');assert.equal(packet.content.reviewedAt,null);
  assert.equal(packet.content.schema,'vm-head-teaching-3');assert.equal(packet.content.notes.length,25);assert.equal(new Set(packet.content.notes.map(note=>note.conceptId)).size,25);
  assert.notEqual(teaching.HEAD_TEACHING_REVISION,'0111a33ca404e5032a67c609545bad7107a708209d880f113b69e0454e2586f2');
  for(const binding of packet.bindings){assert(binding);assert.equal(binding.headRevision,HEAD_LINK_REVISION);assert.equal(headConceptFromAtlasQuery(new URL(binding.atlasHref,'https://example.invalid').searchParams)?.conceptId,binding.conceptId);assert.match(binding.scopeNote,/unregistered/);if(binding.conceptId.startsWith('brainstem-'))assert.match(binding.scopeNote,/regional portion only/);}
  const changed=JSON.parse(JSON.stringify(packet));changed.content.notes[0].task+=' amended';
  assert.notEqual(createHash('sha256').update(JSON.stringify(changed)).digest('hex'),teaching.HEAD_TEACHING_REVISION);
});

test('each factual claim has a declared reference with no imported restricted assets',()=>{
  const {sources,notes,groups}=teaching.headTeachingContent,ids=new Set<string>(sources.map(source=>source.id));
  for(const note of notes)for(const claim of [note.anatomy,note.function]){
    assert(claim.sources.length);for(const id of claim.sources)assert(ids.has(id));
  }
  for(const group of Object.values(groups))for(const imaging of Object.values(group.imaging))for(const id of imaging.sources)assert(ids.has(id));
  for(const source of sources){assert.equal(new URL(source.url).protocol,'https:');assert.match(source.reuse,/no text or images imported|no figures, images or patient data imported/);assert.equal(source.accessed,'2026-10-08');}
});

test('only twenty-five exact concepts and source revision expose the correct family notes for CT and MRI',()=>{
  for(const {conceptId:id,group} of teaching.headTeachingContent.notes)for(const modality of ['CT','MRI'] as const){
    const value=teaching.headTeachingForConcept(id,modality);assert(value);assert.equal(value.concept.conceptId,id);
    const html=render(id,modality);assert.match(html,/Learn this anatomy · Draft/);assert.match(html,/<details class="head-teaching">/);assert(!html.includes('<details open'));
    for(const title of ['Anatomy &amp; relationships','Function',modality+' · reading the image','Try this','References &amp; review revision'])assert(html.includes(title),title);
    assert(html.includes(teaching.HEAD_TEACHING_REVISION));assert.match(html,/not clinically signed off/);assert.match(html,/unregistered subjects/);
    assert.equal(html.includes('regional portions only'),group==='brainstem');
    assert.equal(html.includes('static masks represent CSF spaces'),group==='ventricles');
    assert.equal(html.includes('Skull-base beam hardening'),group==='brainstem'&&modality==='CT');
    assert.equal(html.includes('Fast FLAIR'),group==='ventricles'&&modality==='MRI');
    if(!['cerebral','hippocampus'].includes(group))assert.equal(html.includes('Check the actual sequence'),modality==='MRI');
    for(const revision of ['',HEAD_LINK_REVISION+'0','stale'])assert.equal(render(id,modality,revision),'');
  }
  for(const id of ['deep-left-hippocampus','cortex-middle-frontal-lobe','cortex-left-frontal-extra','limbic-middle-hippocampus','deep-left-thalamus-extra','brainstem','Midbrain','ventricle-aqueduct','<script>'])assert.equal(render(id,'CT'),'');
  assert.equal(teaching.headTeachingForConcept('brainstem-pons','US' as 'CT'),null);
});

test('new cerebral families expose regional scope and separate CT and MRI reading guidance',()=>{
  const notes=teaching.headTeachingContent.notes.slice(15);
  assert.equal(notes.length,10);
  for(const note of notes){
    const family=note.conceptId.startsWith('cortex-')?'cerebral':'hippocampus';
    assert.equal(note.group,family);
    const ct=teaching.headTeachingForConcept(note.conceptId,'CT');
    const mri=teaching.headTeachingForConcept(note.conceptId,'MRI');
    assert(ct&&mri);
    assert.match(ct.scope,/regional|saved (?:hippocampal )?extent|mask/i);
    assert.match(ct.scope,/unregistered/);
    assert.match(mri.scope,/unregistered/);
    assert.notEqual(ct.imaging.text,mri.imaging.text);
    assert.match(ct.imaging.text,/CT/);
    assert.match(mri.imaging.text,/MRI|sequence/);
  }
});

test('paired deep-grey notes preserve exact side, broad-function limits and family-specific references',()=>{
  const notes=teaching.headTeachingContent.notes.filter(note=>note.group==='deepGrey');assert.equal(notes.length,8);
  for(const side of ['left','right'])for(const name of ['caudate','putamen','globus-pallidus','thalamus']){
    const id=`deep-${side}-${name}`,value=teaching.headTeachingForConcept(id,'MRI');assert(value);
    assert.match(value.note.task,new RegExp(`patient’s ${side} side`));assert.match(value.note.task,/native orientation markers/);
    assert.equal(headConceptFromAtlasQuery(new URL(value.concept.atlasHref,'https://example.invalid').searchParams)?.conceptId,id);
    assert.match(value.scope,/individual thalamic nuclei, pallidal segments or white-matter pathways/);
    assert.match(value.scope,/do not measure function/);assert.match(value.scope,/semantic, not patient-space synchronization/);
    assert(!value.sources.some(source=>source.id==='bakshi-2000'));
    assert(!value.imaging.text.includes('Fast FLAIR'));assert(!teaching.headTeachingForConcept(id,'CT')?.imaging.text.includes('Skull-base beam hardening'));
  }
  assert.equal(new Set(notes.map(note=>note.conceptId)).size,8);
});

test('paired ventricular exercises use patient orientation and static spaces never imply measured flow',()=>{
  const left=teaching.headTeachingForConcept('ventricle-left-lateral','CT'),right=teaching.headTeachingForConcept('ventricle-right-lateral','MRI');assert(left);assert(right);
  assert.match(left.note.task,/orientation markers/);assert.match(right.note.task,/orientation markers/);
  assert.match(left.note.task,/screen-left is not a reliable substitute/);assert.match(right.note.task,/another subject/);
  for(const {conceptId,group} of teaching.headTeachingContent.notes)if(group==='ventricles'){
    const note=teaching.headTeachingForConcept(conceptId,'MRI');assert(note);assert.match(note.scope,/not measured CSF flow, pressure or pathway patency/);
    assert(!note.scope.includes('nuclei'));assert(note.sources.some(source=>source.id==='ut-ventricles'));assert(note.sources.some(source=>source.id==='bakshi-2000'));
  }
  assert(!teaching.headTeachingForConcept('brainstem-pons','MRI')?.sources.some(source=>source.id==='bakshi-2000'));
});

test('review packet is complete, read-only and guarded before clinical content rendering',()=>{
  const html=renderToStaticMarkup(React.createElement(Review,{revision:HEAD_LINK_REVISION}));
  for(const note of teaching.headTeachingContent.notes){assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));assert(html.includes(note.task));}
  for(const source of teaching.headTeachingContent.sources){assert(html.includes(source.url));assert(html.includes(source.reuse));}
  assert(html.includes(teaching.HEAD_TEACHING_REVISION));assert(html.includes(HEAD_LINK_REVISION));assert(html.includes('read-only'));assert(html.includes('no recorded sign-off'));
  assert(html.includes(learning.HEAD_LEARNING_REVISION));assert(html.includes('Guided sequence draft review'));assert(html.includes('does not record a sequence decision'));
  for(const sequence of learning.headLearningSequences)assert(html.includes(`${sequence.label} · ${sequence.concepts.length} steps`));
  assert.match(html,/<form\b/);assert.match(html,/name="head-review-target"/);assert.match(html,/Open summary/);
  assert(!/<input|<iframe|<img/.test(html));
  const page=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  assert(page.indexOf('await authorizeClinicalReview()')<page.indexOf('return <HeadAtlasTeachingReview'));
  assert.match(page,/catch\{return <p role="alert">/);assert.match(page,/force-dynamic/);assert.match(page,/index:false,follow:false/);
  assert(page.includes('revision={HEAD_MANIFEST_SHA256}'));
  const stale=renderToStaticMarkup(React.createElement(Review,{revision:'stale'}));assert.match(stale,/current head source does not match/);assert(!stale.includes('Inspect CT target'));assert(!stale.includes(teaching.headTeachingContent.notes[0].anatomy.text));
  const hub=readFileSync(new URL('../app/workspace/atlas-review/source-comparisons/page.tsx',import.meta.url),'utf8');assert(hub.includes('/workspace/atlas-review/head-learning'));
});

test('learning content remains outside active practice; both native integrations pass pinned revision',()=>{
  const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8'),guided=readFileSync(new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
  assert(viewer.includes("rightPanel==='practice'||quizActive?<HeadAtlasPractice"));assert(viewer.includes("/>:rightPanel==='guided'?<HeadAtlasGuidedLearning"));
  for(const text of [viewer,guided])assert(text.includes('revision={HEAD_MANIFEST_SHA256}'));
  assert(viewer.includes('concept=!quizActive&&selected&&selected.entry===activeEntry&&HEAD_LINK_REVISION===HEAD_MANIFEST_SHA256?headAtlasConcept'));
  assert(viewer.includes('key={concept.conceptId}'));assert(guided.includes('key={link.conceptId}'));
  for(const name of ['HeadAtlasTeaching','HeadAtlasTeachingReview']){
    const source=readFileSync(new URL('../components/'+name+'.tsx',import.meta.url),'utf8');assert(!/localStorage|sessionStorage|fetch\(|postMessage|dangerouslySetInnerHTML/.test(source));
  }
});

test('actual review page refuses denied or unavailable authorization before returning its packet',async()=>{
  const page=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(page,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  for(const allowed of [false,true]){
    let checks=0,imageOnlyChecks=0,lobarChecks=0;const mod={exports:{} as {default:()=>Promise<React.ReactNode>}};
    const load=(id:string)=>id==='@/lib/clinical-review-server'?{authorizeClinicalReview:async()=>{checks++;if(!allowed)throw new Error('private denial detail');}}:id==='@/lib/head-atlas-import'?{HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION}:id==='@/components/HeadAtlasTeachingReview'?{HeadAtlasTeachingReview:Review}:id==='@/lib/head-teaching-review-contract'?{headTeachingDraftContext}:id==='@/components/HeadMriComparisonReview'?{HeadMriComparisonReview:Comparison}:id==='@/lib/head-mri-comparison-review'?comparison:id==='@/lib/head-mri-only-teaching'?mriTeaching:id==='@/lib/head-mri-learning'?mriLearning:id==='@/components/HeadInsulaComparisonReview'?{HeadInsulaComparisonReview:()=>null}:id==='@/lib/head-insula-comparison-review'?insulaComparison:id==='@/components/HeadTeachingReviewNotes'?{HeadTeachingReviewNotes:()=>React.createElement('section',{'aria-label':'Private notes fixture'},'Private notes fixture')}:id==='../lib/head-orbital-teaching'?require('../lib/head-orbital-teaching.ts'):id==='./HeadAnatomyCheck'?headAnatomyCheckModule:require(id);
    const withMri=(id:string)=>id==='@/lib/head-mri-review-draft-contract'?{headMriDraftContext}:id==='@/lib/head-insula-teaching'?insulaTeaching:id==='@/lib/head-insula-learning'?insulaLearning:id==='@/components/HeadMriReviewNotes'?{HeadMriReviewNotes:()=>React.createElement('section',{'aria-label':'Private MRI notes fixture'},'Private MRI notes fixture')}:load(id);
    const withOrbital=(id:string)=>id==='@/lib/head-orbital-learning'?require('../lib/head-orbital-learning.ts'):id==='@/components/HeadOrbitalComparisonReview'?{HeadOrbitalComparisonReview:()=>null}:id==='@/lib/head-orbital-comparison-review'?require('../lib/head-orbital-comparison-review.ts'):id==='@/lib/head-orbital-teaching'?require('../lib/head-orbital-teaching.ts'):withMri(id);
    const withCtBone=(id:string)=>id==='@/components/HeadCtBoneComparisonReview'?{HeadCtBoneComparisonReview:()=>null}:id==='@/lib/head-ct-bone-comparison-review'?require('../lib/head-ct-bone-comparison-review.ts'):id==='@/lib/head-ct-bone-teaching'?require('../lib/head-ct-bone-teaching.ts'):withOrbital(id);
    const withImageOnly=(id:string)=>id==='@/lib/head-anatomy-checks'?require('../lib/head-anatomy-checks.ts'):id==='@/components/HeadAnatomyChecksReview'?{HeadAnatomyChecksReview:component('HeadAnatomyChecksReview')}:id==='@/components/HeadImageOnlyComparisonReview'?{HeadImageOnlyComparisonReview:()=>React.createElement('section',{'aria-label':'Image-only comparison fixture'},'Image-only comparison fixture')}:id==='@/lib/head-image-only-comparison-review'?{verifiedHeadImageOnlyComparisonPacket:async(revision:string)=>{imageOnlyChecks++;return require('../lib/head-image-only-comparison-review.ts').verifiedHeadImageOnlyComparisonPacket(revision);}}:id==='@/lib/head-image-only-links'?require('../lib/head-image-only-links.ts'):id==='@/lib/head-cerebellar-teaching'?require('../lib/head-cerebellar-teaching.ts'):id==='@/lib/head-cerebellar-learning'?require('../lib/head-cerebellar-learning.ts'):withCtBone(id);
    const withCerebellarClinical=(id:string)=>id==='@/lib/head-cerebellar-clinical'?require('../lib/head-cerebellar-clinical.ts'):id==='@/components/HeadCerebellarClinicalReview'?{HeadCerebellarClinicalReview:component('HeadCerebellarClinicalReview')}:withImageOnly(id);
    const withClinicalExtensions=(id:string)=>id==='@/lib/head-deep-grey-clinical'?require('../lib/head-deep-grey-clinical.ts'):id==='@/components/HeadDeepGreyClinicalReview'?{HeadDeepGreyClinicalReview:component('HeadDeepGreyClinicalReview')}:id==='@/lib/head-lobar-clinical'?{verifiedLobarClinicalRevision:async(revision:string)=>{lobarChecks++;return require('../lib/head-lobar-clinical.ts').verifiedLobarClinicalRevision(revision);}}:id==='@/components/HeadLobarClinicalReview'?{HeadLobarClinicalReview:component('HeadLobarClinicalReview')}:id==='@/lib/head-hippocampal-clinical'?require('../lib/head-hippocampal-clinical.ts'):id==='@/components/HeadHippocampalClinicalReview'?{HeadHippocampalClinicalReview:component('HeadHippocampalClinicalReview')}:id==='@/lib/head-mri-only-clinical'?require('../lib/head-mri-only-clinical.ts'):id==='@/components/HeadMriOnlyClinicalReview'?{HeadMriOnlyClinicalReview:component('HeadMriOnlyClinicalReview')}:withCerebellarClinical(id);
    const withMriQuestions=(id:string)=>id==='@/lib/head-mri-anatomy-checks'?require('../lib/head-mri-anatomy-checks.ts'):id==='@/components/HeadMriAnatomyChecksReview'?{HeadMriAnatomyChecksReview:component('HeadMriAnatomyChecksReview')}:withClinicalExtensions(id);
    let facialChecks=0,facialLearningChecks=0;
    const withFacial=(id:string)=>id==='@/components/HeadCtFacialComparisonReview'?{HeadCtFacialComparisonReview:()=>null}:id==='@/components/HeadCtFacialLearningReview'?{HeadCtFacialLearningReview:()=>null}:id==='@/lib/head-ct-facial-comparison-review'?{verifiedHeadCtFacialComparisonPacket:async(revision:string)=>{facialChecks++;return require('../lib/head-ct-facial-comparison-review.ts').verifiedHeadCtFacialComparisonPacket(revision);}}:id==='@/lib/head-ct-facial-learning'?{verifiedHeadCtFacialLearningRevision:async(revision:string)=>{facialLearningChecks++;return require('../lib/head-ct-facial-learning.ts').verifiedHeadCtFacialLearningRevision(revision);}}:withMriQuestions(id);
    let facialTeachingChecks=0,facialClinicalChecks=0;
    const withFacialTeaching=(id:string)=>id==='@/components/HeadCtFacialTeachingReview'?{HeadCtFacialTeachingReview:()=>null}:id==='@/lib/head-ct-facial-teaching.ts'?{verifiedHeadCtFacialTeachingRevision:async(revision:string)=>{facialTeachingChecks++;return require('../lib/head-ct-facial-teaching.ts').verifiedHeadCtFacialTeachingRevision(revision);}}:id==='@/lib/head-ct-facial-clinical.ts'?{verifiedHeadCtFacialClinicalRevision:async(revision:string)=>{facialClinicalChecks++;return require('../lib/head-ct-facial-clinical.ts').verifiedHeadCtFacialClinicalRevision(revision);}}:withFacial(id);
    new Function('require','module','exports',compiled)(withFacialTeaching,mod,mod.exports);
    const html=renderToStaticMarkup(await mod.exports.default());assert.equal(checks,1);
    assert.equal(facialChecks,allowed?1:0);assert.equal(facialLearningChecks,allowed?1:0);
    assert.equal(facialTeachingChecks,allowed?1:0);assert.equal(facialClinicalChecks,allowed?1:0);
    if(allowed){assert.equal(imageOnlyChecks,1);assert.equal(lobarChecks,1);assert(html.includes('Image-only comparison fixture'));assert(html.includes(teaching.HEAD_TEACHING_REVISION));assert(html.includes('Private notes fixture'));assert(html.includes('id="lobar-clinical-review"'));assert(html.includes(require('../lib/head-lobar-clinical.ts').LOBAR_CLINICAL_REVISION));}
    else {assert.equal(imageOnlyChecks,0,'No image-only evidence loaded before authorization');assert.equal(lobarChecks,0,'No lobar clinical evidence verified before authorization');assert.match(html,/authorized administrator account/);assert(!html.includes(teaching.HEAD_TEACHING_REVISION));assert(!html.includes('Private notes fixture'));assert(!html.includes('Image-only comparison fixture'));assert(!html.includes('lobar-clinical-review'));assert(!html.includes('private denial detail'));assert(!html.includes('Inspect CT target'));}
  }
});

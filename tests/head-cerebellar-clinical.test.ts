import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket} from '../lib/head-atlas-learning.ts';
import {BRAINSTEM_CLINICAL_REVISION,brainstemClinicalPacket} from '../lib/head-brainstem-clinical.ts';
import {VENTRICULAR_CLINICAL_REVISION,ventricularClinicalPacket} from '../lib/head-ventricular-clinical.ts';
import {HEAD_IMAGE_ONLY_COMPARISON_REVISION} from '../lib/head-image-only-comparison-review.ts';
import * as links from '../lib/head-image-only-links.ts';
import * as comparison from '../lib/head-image-only-comparison-review.ts';
import * as clinical from '../lib/head-cerebellar-clinical.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids=['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis'];
const content=clinical.cerebellarClinicalContent;
const hrefAttribute=(href:string)=>`href="${href.replaceAll('&','&amp;')}"`;

function compile(path:string,imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>imports[name]??(name==='./HeadReviewImageLink'?headReviewImageLinkModule:name==='./HeadAnatomyCheck'?headAnatomyCheckModule:name.startsWith('../lib/')?require(name.endsWith('.ts')?name:name+'.ts'):path.startsWith('../lib/')&&name.startsWith('./head-')?require('../lib/'+name.slice(2)):require(name)),mod,mod.exports);
  return mod.exports;
}

test('independent draft digest and unchanged earlier packet identities',async()=>{
  const packet=clinical.cerebellarClinicalPacket();
  assert.equal(clinical.CEREBELLAR_CLINICAL_REVISION,'49f55fc8ff432818ebc3b2fbe6e17891ec7dd25d5092d1699870fde06f02631d');
  assert.equal(sha(packet),clinical.CEREBELLAR_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedCerebellarClinicalRevision(HEAD_LINK_REVISION),clinical.CEREBELLAR_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedCerebellarClinicalRevision('stale'),null);
  assert.equal(content.headRevision,HEAD_LINK_REVISION);
  assert.equal(content.comparisonRevision,HEAD_IMAGE_ONLY_COMPARISON_REVISION);
  assert.equal(content.status,'draft');
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  assert.deepEqual(content.notes.map(note=>note.conceptId),ids);
  assert.equal(packet.bindings.length,3);
  assert.equal(sha(links.headImageOnlyComparisonPacket()),HEAD_IMAGE_ONLY_COMPARISON_REVISION);
  for(const [prior,pin] of [[headTeachingPacket(),HEAD_TEACHING_REVISION],[headLearningPacket(),HEAD_LEARNING_REVISION],[brainstemClinicalPacket(),BRAINSTEM_CLINICAL_REVISION],[ventricularClinicalPacket(),VENTRICULAR_CLINICAL_REVISION]] as const)assert.equal(sha(prior),pin);
  for(const key of ['text','caution','answer'] as const){
    const changed={...packet,content:{...content,notes:content.notes.map((note,index)=>index?note:{...note,[key]:note[key]+' changed'})}};
    assert.notEqual(sha(changed),clinical.CEREBELLAR_CLINICAL_REVISION,key);
  }
  assert.match(content.scope,/separate, unregistered subjects/);
  assert.match(content.scope,/no exact corresponding part/);
  assert.match(content.scope,/partial/);
  assert.doesNotMatch(JSON.stringify(packet),/data:image|\.(?:png|jpe?g|svg|webp|mp4|pdf)(?:["?])/i);
});

test('six exact native CT and MRI clinical placements retain laterality and partial vermis',()=>{
  const native=links.headImageOnlyComparisonPacket();
  assert.deepEqual(native.bindings.map(item=>item.conceptId),ids);
  const laterality=['left','right','midline_or_unpaired'];
  let placements=0;
  for(const [index,note] of content.notes.entries()){
    const binding=links.headImageConceptById(note.conceptId);
    const pair=native.bindings[index];
    assert(binding&&pair);
    assert.equal(binding.conceptId,note.conceptId);
    assert.equal(binding.atlasHref,undefined);
    assert.equal(headConceptById(note.conceptId),null);
    assert.equal(pair.ct.laterality,laterality[index]);
    assert.equal(pair.mri.laterality,laterality[index]);
    assert.equal(pair.ct.id,`cth.cer.${index===2?'cerebellar_vermis':`cerebellar_hemisphere.${laterality[index]}`}`);
    assert.equal(pair.mri.id,`mrb.cer.${index===2?'cerebellar_vermis':`cerebellar_hemisphere.${laterality[index]}`}`);
    assert.equal(pair.mri.representation,index===2?'partial-mask':'mask');
    for(const modality of ['CT','MRI'] as const){
      const item=clinical.cerebellarClinicalForConcept(note.conceptId,modality,HEAD_LINK_REVISION);
      assert(item);
      placements++;
      assert.equal(item.note,note);
      assert.deepEqual(item.binding,binding);
      assert.equal(item.imaging,content.imaging[modality]);
      assert.equal(item.revision,clinical.CEREBELLAR_CLINICAL_REVISION);
      for(const id of [...note.sources,...item.imaging.sources])assert(item.sources.some(source=>source.id===id));
      assert.equal(clinical.cerebellarClinicalForConcept(note.conceptId,modality,'stale'),null);
    }
  }
  assert.equal(placements,6);
  for(const id of [...ids,'brainstem-pons','unknown'])assert.equal(clinical.cerebellarClinicalForConcept(id,'US' as 'CT',HEAD_LINK_REVISION),null);
  for(const id of ['brainstem-pons','ventricle-fourth','unknown'])assert.equal(clinical.cerebellarClinicalForConcept(id,'CT',HEAD_LINK_REVISION),null);
});

test('verification refuses changed comparison, native binding, or clinical content',async()=>{
  const isolated=(linkOverrides:Partial<typeof links>={},comparisonOverrides:Partial<typeof comparison>={})=>compile('../lib/head-cerebellar-clinical.ts',{
    './head-image-only-links.ts':{...links,...linkOverrides},
    './head-image-only-comparison-review.ts':{...comparison,...comparisonOverrides},
  }) as typeof clinical;
  assert.equal(await isolated({},{verifiedHeadImageOnlyComparisonPacket:async()=>null}).verifiedCerebellarClinicalRevision(HEAD_LINK_REVISION),null);
  assert.equal(await isolated({headImageConceptById:()=>null}).verifiedCerebellarClinicalRevision(HEAD_LINK_REVISION),null);
  for(const key of ['ctHref','mriHref','headRevision','atlasHref'] as const){
    const changed=isolated({headImageConceptById:id=>{const link=links.headImageConceptById(id);return link?{...link,[key]:key==='atlasHref'?'/atlas/head-neck-3d':'changed'}:null;}});
    assert.equal(await changed.verifiedCerebellarClinicalRevision(HEAD_LINK_REVISION),null,key);
  }
  const changed=isolated();
  (changed.cerebellarClinicalContent.notes[0] as {text:string}).text+=' changed';
  assert.equal(await changed.verifiedCerebellarClinicalRevision(HEAD_LINK_REVISION),null);
});

test('actual native teaching nests evidence and reflection while 3D reference has no cerebellar clinical target',()=>{
  const Teaching=compile('../components/HeadAtlasTeaching.tsx').HeadAtlasTeaching;
  const Reference=compile('../components/HeadAtlasReferenceTeaching.tsx').HeadAtlasReferenceTeaching;
  for(const note of content.notes){
    for(const modality of ['CT','MRI'] as const){
      const html=renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:HEAD_LINK_REVISION}));
      for(const phrase of [note.text,note.caution,note.question,note.answer,content.imaging[modality].text,clinical.CEREBELLAR_CLINICAL_REVISION])assert(html.includes(phrase),phrase);
      assert(!html.includes(content.imaging[modality==='CT'?'MRI':'CT'].text));
      assert.match(html,/<details><summary>Clinical correlation · Draft<\/summary>/);
      assert.match(html,/<details><summary>Reveal explanation<\/summary>/);
      assert.match(html,/<details><summary>Clinical sources &amp; separate revision<\/summary>/);
      assert.match(html,/no score or completion recorded/);
      assert(!html.includes('checked=""'));
      for(const source of clinical.cerebellarClinicalForConcept(note.conceptId,modality,HEAD_LINK_REVISION)!.sources){
        assert(html.includes(source.url));assert(html.includes(source.evidence));
      }
      assert.equal(renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:'stale'})),'');
    }
    assert.equal(renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:HEAD_LINK_REVISION})),'');
  }
});

test('read-only Review shows exact links, source limitations, and unavailable state on stale inputs',()=>{
  const Review=compile('../components/HeadCerebellarClinicalReview.tsx').HeadCerebellarClinicalReview as React.ComponentType<{revision:string;clinicalRevision:string|null}>;
  const html=renderToStaticMarkup(React.createElement(Review,{revision:HEAD_LINK_REVISION,clinicalRevision:clinical.CEREBELLAR_CLINICAL_REVISION}));
  assert(html.includes('id="cerebellar-clinical-review"'));
  for(const text of [content.scope,content.imaging.CT.text,content.imaging.MRI.text,clinical.CEREBELLAR_CLINICAL_REVISION,content.comparisonRevision,...content.reviewChecks,content.reuse])assert(html.includes(text),text);
  for(const note of content.notes){
    const section=html.slice(html.indexOf(`id="cerebellar-clinical-${note.conceptId}"`));
    const pair=links.headImageOnlyComparisonPacket().bindings.find(binding=>binding.conceptId===note.conceptId)!;
    for(const value of [note.text,note.caution,note.question,note.answer,pair.ct.id,pair.mri.id,pair.mri.representation])assert(section.includes(value),value);
    for(const modality of ['CT','MRI'] as const){const href=headImageHref(modality,note.conceptId,null,HEAD_LINK_REVISION);assert(href);assert(section.includes(hrefAttribute(href)));}
  }
  for(const source of content.sources){assert(html.includes(source.url));assert(html.includes(source.evidence));}
  assert.match(html,/<details><summary>Cerebellar clinical correlations/);
  assert.match(html,/<details><summary>CT and MRI pitfalls<\/summary>/);
  assert.match(html,/<details><summary>Primary sources and review checklist<\/summary>/);
  assert.doesNotMatch(html,/<form\b|<input\b|<button\b|action=|>Inspect [^<]*3D/);
  for(const props of [{revision:'stale',clinicalRevision:clinical.CEREBELLAR_CLINICAL_REVISION},{revision:HEAD_LINK_REVISION,clinicalRevision:'stale'},{revision:HEAD_LINK_REVISION,clinicalRevision:null}]){
    const unavailable=renderToStaticMarkup(React.createElement(Review,props));
    assert.match(unavailable,/Cerebellar clinical draft unavailable/);
    assert.match(unavailable,/No clinical targets have been substituted/);
    assert(!unavailable.includes(content.notes[0].text));
    assert(!unavailable.includes('Inspect Left cerebellar hemisphere'));
    assert.doesNotMatch(unavailable,/<form\b|<input\b|<button\b/);
  }
});

test('protected route authorizes before clinical verification and binds the independent result',()=>{
  const route=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  const authorization=route.indexOf('await authorizeClinicalReview()');
  const firstVerification=route.indexOf('await headTeachingDraftContext(');
  const clinicalVerification=route.indexOf('await verifiedCerebellarClinicalRevision(');
  const render=route.indexOf('return <HeadAtlasTeachingReview');
  assert(authorization>=0&&authorization<firstVerification&&firstVerification<clinicalVerification&&clinicalVerification<render);
  assert.match(route,/catch\{return <p role="alert">Open Clinical Review with an authorized administrator account/);
  assert.match(route,/clinicalRevision=\{cerebellarClinicalRevision\}/);
  const binder=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url),'utf8');
  for(const path of ['lib/head-cerebellar-clinical.ts','components/HeadCerebellarClinicalReview.tsx'])assert(binder.includes(`'${path}'`));
  assert(binder.includes('app/workspace/atlas-review'));
});

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
import * as links from '../lib/head-atlas-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket} from '../lib/head-atlas-learning.ts';
import {BRAINSTEM_CLINICAL_REVISION,brainstemClinicalPacket} from '../lib/head-brainstem-clinical.ts';
import {VENTRICULAR_CLINICAL_REVISION,ventricularClinicalPacket} from '../lib/head-ventricular-clinical.ts';
import {CEREBELLAR_CLINICAL_REVISION,cerebellarClinicalPacket} from '../lib/head-cerebellar-clinical.ts';
import {DEEP_GREY_CLINICAL_REVISION,deepGreyClinicalPacket} from '../lib/head-deep-grey-clinical.ts';
import * as clinical from '../lib/head-lobar-clinical.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids=['left','right'].flatMap(side=>['frontal','parietal','temporal','occipital'].map(part=>`cortex-${side}-${part}-lobe`));
const content=clinical.lobarClinicalContent;
const escaped=(value:string)=>value.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;');
const hrefAttribute=(href:string)=>`href="${escaped(href)}"`;

function compile(path:string,imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{
    compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>imports[name]??(
    name==='./HeadAnatomyCheck'?headAnatomyCheckModule:
    name==='./HeadReviewImageLink'?headReviewImageLinkModule:
    path.startsWith('../lib/')&&name.startsWith('./head-')?require('../lib/'+name.slice(2)):
    name.startsWith('../lib/')?require(name.endsWith('.ts')?name:name+'.ts'):
    require(name)
  ),mod,mod.exports);
  return mod.exports;
}

test('eight independent draft notes, exact SHA, bounded source facts and unchanged earlier packets',async()=>{
  const packet=clinical.lobarClinicalPacket();
  assert.equal(clinical.LOBAR_CLINICAL_REVISION,'a0217a9f8621b59aaa906678565c52cbbfc5ebf3a8ef7ac8c29168879dd617c1');
  assert.equal(sha(packet),clinical.LOBAR_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedLobarClinicalRevision(links.HEAD_LINK_REVISION),clinical.LOBAR_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedLobarClinicalRevision('stale'),null);
  assert.equal(content.schema,'vm-lobar-clinical-1');
  assert.equal(content.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(content.status,'draft');
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  assert.deepEqual(content.notes.map(note=>note.conceptId),ids);
  assert.equal(packet.bindings.length,8);
  assert.equal(content.sources.length,3);
  assert.deepEqual(content.sources.map(source=>source.id),['dronkers-2007','mort-2003','zhang-2006']);
  for(const source of content.sources)assert(source.title&&/^https:\/\//.test(source.url)&&source.evidence);
  const sourceIds=new Set(content.sources.map(source=>source.id));
  for(const item of [...content.notes,content.imaging.CT,content.imaging.MRI]){
    assert(item.sources.length);
    for(const id of item.sources)assert(sourceIds.has(id),`unknown source ${id}`);
  }
  const frontal=content.notes.find(note=>note.conceptId==='cortex-left-frontal-lobe')!;
  const parietal=content.notes.find(note=>note.conceptId==='cortex-left-parietal-lobe')!;
  const occipital=content.notes.find(note=>note.conceptId==='cortex-left-occipital-lobe')!;
  assert.match(frontal.text,/two preserved historical brains/i);
  assert.match(frontal.caution,/not a contemporary diagnostic cohort/i);
  assert.match(parietal.text,/35 right-hemisphere stroke cases/i);
  assert.match(occipital.text,/904 homonymous hemianopias in 852 patients/i);
  assert.match(content.scope,/separate, unregistered subjects/);
  assert.match(content.scope,/does not establish bilateral clinical equivalence/);
  for(const [prior,pin] of [
    [headTeachingPacket(),HEAD_TEACHING_REVISION],
    [headLearningPacket(),HEAD_LEARNING_REVISION],
    [brainstemClinicalPacket(),BRAINSTEM_CLINICAL_REVISION],
    [ventricularClinicalPacket(),VENTRICULAR_CLINICAL_REVISION],
    [cerebellarClinicalPacket(),CEREBELLAR_CLINICAL_REVISION],
    [deepGreyClinicalPacket(),DEEP_GREY_CLINICAL_REVISION],
  ] as const)assert.equal(sha(prior),pin);
  for(const key of ['text','caution','answer'] as const){
    const changed={...packet,content:{...content,notes:content.notes.map((note,index)=>index?note:{...note,[key]:note[key]+' changed'})}};
    assert.notEqual(sha(changed),clinical.LOBAR_CLINICAL_REVISION,key);
  }
  assert.doesNotMatch(JSON.stringify(packet),/data:image|\.(?:png|jpe?g|svg|webp|mp4|pdf)(?:["?])/i);
});

test('all eight concepts retain CT, MRI and existing 3D identities without cross-modality substitution',()=>{
  let placements=0;
  for(const [index,note] of content.notes.entries()){
    const binding=links.headConceptById(note.conceptId);
    assert(binding);
    assert.deepEqual(clinical.lobarClinicalPacket().bindings[index],binding);
    assert.equal(binding.conceptId,note.conceptId);
    assert.equal(binding.headRevision,links.HEAD_LINK_REVISION);
    assert(binding.ctHref&&binding.mriHref&&binding.atlasHref);
    assert.match(binding.atlasHref,/^\/atlas\/head-neck-3d/);
    for(const modality of ['CT','MRI'] as const){
      const item=clinical.lobarClinicalForConcept(note.conceptId,modality,links.HEAD_LINK_REVISION);
      assert(item);
      placements++;
      assert.equal(item.note,note);
      assert.deepEqual(item.binding,binding);
      assert.equal(item.imaging,content.imaging[modality]);
      assert.equal(item.revision,clinical.LOBAR_CLINICAL_REVISION);
      for(const id of [...note.sources,...item.imaging.sources])assert(item.sources.some(source=>source.id===id));
      assert.equal(clinical.lobarClinicalForConcept(note.conceptId,modality,'stale'),null);
    }
  }
  assert.equal(placements,16);
  for(const id of [...ids,'brainstem-pons','unknown'])assert.equal(clinical.lobarClinicalForConcept(id,'US' as 'CT',links.HEAD_LINK_REVISION),null);
  for(const id of ['brainstem-pons','deep-left-caudate','unknown'])assert.equal(clinical.lobarClinicalForConcept(id,'CT',links.HEAD_LINK_REVISION),null);
});

test('verification refuses missing, stale, substituted or mutated native and reference bindings',async()=>{
  const isolated=(lookup:typeof links.headConceptById)=>compile('../lib/head-lobar-clinical.ts',{
    './head-atlas-links.ts':{...links,headConceptById:lookup},
  }) as typeof clinical;
  const changed=(transform:(binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>ReturnType<typeof links.headConceptById>)=>
    isolated(id=>{const binding=links.headConceptById(id);return binding&&id===ids[0]?transform(binding):binding;});
  assert.equal(await isolated(()=>null).verifiedLobarClinicalRevision(links.HEAD_LINK_REVISION),null);
  const another=links.headConceptById(ids[1])!;
  assert.equal(await changed(()=>another).verifiedLobarClinicalRevision(links.HEAD_LINK_REVISION),null);
  for(const field of ['ctHref','mriHref','atlasHref'] as const){
    assert.equal(await changed(binding=>({...binding,[field]:''})).verifiedLobarClinicalRevision(links.HEAD_LINK_REVISION),null,`missing ${field}`);
    assert.equal(await changed(binding=>({...binding,[field]:'/wrong-target'})).verifiedLobarClinicalRevision(links.HEAD_LINK_REVISION),null,`wrong ${field}`);
  }
  assert.equal(await changed(binding=>({...binding,headRevision:'stale'})).verifiedLobarClinicalRevision(links.HEAD_LINK_REVISION),null);
  const mutable=isolated(links.headConceptById);
  (mutable.lobarClinicalContent.notes[0] as {text:string}).text+=' changed';
  assert.equal(await mutable.verifiedLobarClinicalRevision(links.HEAD_LINK_REVISION),null);
});

test('native CT, MRI and reference 3D render folded, sourced and unscored clinical teaching',()=>{
  const Teaching=compile('../components/HeadAtlasTeaching.tsx').HeadAtlasTeaching;
  const Reference=compile('../components/HeadAtlasReferenceTeaching.tsx').HeadAtlasReferenceTeaching;
  for(const note of content.notes){
    for(const modality of ['CT','MRI'] as const){
      const html=renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:links.HEAD_LINK_REVISION}));
      for(const phrase of [note.text,note.caution,note.question,note.answer,content.imaging[modality].text,clinical.LOBAR_CLINICAL_REVISION])assert(html.includes(escaped(phrase)),`${note.conceptId} ${modality}: ${phrase}`);
      assert(!html.includes(escaped(content.imaging[modality==='CT'?'MRI':'CT'].text)));
      assert.match(html,/<details><summary>Clinical correlation · Draft<\/summary>/);
      assert.match(html,/<details><summary>Reveal explanation<\/summary>/);
      assert.match(html,/no score or completion recorded/);
      assert(!html.includes('checked=""'));
      for(const source of clinical.lobarClinicalForConcept(note.conceptId,modality,links.HEAD_LINK_REVISION)!.sources){
        assert(html.includes(hrefAttribute(source.url)));assert(html.includes(escaped(source.evidence)));
      }
      assert.equal(renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:'stale'})),'');
    }
    const reference=renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:links.HEAD_LINK_REVISION}));
    for(const phrase of [note.text,note.caution,note.question,note.answer,content.imaging.CT.text,content.imaging.MRI.text,clinical.LOBAR_CLINICAL_REVISION])assert(reference.includes(escaped(phrase)),`${note.conceptId} 3D: ${phrase}`);
    assert.match(reference,/<details><summary>Clinical correlation &amp; imaging pitfalls · Draft<\/summary>/);
    assert.match(reference,/not spatially registered/);
    assert.match(reference,/no score or completion recorded/);
    assert(!reference.includes('checked=""'));
    assert.equal(renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:'stale'})),'');
  }
});

test('read-only protected Review shows exact target links, sources and stale refusal',()=>{
  const Review=compile('../components/HeadLobarClinicalReview.tsx').HeadLobarClinicalReview as React.ComponentType<{revision:string;clinicalRevision:string|null}>;
  const html=renderToStaticMarkup(React.createElement(Review,{revision:links.HEAD_LINK_REVISION,clinicalRevision:clinical.LOBAR_CLINICAL_REVISION}));
  assert(html.includes('id="lobar-clinical-review"'));
  for(const phrase of [content.scope,content.imaging.CT.text,content.imaging.MRI.text,clinical.LOBAR_CLINICAL_REVISION,...content.reviewChecks,content.reuse])assert(html.includes(escaped(phrase)),phrase);
  for(const note of content.notes){
    const section=html.slice(html.indexOf(`id="lobar-clinical-${note.conceptId}"`));
    for(const phrase of [note.text,note.caution,note.question,note.answer])assert(section.includes(escaped(phrase)),phrase);
    const binding=links.headConceptById(note.conceptId)!;
    for(const modality of ['CT','MRI'] as const){
      const href=headImageHref(modality,note.conceptId,null,links.HEAD_LINK_REVISION);
      assert(href);assert(section.includes(hrefAttribute(href)));
    }
    assert(section.includes(hrefAttribute(binding.atlasHref)));
  }
  for(const source of content.sources){assert(html.includes(hrefAttribute(source.url)));assert(html.includes(escaped(source.evidence)));}
  assert.match(html,/<details><summary>Cerebral-lobe clinical correlations/);
  assert.match(html,/<details><summary>CT and MRI pitfalls<\/summary>/);
  assert.match(html,/<details><summary>Primary sources and review checklist<\/summary>/);
  assert.doesNotMatch(html,/<form\b|<input\b|<button\b|action=|<details open/);
  for(const props of [
    {revision:'stale',clinicalRevision:clinical.LOBAR_CLINICAL_REVISION},
    {revision:links.HEAD_LINK_REVISION,clinicalRevision:'stale'},
    {revision:links.HEAD_LINK_REVISION,clinicalRevision:null},
  ]){
    const unavailable=renderToStaticMarkup(React.createElement(Review,props));
    assert.match(unavailable,/Cerebral-lobe clinical draft unavailable/);
    assert.match(unavailable,/No targets have been substituted/);
    assert(!unavailable.includes(escaped(content.notes[0].text)));
    assert.doesNotMatch(unavailable,/<form\b|<input\b|<button\b/);
  }
});

test('protected route authorizes first and offers corrections only for the independent verified lobar packet',()=>{
  const route=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  const authorization=route.indexOf('await authorizeClinicalReview()');
  const firstReview=route.indexOf('await headTeachingDraftContext(');
  const verification=route.indexOf('await verifiedLobarClinicalRevision(');
  const render=route.indexOf('return <HeadAtlasTeachingReview');
  assert(authorization>=0&&authorization<firstReview&&firstReview<verification&&verification<render);
  assert.match(route,/catch\{return <p role="alert">Open Clinical Review with an authorized administrator account/);
  assert.match(route,/\.\.\.\(lobarClinicalRevision\?\[\{id:'lobar-clinical-review'/);
  assert.match(route,/if\(lobarClinicalRevision\)try\{lobarContext=await headTeachingDraftContext\(HEAD_MANIFEST_SHA256,'lobar-clinical'\)/);
  assert.match(route,/lobarReview=\{<HeadLobarClinicalReview revision=\{HEAD_MANIFEST_SHA256\} clinicalRevision=\{lobarClinicalRevision\} reviewNotes=\{lobarContext\?<HeadTeachingReviewNotes key=\{JSON.stringify\(lobarContext\)\} context=\{lobarContext\}\/>:undefined\}\/>\}/);
  assert.match(route,/\.\.\.\(lobarContext\?\[\{id:'lobar-clinical-corrections'/);
  const review=readFileSync(new URL('../components/HeadLobarClinicalReview.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(review,/HeadTeachingReviewNotes|<form\b|<button\b/);
  const binder=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url),'utf8');
  for(const path of ['lib/head-lobar-clinical.ts','components/HeadLobarClinicalReview.tsx'])assert(binder.includes(`'${path}'`));
});

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
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket} from '../lib/head-atlas-learning.ts';
import {BRAINSTEM_CLINICAL_REVISION,brainstemClinicalPacket} from '../lib/head-brainstem-clinical.ts';
import {VENTRICULAR_CLINICAL_REVISION,ventricularClinicalPacket} from '../lib/head-ventricular-clinical.ts';
import * as clinical from '../lib/head-deep-grey-clinical.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids=['left','right'].flatMap(side=>['caudate','putamen','globus-pallidus','thalamus'].map(part=>`deep-${side}-${part}`));
const content=clinical.deepGreyClinicalContent;
const escapedHref=(href:string)=>`href="${href.replaceAll('&','&amp;')}"`;

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

test('eight independent draft notes, exact SHA, source evidence and unchanged earlier packets',async()=>{
  const packet=clinical.deepGreyClinicalPacket();
  assert.equal(content.schema,'vm-deep-grey-clinical-1');
  assert.equal(content.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(content.status,'draft');
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  assert.deepEqual(content.notes.map(note=>note.conceptId),ids);
  assert.equal(packet.bindings.length,8);
  assert.equal(sha(packet),clinical.DEEP_GREY_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedDeepGreyClinicalRevision(links.HEAD_LINK_REVISION),clinical.DEEP_GREY_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedDeepGreyClinicalRevision('stale'),null);
  const sourceIds=new Set(content.sources.map(source=>source.id));
  assert.equal(sourceIds.size,content.sources.length);
  for(const source of content.sources){
    assert(source.title&&/^https:\/\//.test(source.url)&&source.evidence);
  }
  for(const item of [...content.notes,content.imaging.CT,content.imaging.MRI]){
    assert(item.sources.length);
    for(const id of item.sources)assert(sourceIds.has(id),`unknown source ${id}`);
  }
  for(const [earlier,pin] of [
    [headTeachingPacket(),HEAD_TEACHING_REVISION],
    [headLearningPacket(),HEAD_LEARNING_REVISION],
    [brainstemClinicalPacket(),BRAINSTEM_CLINICAL_REVISION],
    [ventricularClinicalPacket(),VENTRICULAR_CLINICAL_REVISION],
  ] as const)assert.equal(sha(earlier),pin);
  for(const key of ['text','caution','answer'] as const){
    const changed={...packet,content:{...content,notes:content.notes.map((note,index)=>index?note:{...note,[key]:note[key]+' changed'})}};
    assert.notEqual(sha(changed),clinical.DEEP_GREY_CLINICAL_REVISION,key);
  }
  assert.doesNotMatch(JSON.stringify(packet),/data:image|\.(?:png|jpe?g|svg|webp|mp4|pdf)(?:["?])/i);
});

test('exact eight concepts resolve in both native modalities with the original 3D binding',()=>{
  let placements=0;
  for(const [index,note] of content.notes.entries()){
    const binding=links.headConceptById(note.conceptId);
    assert(binding);
    assert.deepEqual(clinical.deepGreyClinicalPacket().bindings[index],binding);
    assert(binding.atlasHref&&binding.ctHref&&binding.mriHref);
    assert.equal(binding.headRevision,links.HEAD_LINK_REVISION);
    assert.match(binding.atlasHref,/^\/atlas\/head-neck-3d/);
    for(const modality of ['CT','MRI'] as const){
      const item=clinical.deepGreyClinicalForConcept(note.conceptId,modality,links.HEAD_LINK_REVISION);
      assert(item);
      placements++;
      assert.equal(item.note,note);
      assert.deepEqual(item.binding,binding);
      assert.equal(item.imaging,content.imaging[modality]);
      assert.equal(item.revision,clinical.DEEP_GREY_CLINICAL_REVISION);
      for(const id of [...note.sources,...item.imaging.sources])assert(item.sources.some(source=>source.id===id));
      assert.equal(clinical.deepGreyClinicalForConcept(note.conceptId,modality,'stale'),null);
    }
  }
  assert.equal(placements,16);
  for(const id of [...ids,'brainstem-pons','unknown'])assert.equal(clinical.deepGreyClinicalForConcept(id,'US' as 'CT',links.HEAD_LINK_REVISION),null);
  for(const id of ['brainstem-pons','ventricle-third','deep-left-hippocampus','unknown'])assert.equal(clinical.deepGreyClinicalForConcept(id,'CT',links.HEAD_LINK_REVISION),null);
});

test('verification refuses missing, substituted, or damaged native and 3D bindings and content',async()=>{
  const isolated=(lookup:typeof links.headConceptById)=>compile('../lib/head-deep-grey-clinical.ts',{
    './head-atlas-links.ts':{...links,headConceptById:lookup},
    './head-atlas-links':{...links,headConceptById:lookup},
  }) as typeof clinical;
  const changed=(transform:(binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>ReturnType<typeof links.headConceptById>)=>
    isolated(id=>{const binding=links.headConceptById(id);return binding&&id===ids[0]?transform(binding):binding;});
  assert.equal(await isolated(()=>null).verifiedDeepGreyClinicalRevision(links.HEAD_LINK_REVISION),null);
  for(const field of ['ctHref','mriHref','atlasHref'] as const){
    assert.equal(await changed(binding=>({...binding,[field]:''})).verifiedDeepGreyClinicalRevision(links.HEAD_LINK_REVISION),null,`missing ${field}`);
    assert.equal(await changed(binding=>({...binding,[field]:'/wrong-target'})).verifiedDeepGreyClinicalRevision(links.HEAD_LINK_REVISION),null,`wrong ${field}`);
  }
  assert.equal(await changed(binding=>({...binding,headRevision:'stale'})).verifiedDeepGreyClinicalRevision(links.HEAD_LINK_REVISION),null);
  const mutable=isolated(links.headConceptById);
  (mutable.deepGreyClinicalContent.notes[0] as {text:string}).text+=' changed';
  assert.equal(await mutable.verifiedDeepGreyClinicalRevision(links.HEAD_LINK_REVISION),null);
});

test('CT, MRI and reference 3D expose folded unscored notes without cross-modality substitution',()=>{
  const Teaching=compile('../components/HeadAtlasTeaching.tsx').HeadAtlasTeaching;
  const Reference=compile('../components/HeadAtlasReferenceTeaching.tsx').HeadAtlasReferenceTeaching;
  for(const note of content.notes){
    for(const modality of ['CT','MRI'] as const){
      const html=renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:links.HEAD_LINK_REVISION}));
      for(const phrase of [note.text,note.caution,note.question,note.answer,content.imaging[modality].text,clinical.DEEP_GREY_CLINICAL_REVISION])assert(html.includes(phrase),`${note.conceptId} ${modality}: ${phrase}`);
      assert(!html.includes(content.imaging[modality==='CT'?'MRI':'CT'].text));
      assert.match(html,/<details><summary>Clinical correlation/);
      assert.match(html,/<details><summary>Reveal explanation/);
      assert.match(html,/no score or completion recorded/);
      assert(!html.includes('checked=""'));
      assert.equal(renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:'stale'})),'');
    }
    const reference=renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:links.HEAD_LINK_REVISION}));
    for(const phrase of [note.text,note.caution,note.question,note.answer,content.imaging.CT.text,content.imaging.MRI.text,clinical.DEEP_GREY_CLINICAL_REVISION])assert(reference.includes(phrase),`${note.conceptId} 3D: ${phrase}`);
    assert.match(reference,/<details><summary>Clinical correlation/);
    assert.match(reference,/not spatially registered/);
    assert.match(reference,/no score or completion recorded/);
    assert(!reference.includes('checked=""'));
    assert.equal(renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:'stale'})),'');
  }
});

test('protected Review evidence has exact target links and withholds stale clinical evidence',()=>{
  const Review=compile('../components/HeadDeepGreyClinicalReview.tsx').HeadDeepGreyClinicalReview as React.ComponentType<{revision:string;clinicalRevision:string|null}>;
  const html=renderToStaticMarkup(React.createElement(Review,{revision:links.HEAD_LINK_REVISION,clinicalRevision:clinical.DEEP_GREY_CLINICAL_REVISION}));
  assert(html.includes('id="deep-grey-clinical-review"'));
  for(const text of [content.scope,content.imaging.CT.text,content.imaging.MRI.text,clinical.DEEP_GREY_CLINICAL_REVISION,...content.reviewChecks,content.reuse])assert(html.includes(text),text);
  for(const note of content.notes){
    const section=html.slice(html.indexOf(`id="deep-grey-clinical-${note.conceptId}"`));
    for(const value of [note.text,note.caution,note.question,note.answer])assert(section.includes(value),value);
    const binding=links.headConceptById(note.conceptId)!;
    for(const modality of ['CT','MRI'] as const){
      const href=headImageHref(modality,note.conceptId,null,links.HEAD_LINK_REVISION);
      assert(href);
      assert(section.includes(escapedHref(href)));
    }
    assert(section.includes(escapedHref(binding.atlasHref)));
  }
  for(const source of content.sources){assert(html.includes(source.url));assert(html.includes(source.evidence));}
  assert.doesNotMatch(html,/<form\b|<input\b|<button\b|action=|<details open/);
  for(const props of [
    {revision:'stale',clinicalRevision:clinical.DEEP_GREY_CLINICAL_REVISION},
    {revision:links.HEAD_LINK_REVISION,clinicalRevision:'stale'},
    {revision:links.HEAD_LINK_REVISION,clinicalRevision:null},
  ]){
    const unavailable=renderToStaticMarkup(React.createElement(Review,props));
    assert.match(unavailable,/unavailable/i);
    assert(!unavailable.includes(content.notes[0].text));
    assert.doesNotMatch(unavailable,/<form\b|<input\b|<button\b/);
  }
});

test('Head learning route preserves authorization and exposes only the verified picker target',()=>{
  const route=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  const authorization=route.indexOf('await authorizeClinicalReview()');
  const firstReview=route.indexOf('await headTeachingDraftContext(');
  const verification=route.indexOf('await verifiedDeepGreyClinicalRevision(');
  const render=route.indexOf('return <HeadAtlasTeachingReview');
  assert(authorization>=0&&authorization<firstReview&&firstReview<verification&&verification<render);
  assert.match(route,/catch\{return <p role="alert">Open Clinical Review with an authorized administrator account/);
  assert(route.includes("id:'deep-grey-clinical-review'"));
  assert.match(route,/clinicalRevision=\{deepGreyClinicalRevision\}/);
  const binder=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url),'utf8');
  for(const path of ['lib/head-deep-grey-clinical.ts','components/HeadDeepGreyClinicalReview.tsx'])assert(binder.includes(`'${path}'`));
});

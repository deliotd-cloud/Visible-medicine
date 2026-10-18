import assert from 'node:assert/strict';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import * as teaching from '../lib/head-cerebellar-teaching.ts';
import * as links from '../lib/head-image-only-links.ts';
import * as comparison from '../lib/head-image-only-comparison-review.ts';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_INSULA_TEACHING_REVISION,headInsulaTeachingPacket} from '../lib/head-insula-teaching.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,headMriOnlyTeachingPacket} from '../lib/head-mri-only-teaching.ts';
import {HEAD_ORBITAL_TEACHING_REVISION,headOrbitalTeachingPacket} from '../lib/head-orbital-teaching.ts';
import {HEAD_CT_BONE_TEACHING_REVISION,headCtBoneTeachingPacket} from '../lib/head-ct-bone-teaching.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const content=teaching.headCerebellarTeachingContent;
const ids=['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis'];

function compile(path:string,imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{}};
  const load=(name:string):unknown=>imports[name]??(name.startsWith('../lib/')?require(name.endsWith('.ts')?name:name+'.ts'):path.startsWith('../lib/')&&name.startsWith('./head-')?require('../lib/'+name.slice(2)):name==='./HeadAnatomyCheck'?headAnatomyCheckModule:require(name));
  new Function('require','module','exports',code)(load,mod,mod.exports);
  return mod.exports;
}

test('three source-backed drafts bind six native placements to an independent digest',async()=>{
  const packet=teaching.headCerebellarTeachingPacket();
  assert.deepEqual(content.notes.map(note=>note.conceptId),ids);
  assert.equal(content.headRevision,HEAD_LINK_REVISION);
  assert.equal(content.comparisonRevision,comparison.HEAD_IMAGE_ONLY_COMPARISON_REVISION);
  assert.equal(content.status,'draft');assert.equal(content.reviewedAt,null);
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  assert.equal(packet.bindings.length,3);
  assert.equal(sha(packet),teaching.HEAD_CEREBELLAR_TEACHING_REVISION);
  assert.equal(sha(links.headImageOnlyComparisonPacket()),comparison.HEAD_IMAGE_ONLY_COMPARISON_REVISION);
  for(const [older,pin] of [
    [headTeachingPacket(),HEAD_TEACHING_REVISION],
    [headInsulaTeachingPacket(),HEAD_INSULA_TEACHING_REVISION],
    [headMriOnlyTeachingPacket(),HEAD_MRI_ONLY_TEACHING_REVISION],
    [headOrbitalTeachingPacket(),HEAD_ORBITAL_TEACHING_REVISION],
    [headCtBoneTeachingPacket(),HEAD_CT_BONE_TEACHING_REVISION],
  ] as const)assert.equal(sha(older),pin);
  assert.equal(await teaching.verifiedHeadCerebellarTeachingRevision(HEAD_LINK_REVISION),teaching.HEAD_CEREBELLAR_TEACHING_REVISION);
  assert.equal(await teaching.verifiedHeadCerebellarTeachingRevision('stale'),null);
  assert.equal(Object.hasOwn(teaching,'headCerebellarTeachingForReference'),false);
  for(const note of content.notes){
    const binding=links.headImageConceptById(note.conceptId);assert(binding);
    assert.equal(binding.atlasHref,undefined);assert.equal(headConceptById(note.conceptId),null);
    assert.equal(note.anatomy.text.length>20,true);assert.equal(note.function.text.length>20,true);
    assert.equal(note.task.length>20,true);
    const sourceIds=new Set([...note.anatomy.sources,...note.function.sources]);
    assert(sourceIds.size>0);
    for(const id of sourceIds){const source=content.sources.find(item=>item.id===id);assert(source);assert.match(new URL(source.url).hostname,/\.edu$/);assert.match(source.reuse,/no source prose|original summary/i);}
    for(const modality of ['CT','MRI'] as const){
      const value=teaching.headCerebellarTeachingForConcept(note.conceptId,modality,HEAD_LINK_REVISION);assert(value);
      assert.equal(value.note,note);assert.equal(value.imaging,content.imaging[modality]);
      assert.equal(value.concept.conceptId,note.conceptId);assert.equal(value.concept.atlasHref,undefined);
    }
  }
  assert.equal(content.imaging.CT.text.length>20,true);assert.equal(content.imaging.MRI.text.length>20,true);
  assert.match(content.scope,/unregistered|separate/);
  assert.match(content.imaging.MRI.text,/partial|vermis/i);
  assert.doesNotMatch(JSON.stringify(packet),/https?:\/\/[^" ]+\.(?:png|jpe?g|svg|gif|webp|mp4|pdf)|data:image|atlasHref/i);
});

test('lookup refuses stale revision, wrong modality and unrelated concepts',()=>{
  let placements=0;
  for(const id of ids)for(const modality of ['CT','MRI'] as const){
    assert(teaching.headCerebellarTeachingForConcept(id,modality,HEAD_LINK_REVISION));placements++;
    assert.equal(teaching.headCerebellarTeachingForConcept(id,modality,'changed'),null);
  }
  assert.equal(placements,6);
  for(const id of [...ids,'brainstem-pons','cerebellum','unknown']){
    assert.equal(teaching.headCerebellarTeachingForConcept(id,'US' as 'CT',HEAD_LINK_REVISION),null);
  }
  for(const id of ['brainstem-pons','cerebellum','unknown'])assert.equal(teaching.headCerebellarTeachingForConcept(id,'CT',HEAD_LINK_REVISION),null);
});

test('verifier refuses changed comparison, binding, and teaching content',async()=>{
  const isolated=(linkOverrides:Partial<typeof links>={},comparisonOverrides:Partial<typeof comparison>={})=>compile('../lib/head-cerebellar-teaching.ts',{
    './head-image-only-links.ts':{...links,...linkOverrides},
    './head-image-only-comparison-review.ts':{...comparison,...comparisonOverrides},
  }) as typeof teaching;
  assert.equal(await isolated({},{verifiedHeadImageOnlyComparisonPacket:async()=>null}).verifiedHeadCerebellarTeachingRevision(HEAD_LINK_REVISION),null);
  assert.equal(await isolated({headImageConceptById:()=>null}).verifiedHeadCerebellarTeachingRevision(HEAD_LINK_REVISION),null);
  for(const key of ['ctHref','mriHref','headRevision','scopeNote'] as const){
    const changed=isolated({headImageConceptById:id=>{const link=links.headImageConceptById(id);return link?{...link,[key]:'changed'}:null;}});
    assert.equal(await changed.verifiedHeadCerebellarTeachingRevision(HEAD_LINK_REVISION),null,key);
  }
  for(const key of ['atlasHref','conceptId'] as const){
    const changed=isolated({headImageConceptById:id=>{const link=links.headImageConceptById(id);return link?{...link,[key]:key==='atlasHref'?'/atlas/head-neck-3d':'other'}:null;}});
    assert.equal(await changed.verifiedHeadCerebellarTeachingRevision(HEAD_LINK_REVISION),null,key);
  }
  const changed=isolated();
  (changed.headCerebellarTeachingContent.notes[0].anatomy as {text:string}).text+=' edited';
  assert.equal(await changed.verifiedHeadCerebellarTeachingRevision(HEAD_LINK_REVISION),null);
  assert.equal(await teaching.verifiedHeadCerebellarTeachingRevision(HEAD_LINK_REVISION),teaching.HEAD_CEREBELLAR_TEACHING_REVISION);
});

test('native component shows only exact CT/MRI notes; generic reference stays empty',()=>{
  const native=compile('../components/HeadAtlasTeaching.tsx') as {HeadAtlasTeaching:React.ComponentType<any>};
  const reference=compile('../components/HeadAtlasReferenceTeaching.tsx') as {HeadAtlasReferenceTeaching:React.ComponentType<any>};
  for(const note of content.notes){
    for(const modality of ['CT','MRI'] as const){
      const html=renderToStaticMarkup(React.createElement(native.HeadAtlasTeaching,{conceptId:note.conceptId,modality,revision:HEAD_LINK_REVISION}));
      assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));assert(html.includes(note.task.replaceAll("'",'&#x27;')));
      assert(html.includes(content.imaging[modality].text));assert(!html.includes(content.imaging[modality==='CT'?'MRI':'CT'].text));
      assert(html.includes(teaching.HEAD_CEREBELLAR_TEACHING_REVISION));
      assert.equal(renderToStaticMarkup(React.createElement(native.HeadAtlasTeaching,{conceptId:note.conceptId,modality,revision:'changed'})),'');
    }
    assert.equal(renderToStaticMarkup(React.createElement(reference.HeadAtlasReferenceTeaching,{conceptId:note.conceptId,revision:HEAD_LINK_REVISION})), '');
  }
});

test('comparison Review shows notes only for exact teaching revision, preserving decisions',()=>{
  const native=compile('../components/HeadAtlasTeaching.tsx') as {HeadAtlasTeaching:React.ComponentType<any>};
  const panel=compile('../components/HeadPairedDecisionPanel.tsx',{'./HeadPairedDecisionForm':{HeadPairedDecisionForm:()=>null}});
  const review=compile('../components/HeadImageOnlyComparisonReview.tsx',{
    './HeadAtlasTeaching':native,
    './HeadPairedDecisionPanel':panel,
    './HeadReviewImageLink':headReviewImageLinkModule,
  }) as {HeadImageOnlyComparisonReview:React.ComponentType<any>};
  const packet=links.headImageOnlyComparisonPacket();
  for(const teachingRevision of [undefined,null,'stale',teaching.HEAD_CEREBELLAR_TEACHING_REVISION]){
    const html=renderToStaticMarkup(React.createElement(review.HeadImageOnlyComparisonReview,{packet,teachingRevision}));
    const showsNotes=teachingRevision===teaching.HEAD_CEREBELLAR_TEACHING_REVISION;
    for(const item of packet.bindings){
      assert(html.includes(`Inspect ${links.headImageConceptById(item.conceptId)!.label} in CT`));
      assert(html.includes(`Inspect ${links.headImageConceptById(item.conceptId)!.label} in MRI`));
      assert(html.includes(`head-image-only-comparison-${item.conceptId}`));
    }
    assert.equal(html.includes(content.imaging.CT.text),showsNotes);
    assert.equal(html.includes(content.imaging.MRI.text),showsNotes);
    assert(!html.includes('/atlas/head-neck-3d'));
    assert.doesNotMatch(html,/<form|<input/);
  }
  const unavailable=renderToStaticMarkup(React.createElement(review.HeadImageOnlyComparisonReview,{packet:null,teachingRevision:teaching.HEAD_CEREBELLAR_TEACHING_REVISION}));
  assert.match(unavailable,/comparisons unavailable/i);
  assert(!unavailable.includes(content.imaging.CT.text));assert(!unavailable.includes(content.imaging.MRI.text));
  assert(!unavailable.includes('Inspect Left cerebellar hemisphere'));
});

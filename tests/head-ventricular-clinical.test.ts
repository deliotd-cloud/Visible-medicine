import assert from 'node:assert/strict';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket} from '../lib/head-atlas-learning.ts';
import {BRAINSTEM_CLINICAL_REVISION,brainstemClinicalPacket} from '../lib/head-brainstem-clinical.ts';
import {VENTRICULAR_CLINICAL_REVISION,ventricularClinicalContent,ventricularClinicalPacket,ventricularClinicalForConcept} from '../lib/head-ventricular-clinical.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';
import {facialAwareRequire} from './head-facial-hook-loader.ts';

const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const escapedHref=(href:string)=>`href="${href.replaceAll('&','&amp;')}"`;
const require=createRequire(import.meta.url);
const componentRequire=facialAwareRequire(require);
function component(file:string):React.ComponentType<any>{
 const code=ts.transpileModule(readFileSync(new URL(`../components/${file}.tsx`,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const mod={exports:{} as Record<string,React.ComponentType<any>>};
 new Function('require','module','exports',code)((id:string)=>id==='./HeadReviewImageLink'?headReviewImageLinkModule:id.startsWith('../lib/')?require(id.endsWith('.ts')?id:id+'.ts'):id==='./HeadTeachingReviewNavigator'?{HeadTeachingReviewNavigator:component('HeadTeachingReviewNavigator')}:id==='./HeadAnatomyCheck'?headAnatomyCheckModule:componentRequire(id),mod,mod.exports);
 return mod.exports[file];
}
const Teaching=component('HeadAtlasTeaching'),Reference=component('HeadAtlasReferenceTeaching'),Review=component('HeadAtlasTeachingReview');
const ids=['ventricle-left-lateral','ventricle-right-lateral','ventricle-third','ventricle-fourth'];

test('ventricular clinical packet is exact, separate and unapproved without changing existing packet identities',()=>{
 const packet=ventricularClinicalPacket();
 assert.equal(sha(packet),VENTRICULAR_CLINICAL_REVISION);
 assert.equal(packet.content.status,'draft');
 assert.equal(packet.content.clinicalApproval,false);
 assert.equal(packet.content.publicationApproval,false);
 assert.equal(packet.content.patientRegistration,false);
 assert.deepEqual(packet.content.notes.map(note=>note.conceptId),ids);
 assert.equal(packet.bindings.length,ids.length);
 for(let index=0;index<ids.length;index++){
  const binding=packet.bindings[index];
  assert.equal(binding?.conceptId,ids[index]);
  assert(binding?.atlasHref&&binding.ctHref&&binding.mriHref);
  assert.equal(binding.headRevision,HEAD_LINK_REVISION);
 }
 for(const part of ['text','caution','answer'] as const){
  const changed={...packet,content:{...packet.content,notes:packet.content.notes.map((note,index)=>index===0?{...note,[part]:note[part]+' change'}:note)}};
  assert.notEqual(sha(changed),VENTRICULAR_CLINICAL_REVISION);
 }
 assert.equal(BRAINSTEM_CLINICAL_REVISION,'1ec8a673d43cf47c77ec5dc3c3815b879960c02dccdfe703b3053eff69f4103d');
 assert.equal(HEAD_TEACHING_REVISION,'2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a');
 assert.equal(HEAD_LEARNING_REVISION,'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');
 assert.equal(sha(brainstemClinicalPacket()),BRAINSTEM_CLINICAL_REVISION);
 assert.equal(sha(headTeachingPacket()),HEAD_TEACHING_REVISION);
 assert.equal(sha(headLearningPacket()),HEAD_LEARNING_REVISION);
});

test('only exact ventricular concepts, native modalities and current revision resolve clinical teaching',()=>{
 for(const note of ventricularClinicalContent.notes)for(const modality of ['CT','MRI'] as const){
  const item=ventricularClinicalForConcept(note.conceptId,modality,HEAD_LINK_REVISION);
  assert(item);
  assert.equal(item.note,note);
  assert.equal(item.imaging,ventricularClinicalContent.imaging[modality]);
  assert.equal(item.revision,VENTRICULAR_CLINICAL_REVISION);
  for(const id of [...note.sources,...item.imaging.sources])assert(item.sources.some(source=>source.id===id));
  const html=renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:HEAD_LINK_REVISION}));
  for(const text of [note.text,note.caution,note.question,note.answer,item.imaging.text,VENTRICULAR_CLINICAL_REVISION])assert(html.includes(text));
  assert.match(html,/<details><summary>Clinical correlation/);
  assert.match(html,/<details><summary>Reveal explanation/);
  assert.match(html,/no score or completion recorded/);
  assert(!html.includes('checked=""'));
  assert(!html.includes(BRAINSTEM_CLINICAL_REVISION));
 }
 for(const [id,mode,revision] of [
  ['ventricle-third','US',HEAD_LINK_REVISION],
  ['ventricle-third','MRI','0'.repeat(64)],
  ['brainstem-pons','CT',HEAD_LINK_REVISION],
  ['unknown','CT',HEAD_LINK_REVISION],
 ])assert.equal(ventricularClinicalForConcept(id,mode as 'CT',revision),null);
 const stale=renderToStaticMarkup(React.createElement(Teaching,{conceptId:'ventricle-third',modality:'MRI',revision:'stale'}));
 assert(!stale.includes(VENTRICULAR_CLINICAL_REVISION));
});

test('existing 3D reference exposes the same ventricular note with separate CT and MRI pitfalls',()=>{
 for(const note of ventricularClinicalContent.notes){
  const html=renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:HEAD_LINK_REVISION}));
  for(const text of [note.text,note.caution,note.question,note.answer,ventricularClinicalContent.imaging.CT.text,ventricularClinicalContent.imaging.MRI.text,VENTRICULAR_CLINICAL_REVISION])assert(html.includes(text));
  assert.match(html,/<details><summary>Clinical correlation/);
  assert.match(html,/<details><summary>Reveal explanation/);
  assert(!html.includes(BRAINSTEM_CLINICAL_REVISION));
 }
 const stale=renderToStaticMarkup(React.createElement(Reference,{conceptId:'ventricle-third',revision:'stale'}));
 assert(!stale.includes(VENTRICULAR_CLINICAL_REVISION));
});

test('protected review renders the separate ventricular packet and withholds it on stale source',()=>{
 const html=renderToStaticMarkup(React.createElement(Review,{revision:HEAD_LINK_REVISION}));
 assert(html.includes('id="ventricular-clinical-review"'));
 assert(html.includes('id="brainstem-clinical-review"'));
 assert(html.includes(VENTRICULAR_CLINICAL_REVISION));
 assert(html.includes(BRAINSTEM_CLINICAL_REVISION));
 const ventricularSection=html.slice(html.indexOf('id="ventricular-clinical-review"'),html.indexOf('id="head-guided-review"'));
 assert.equal([...ventricularSection.matchAll(/>Inspect ventricular 3D target<\/a>/g)].length,ids.length);
 for(const note of ventricularClinicalContent.notes){assert(html.includes(note.text));assert(html.includes(note.answer));}
 for(const note of ventricularClinicalContent.notes){
  const ct=headImageHref('CT',note.conceptId,null,HEAD_LINK_REVISION);
  const mri=headImageHref('MRI',note.conceptId,null,HEAD_LINK_REVISION);
  const atlas=ventricularClinicalForConcept(note.conceptId,'CT',HEAD_LINK_REVISION)?.binding.atlasHref;
  assert(ct&&mri&&atlas);
  for(const href of [ct,mri,atlas])assert(ventricularSection.includes(escapedHref(href)));
 }
 for(const source of ventricularClinicalContent.sources){assert(html.includes(source.url));assert(html.includes(source.evidence));}
 const stale=renderToStaticMarkup(React.createElement(Review,{revision:'stale'}));
 assert(!stale.includes(VENTRICULAR_CLINICAL_REVISION));
 assert(!stale.includes(ventricularClinicalContent.notes[0].text));
});

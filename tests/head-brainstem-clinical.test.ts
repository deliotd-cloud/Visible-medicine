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
import {BRAINSTEM_CLINICAL_REVISION,brainstemClinicalContent,brainstemClinicalPacket,brainstemClinicalForConcept} from '../lib/head-brainstem-clinical.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';
import {facialAwareRequire} from './head-facial-hook-loader.ts';

const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const require=createRequire(import.meta.url);
const componentRequire=facialAwareRequire(require);
function component(file:string):React.ComponentType<any>{
 const code=ts.transpileModule(readFileSync(new URL(`../components/${file}.tsx`,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const mod={exports:{} as Record<string,React.ComponentType<any>>};
 new Function('require','module','exports',code)((id:string)=>id==='./HeadReviewImageLink'?headReviewImageLinkModule:id.startsWith('../lib/')?require(id.endsWith('.ts')?id:id+'.ts'):id==='./HeadTeachingReviewNavigator'?{HeadTeachingReviewNavigator:component('HeadTeachingReviewNavigator')}:id==='./HeadAnatomyCheck'?headAnatomyCheckModule:componentRequire(id),mod,mod.exports);
 return mod.exports[file];
}
const Teaching=component('HeadAtlasTeaching'),Review=component('HeadAtlasTeachingReview');

test('clinical extension hashes facts, sources, questions, limitations and exact bindings without changing existing packets',()=>{
 const packet=brainstemClinicalPacket();assert.equal(sha(packet),BRAINSTEM_CLINICAL_REVISION);
 assert.equal(packet.content.status,'draft');assert.equal(packet.content.clinicalApproval,false);assert.equal(packet.content.publicationApproval,false);assert.equal(packet.content.patientRegistration,false);
 assert.equal(packet.bindings.length,3);for(const binding of packet.bindings){assert(binding?.atlasHref&&binding.ctHref&&binding.mriHref);assert.equal(binding.headRevision,HEAD_LINK_REVISION);}
 for(const part of ['text','caution','answer'] as const){const changed={...packet,content:{...packet.content,notes:packet.content.notes.map((note,index)=>index===0?{...note,[part]:note[part]+' change'}:note)}};assert.notEqual(sha(changed),BRAINSTEM_CLINICAL_REVISION);}
 assert.equal(HEAD_TEACHING_REVISION,'2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a');assert.equal(sha(headTeachingPacket()),HEAD_TEACHING_REVISION);
 assert.equal(HEAD_LEARNING_REVISION,'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');assert.equal(sha(headLearningPacket()),HEAD_LEARNING_REVISION);
});

test('only exact brainstem concepts and CT/MRI revisions expose original clinical drafts with scoped references',()=>{
 for(const note of brainstemClinicalContent.notes)for(const modality of ['CT','MRI'] as const){
  const item=brainstemClinicalForConcept(note.conceptId,modality,HEAD_LINK_REVISION);assert(item);
  assert.equal(item.note,note);assert.equal(item.imaging,brainstemClinicalContent.imaging[modality]);
  for(const id of [...note.sources,...item.imaging.sources])assert(item.sources.some(source=>source.id===id));
  assert.match(item.scope,/not findings in the displayed scans/);assert.match(item.scope,/unregistered/);
  const html=renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality,revision:HEAD_LINK_REVISION}));
  for(const text of [note.text,note.caution,note.question,note.answer,item.imaging.text,BRAINSTEM_CLINICAL_REVISION])assert(html.includes(text));
  assert.match(html,/<details><summary>Clinical correlation/);assert.match(html,/<details><summary>Reveal explanation/);
  assert.match(html,/no score or completion recorded/);assert(!html.includes('checked=""'));
 }
 for(const [id,mode,revision] of [['brainstem-pons','US',HEAD_LINK_REVISION],['brainstem-pons','MRI','0'.repeat(64)],['ventricle-third','CT',HEAD_LINK_REVISION],['unknown','CT',HEAD_LINK_REVISION]])assert.equal(brainstemClinicalForConcept(id,mode as 'CT',revision),null);
 const html=renderToStaticMarkup(React.createElement(Teaching,{conceptId:'ventricle-third',modality:'MRI',revision:HEAD_LINK_REVISION}));assert(!html.includes(BRAINSTEM_CLINICAL_REVISION));
});

test('protected review body exposes a separate unapproved packet and withholds it for stale source',()=>{
 const html=renderToStaticMarkup(React.createElement(Review,{revision:HEAD_LINK_REVISION}));
 assert(html.includes('id="brainstem-clinical-review"'));assert(html.includes(BRAINSTEM_CLINICAL_REVISION));assert.match(html,/anatomy-notes form does not save a decision for this packet/);
 for(const note of brainstemClinicalContent.notes){assert(html.includes(note.text));assert(html.includes(note.answer));}
 for(const source of brainstemClinicalContent.sources){assert(html.includes(source.url));assert(html.includes(source.evidence));}
 const stale=renderToStaticMarkup(React.createElement(Review,{revision:'stale'}));assert(!stale.includes(BRAINSTEM_CLINICAL_REVISION));assert(!stale.includes(brainstemClinicalContent.notes[0].text));
});

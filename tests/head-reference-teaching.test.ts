import assert from 'node:assert/strict';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {headAnatomyCheckForConcept} from '../lib/head-anatomy-checks.ts';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import * as teaching from '../lib/head-atlas-teaching.ts';
import * as mriTeaching from '../lib/head-mri-only-teaching.ts';
import * as insulaTeaching from '../lib/head-insula-teaching.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {brainstemClinicalContent,brainstemClinicalForConcept,BRAINSTEM_CLINICAL_REVISION} from '../lib/head-brainstem-clinical.ts';
import {ventricularClinicalForConcept} from '../lib/head-ventricular-clinical.ts';
import {deepGreyClinicalForConcept} from '../lib/head-deep-grey-clinical.ts';
import {lobarClinicalForConcept} from '../lib/head-lobar-clinical.ts';
import {hippocampalClinicalForConcept} from '../lib/head-hippocampal-clinical.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const source=readFileSync(new URL('../components/HeadAtlasReferenceTeaching.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{} as {HeadAtlasReferenceTeaching:React.ComponentType<{conceptId:string;revision:string}>}};
new Function('require','module','exports',compiled)((id:string)=>id==='../lib/head-atlas-teaching'?teaching:id==='../lib/head-mri-only-teaching'?mriTeaching:id==='../lib/head-insula-teaching'?insulaTeaching:id==='../lib/head-orbital-teaching'?require('../lib/head-orbital-teaching.ts'):id==='../lib/head-ct-bone-teaching'?require('../lib/head-ct-bone-teaching.ts'):id==='./HeadAnatomyCheck'?headAnatomyCheckModule:require(id),mod,mod.exports);
const render=(conceptId:string,revision=HEAD_LINK_REVISION)=>renderToStaticMarkup(React.createElement(mod.exports.HeadAtlasReferenceTeaching,{conceptId,revision}));

test('MRI-only linked 3D reference exposes common facts, not MRI observation tasks',()=>{
  for(const note of mriTeaching.headMriOnlyTeachingContent.notes){
    const html=render(note.conceptId);
    assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));
    assert(html.includes(mriTeaching.HEAD_MRI_ONLY_TEACHING_REVISION));
    assert(!html.includes(note.imaging.text));assert(!html.includes(note.task));
    assert(!html.includes('MRI · reading the image'));
    assert.equal(render(note.conceptId,'stale'),'');
  }
});

test('all twenty-five exact linked concepts render only their common reference teaching',()=>{
  const packet=teaching.headTeachingPacket();
  assert.equal(packet.content.notes.length,25);
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),teaching.HEAD_TEACHING_REVISION);
  for(const note of packet.content.notes){
    const value=teaching.headTeachingForReference(note.conceptId,HEAD_LINK_REVISION);
    assert(value,`missing ${note.conceptId}`);
    assert.equal(value.concept.conceptId,note.conceptId);
    assert.deepEqual(value.anatomy,note.anatomy);
    assert.deepEqual(value.function,note.function);
    assert.equal(value.scope,packet.content.groups[note.group].scope);
    assert.equal(value.revision,teaching.HEAD_TEACHING_REVISION);
    const expectedIds=new Set<string>([...note.anatomy.sources,...note.function.sources]);
    assert.deepEqual(value.sources.map(source=>source.id),packet.content.sources.filter(source=>expectedIds.has(source.id)).map(source=>source.id));
    const html=render(note.conceptId);
    assert(html.includes(`aria-label="${value.concept.label} linked teaching draft"`));
    assert(html.includes(`${value.concept.label} · linked anatomy draft`));
    assert(html.includes('fixed linked focus or tour step'));
    assert(html.includes('later selections inside the model do not change it'));
    assert(html.includes(value.scope));
    assert(html.includes(note.anatomy.text));
    assert(html.includes(note.function.text));
    assert(html.includes('Anatomy &amp; relationships'));
    assert(html.includes('<h3>Function</h3>'));
    assert(html.includes('References &amp; review revision'));
    assert(html.includes('Original summaries'));
    assert(html.includes('No external figures or datasets were imported'));
    assert(html.includes(teaching.HEAD_TEACHING_REVISION));
    assert(html.includes('awaiting radiologist review'));
    assert(!html.includes('<details open'));
    assert(!html.includes(note.task));
    for(const group of Object.values(packet.content.groups))for(const imaging of Object.values(group.imaging))assert(!html.includes(imaging.text));
    for(const referenced of value.sources){
      assert(html.includes(`href="${referenced.url}"`));
      assert(html.includes(referenced.title));
    }
    const clinical=brainstemClinicalForConcept(note.conceptId,'CT',HEAD_LINK_REVISION)??ventricularClinicalForConcept(note.conceptId,'CT',HEAD_LINK_REVISION)??deepGreyClinicalForConcept(note.conceptId,'CT',HEAD_LINK_REVISION)??lobarClinicalForConcept(note.conceptId,'CT',HEAD_LINK_REVISION)??hippocampalClinicalForConcept(note.conceptId,'CT',HEAD_LINK_REVISION),mriClinical=brainstemClinicalForConcept(note.conceptId,'MRI',HEAD_LINK_REVISION)??ventricularClinicalForConcept(note.conceptId,'MRI',HEAD_LINK_REVISION)??deepGreyClinicalForConcept(note.conceptId,'MRI',HEAD_LINK_REVISION)??lobarClinicalForConcept(note.conceptId,'MRI',HEAD_LINK_REVISION)??hippocampalClinicalForConcept(note.conceptId,'MRI',HEAD_LINK_REVISION);
    const clinicalSources=clinical&&mriClinical?[...new Map([...clinical.sources,...mriClinical.sources].map(source=>[source.id,source])).values()]:[];
    for(const cited of clinicalSources)assert(html.includes(`href="${cited.url.replaceAll('&','&amp;')}"`),`clinical source link ${cited.id}`);
    const clinicalCount=clinicalSources.length;
    const questionSourceCount=headAnatomyCheckForConcept(note.conceptId,HEAD_LINK_REVISION)?.sources.length??0;
    assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,value.sources.length+clinicalCount+questionSourceCount);
    for(const other of packet.content.sources.filter(item=>!expectedIds.has(item.id)))assert(!html.includes(other.url));
    assert(!html.includes('bakshi-2000'));
    assert(!html.includes('ostman-2020'));
  }
});

test('3D brainstem reference exposes the same clinical packet with distinct modality pitfalls and collapsed unscored reflections',()=>{
  for(const note of brainstemClinicalContent.notes){
    const html=render(note.conceptId);
    for(const text of [note.text,note.caution,note.question,note.answer,BRAINSTEM_CLINICAL_REVISION,
      brainstemClinicalContent.imaging.CT.text,brainstemClinicalContent.imaging.MRI.text])assert(html.includes(text));
    assert.match(html,/<h4>CT pitfall<\/h4>/);assert.match(html,/<h4>MRI pitfall<\/h4>/);
    assert.match(html,/not abnormalities demonstrated by this reference model/);
    assert.match(html,/no score or completion recorded/);assert(!html.includes('<details open'));
    assert(!render(note.conceptId,'0'.repeat(64)).includes(note.text));
  }
  assert(!render('ventricle-third').includes(BRAINSTEM_CLINICAL_REVISION));
});

test('unknown concepts and stale or malformed source revisions render nothing',()=>{
  for(const revision of ['','stale',HEAD_LINK_REVISION+'0']){
    assert.equal(render('brainstem-pons',revision),'');
    assert.equal(teaching.headTeachingForReference('brainstem-pons',revision),null);
  }
  for(const conceptId of ['brainstem','brainstem-pons-extra','deep-left-hippocampus','cortex-middle-frontal-lobe','cortex-left-frontal-extra','limbic-middle-hippocampus','<script>']){
    assert.equal(render(conceptId),'');
    assert.equal(teaching.headTeachingForReference(conceptId,HEAD_LINK_REVISION),null);
  }
  assert(!/localStorage|sessionStorage|fetch\(|postMessage|dangerouslySetInnerHTML/.test(source));
});

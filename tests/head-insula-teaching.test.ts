import assert from 'node:assert/strict';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as links from '../lib/head-atlas-links.ts';
import * as insulaTeaching from '../lib/head-insula-teaching.ts';
import {HEAD_INSULA_COMPARISON_REVISION,headInsulaComparisonPacket} from '../lib/head-insula-comparison-review.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,headMriOnlyTeachingPacket} from '../lib/head-mri-only-teaching.ts';
import {facialAwareRequire} from './head-facial-hook-loader.ts';

const require=createRequire(import.meta.url);
const componentRequire=facialAwareRequire(require);
const ids=['cortex-left-insula','cortex-right-insula'];
const source=readFileSync(new URL('../lib/head-insula-teaching.ts',import.meta.url),'utf8');

function isolated(headConceptById:typeof links.headConceptById){
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as typeof insulaTeaching};
  new Function('require','module','exports',compiled)((name:string)=>name==='./head-atlas-links.ts'?{...links,headConceptById}:name==='./HeadAnatomyCheck'?headAnatomyCheckModule:require(name),mod,mod.exports);
  return mod.exports;
}

test('independent insula teaching binds exactly two concepts and its own complete draft revision',async()=>{
  const packet=insulaTeaching.headInsulaTeachingPacket();
  assert.deepEqual(packet.content.notes.map(note=>note.conceptId),ids);
  assert.equal(packet.bindings.length,2);
  assert.equal(packet.content.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(packet.content.status,'draft');
  assert.equal(packet.content.clinicalApproval,false);
  assert.equal(packet.content.publicationApproval,false);
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),insulaTeaching.HEAD_INSULA_TEACHING_REVISION);
  assert.equal(await insulaTeaching.verifiedHeadInsulaTeachingRevision(links.HEAD_LINK_REVISION),insulaTeaching.HEAD_INSULA_TEACHING_REVISION);
  for(const stale of ['','stale',links.HEAD_LINK_REVISION+'0'])assert.equal(await insulaTeaching.verifiedHeadInsulaTeachingRevision(stale),null);
  const comparison=headInsulaComparisonPacket();
  for(const [index,note] of packet.content.notes.entries()){
    assert.deepEqual(packet.bindings[index],links.headConceptById(note.conceptId));
    assert.equal(packet.bindings[index]?.ctHref,comparison.items[index].binding?.ctHref);
    assert.equal(packet.bindings[index]?.mriHref,comparison.items[index].binding?.mriHref);
    assert(note.anatomy.text&&note.function.text&&note.task);
    assert(packet.content.imaging.CT.text&&packet.content.imaging.MRI.text);
    assert.notEqual(packet.content.imaging.CT.text,packet.content.imaging.MRI.text);
  }
  assert.match(packet.content.scope,/partial|regional/i);
  assert.match(packet.content.scope,/unregistered|separate/i);
  assert.match(packet.content.imaging.MRI.text,/partial|regional/i);
  assert.match(packet.content.imaging.CT.text,/mask neither diagnoses nor excludes|general teaching/i);
  assert.notEqual(insulaTeaching.HEAD_INSULA_TEACHING_REVISION,HEAD_INSULA_COMPARISON_REVISION);
  assert.notEqual(insulaTeaching.HEAD_INSULA_TEACHING_REVISION,HEAD_TEACHING_REVISION);
  assert.notEqual(insulaTeaching.HEAD_INSULA_TEACHING_REVISION,HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(comparison)).digest('hex'),HEAD_INSULA_COMPARISON_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(headTeachingPacket())).digest('hex'),HEAD_TEACHING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(headMriOnlyTeachingPacket())).digest('hex'),HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(headTeachingPacket().content.notes.length,25);
  assert.equal(headMriOnlyTeachingPacket().content.notes.length,4);
  assert(!/patientId|scanId|filePath|pixels|coordinates/i.test(JSON.stringify(packet)));
});

test('native teaching accepts only exact concept, source revision and CT or MRI modality',()=>{
  for(const note of insulaTeaching.headInsulaTeachingContent.notes){
    for(const modality of ['CT','MRI'] as const){
      const value=insulaTeaching.headInsulaTeachingForConcept(note.conceptId,modality,links.HEAD_LINK_REVISION);assert(value);
      assert.equal(value.note,note);
      assert.equal(value.revision,insulaTeaching.HEAD_INSULA_TEACHING_REVISION);
      assert.deepEqual(value.imaging,insulaTeaching.headInsulaTeachingContent.imaging[modality]);
      assert.equal(value.concept.conceptId,note.conceptId);
      assert(value.sources.length>0);
      assert.equal(insulaTeaching.headInsulaTeachingForConcept(note.conceptId,modality,'stale'),null);
    }
    assert.equal(insulaTeaching.headInsulaTeachingForConcept(note.conceptId,'US' as 'CT',links.HEAD_LINK_REVISION),null);
  }
  for(const id of ['unknown','cortex-middle-insula','cortex-left-insula-extra','limbic-left-amygdala']){
    assert.equal(insulaTeaching.headInsulaTeachingForConcept(id,'CT',links.HEAD_LINK_REVISION),null);
    assert.equal(insulaTeaching.headInsulaTeachingForReference(id,links.HEAD_LINK_REVISION),null);
  }
});

test('generic 3D reference exposes anatomy and function, never native imaging or exercise',()=>{
  for(const note of insulaTeaching.headInsulaTeachingContent.notes){
    const value=insulaTeaching.headInsulaTeachingForReference(note.conceptId,links.HEAD_LINK_REVISION);assert(value);
    assert.deepEqual(value.anatomy,note.anatomy);
    assert.deepEqual(value.function,note.function);
    assert.equal(value.revision,insulaTeaching.HEAD_INSULA_TEACHING_REVISION);
    assert.equal('imaging'in value,false);
    assert.equal('task'in value,false);
    const sourceIds=new Set([...note.anatomy.sources,...note.function.sources]);
    assert.deepEqual(value.sources.map(item=>item.id),insulaTeaching.headInsulaTeachingContent.sources.filter(item=>sourceIds.has(item.id)).map(item=>item.id));
    assert.equal(insulaTeaching.headInsulaTeachingForReference(note.conceptId,'stale'),null);
  }
});

test('verifier withholds edited or missing binding without changing the current teaching packet',async()=>{
  for(const change of [
    (link:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...link,ctHref:'/atlas/ct-head?concept=wrong'}),
    (link:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...link,mriHref:'/atlas/mri-head?concept=wrong'}),
    (link:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...link,scopeNote:link.scopeNote+' changed'}),
    (link:NonNullable<ReturnType<typeof links.headConceptById>>)=>({...link,headRevision:'stale'}),
  ]){
    const changed=isolated(id=>{const link=links.headConceptById(id);return link&&id===ids[0]?change(link):link;});
    assert.equal(await changed.verifiedHeadInsulaTeachingRevision(links.HEAD_LINK_REVISION),null);
  }
  const absent=isolated(id=>id===ids[0]?null:links.headConceptById(id));
  assert.equal(await absent.verifiedHeadInsulaTeachingRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await insulaTeaching.verifiedHeadInsulaTeachingRevision(links.HEAD_LINK_REVISION),insulaTeaching.HEAD_INSULA_TEACHING_REVISION);
});

test('existing reference and native teaching fallbacks expose only the two exact insula notes',()=>{
  function component(name:string){
    const code=ts.transpileModule(readFileSync(new URL(`../components/${name}.tsx`,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
    const mod={exports:{} as Record<string,React.ComponentType<any>>};
    new Function('require','module','exports',code)((id:string)=>id==='../lib/head-atlas-teaching'?require('../lib/head-atlas-teaching.ts'):id==='../lib/head-mri-only-teaching'?require('../lib/head-mri-only-teaching.ts'):id==='../lib/head-insula-teaching'?insulaTeaching:id==='../lib/head-orbital-teaching'?require('../lib/head-orbital-teaching.ts'):id==='../lib/head-ct-bone-teaching'?require('../lib/head-ct-bone-teaching.ts'):id==='../lib/head-cerebellar-teaching'?require('../lib/head-cerebellar-teaching.ts'):id==='./HeadAnatomyCheck'?headAnatomyCheckModule:componentRequire(id),mod,mod.exports);
    return mod.exports[name];
  }
  const Native=component('HeadAtlasTeaching'),Reference=component('HeadAtlasReferenceTeaching');
  for(const note of insulaTeaching.headInsulaTeachingContent.notes){
    for(const modality of ['CT','MRI'] as const){
      const html=renderToStaticMarkup(React.createElement(Native,{conceptId:note.conceptId,modality,revision:links.HEAD_LINK_REVISION}));
      assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));assert(html.includes(insulaTeaching.headInsulaTeachingContent.imaging[modality].text));assert(html.includes(note.task.replaceAll("'",'&#x27;')));
      assert(!html.includes(insulaTeaching.headInsulaTeachingContent.imaging[modality==='CT'?'MRI':'CT'].text));
      assert(html.includes(insulaTeaching.HEAD_INSULA_TEACHING_REVISION));
      assert.equal(renderToStaticMarkup(React.createElement(Native,{conceptId:note.conceptId,modality,revision:'stale'})),'');
    }
    const html=renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:links.HEAD_LINK_REVISION}));
    assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));assert(!html.includes(insulaTeaching.headInsulaTeachingContent.imaging.CT.text));assert(!html.includes(insulaTeaching.headInsulaTeachingContent.imaging.MRI.text));assert(!html.includes(note.task));
    assert(html.includes(insulaTeaching.HEAD_INSULA_TEACHING_REVISION));
    assert.equal(renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:'stale'})),'');
  }
});

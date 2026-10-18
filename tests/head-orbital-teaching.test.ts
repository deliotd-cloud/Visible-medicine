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
import * as teaching from '../lib/head-orbital-teaching.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as comparison from '../lib/head-orbital-comparison-review.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_INSULA_TEACHING_REVISION,headInsulaTeachingPacket} from '../lib/head-insula-teaching.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,headMriOnlyTeachingPacket} from '../lib/head-mri-only-teaching.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=facialAwareRequire(createRequire(import.meta.url)),sha=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const content=teaching.headOrbitalTeachingContent,revision=links.HEAD_LINK_REVISION;
function compile(path:string,imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{}};
  const load=(id:string):unknown=>imports[id]??(id.startsWith('../lib/')?require(id.endsWith('.ts')?id:id+'.ts'):id==='./HeadAnatomyCheck'?headAnatomyCheckModule:require(id));
  new Function('require','module','exports',code)(load,mod,mod.exports);return mod.exports;
}

test('two original source-backed notes have an independent comparison-bound draft digest',async()=>{
  const packet=teaching.headOrbitalTeachingPacket();
  assert.deepEqual(content.notes.map(n=>n.conceptId),['orbit-left-globe','orbit-right-globe']);
  assert.equal(content.comparisonRevision,comparison.HEAD_ORBITAL_COMPARISON_REVISION);
  assert.equal(content.headRevision,revision);assert.equal(content.status,'draft');assert.equal(content.reviewedAt,null);
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  assert.equal(sha(packet),teaching.HEAD_ORBITAL_TEACHING_REVISION);
  assert.equal(await teaching.verifiedHeadOrbitalTeachingRevision(revision),teaching.HEAD_ORBITAL_TEACHING_REVISION);
  assert.equal(await teaching.verifiedHeadOrbitalTeachingRevision('stale'),null);
  for(const note of content.notes){
    const ids=new Set([...note.anatomy.sources,...note.function.sources]);assert.equal(ids.size,2);
    for(const id of ids){const source=content.sources.find(s=>s.id===id);assert(source);assert.equal(new URL(source.url).hostname,'www.nei.nih.gov');assert.match(source.reuse,/no source prose/i);}
    assert.match(note.anatomy.text,/sclera|cornea/);assert.match(note.function.text,/photoreceptors|optic nerve/);
  }
  assert.match(content.imaging.MRI.text,/partial|regional portion/);assert.match(content.imaging.MRI.text,/actual MRI sequence/);
  assert.match(content.scope,/unregistered/);assert.match(content.imaging.CT.text,/does not separately/);
  // Existing clinical/teaching packet scopes are not silently extended.
  for(const [packet,pin] of [[comparison.headOrbitalComparisonPacket(),comparison.HEAD_ORBITAL_COMPARISON_REVISION],[headTeachingPacket(),HEAD_TEACHING_REVISION],[headInsulaTeachingPacket(),HEAD_INSULA_TEACHING_REVISION],[headMriOnlyTeachingPacket(),HEAD_MRI_ONLY_TEACHING_REVISION]] as const)assert.equal(sha(packet),pin);
});

test('native notes reject wrong source/modality/concept; generic teaching contains no scan exercise',()=>{
  for(const note of content.notes){
    for(const modality of ['CT','MRI'] as const){
      const current=teaching.headOrbitalTeachingForConcept(note.conceptId,modality,revision);assert(current);
      assert.equal(current.note,note);assert.equal(current.imaging,content.imaging[modality]);
      assert.equal(teaching.headOrbitalTeachingForConcept(note.conceptId,modality,'changed'),null);
    }
    assert.equal(teaching.headOrbitalTeachingForConcept(note.conceptId,'US' as 'CT',revision),null);
    const reference=teaching.headOrbitalTeachingForReference(note.conceptId,revision);assert(reference);
    assert(!('imaging'in reference));assert(!('task'in reference));
    assert.deepEqual(reference.anatomy,note.anatomy);assert.deepEqual(reference.function,note.function);
    assert.equal(teaching.headOrbitalTeachingForReference(note.conceptId,'changed'),null);
  }
  for(const id of ['orbit-left-lens','orbit-right-globe-extra','brainstem-pons','unknown']){
    assert.equal(teaching.headOrbitalTeachingForConcept(id,'CT',revision),null);assert.equal(teaching.headOrbitalTeachingForReference(id,revision),null);
  }
});

test('verifier rejects unavailable comparison, absent or altered binding and edited content',async()=>{
  const isolated=(sourceLinks:Partial<typeof links>,sourceComparison:Partial<typeof comparison>={})=>compile('../lib/head-orbital-teaching.ts',{'./head-atlas-links.ts':{...links,...sourceLinks},'./head-orbital-comparison-review.ts':{...comparison,...sourceComparison}}) as typeof teaching;
  assert.equal(await isolated({},{verifiedHeadOrbitalComparisonPacket:async()=>null}).verifiedHeadOrbitalTeachingRevision(revision),null);
  assert.equal(await isolated({headConceptById:()=>null}).verifiedHeadOrbitalTeachingRevision(revision),null);
  for(const key of ['ctHref','mriHref','headRevision','atlasHref','scopeNote'] as const){
    const changed=isolated({headConceptById:id=>{const b=links.headConceptById(id);return b?{...b,[key]:'changed'}:null;}});
    assert.equal(await changed.verifiedHeadOrbitalTeachingRevision(revision),null);
  }
  const changed=isolated({});(changed.headOrbitalTeachingContent.notes[0].anatomy as {text:string}).text+=' edited';
  assert.equal(await changed.verifiedHeadOrbitalTeachingRevision(revision),null);
  assert.equal(await teaching.verifiedHeadOrbitalTeachingRevision(revision),teaching.HEAD_ORBITAL_TEACHING_REVISION);
});

test('real native/reference/review components render correct separate notes and hide stale teaching',()=>{
  const native=compile('../components/HeadAtlasTeaching.tsx') as {HeadAtlasTeaching:React.ComponentType<any>};
  const reference=compile('../components/HeadAtlasReferenceTeaching.tsx') as {HeadAtlasReferenceTeaching:React.ComponentType<any>};
  const panel=compile('../components/HeadPairedDecisionPanel.tsx',{'./HeadPairedDecisionForm':{HeadPairedDecisionForm:()=>null}});
  const review=compile('../components/HeadOrbitalComparisonReview.tsx',{'./HeadAtlasTeaching':native,'./HeadPairedDecisionPanel':panel,'./HeadReviewImageLink':headReviewImageLinkModule}) as {HeadOrbitalComparisonReview:React.ComponentType<any>};
  for(const note of content.notes){
    for(const modality of ['CT','MRI'] as const){
      const html=renderToStaticMarkup(React.createElement(native.HeadAtlasTeaching,{conceptId:note.conceptId,modality,revision}));
      assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));assert(html.includes(content.imaging[modality].text));
      assert(!html.includes(content.imaging[modality==='CT'?'MRI':'CT'].text));assert(html.includes(teaching.HEAD_ORBITAL_TEACHING_REVISION));
      assert.equal(renderToStaticMarkup(React.createElement(native.HeadAtlasTeaching,{conceptId:note.conceptId,modality,revision:'changed'})),'');
    }
    const html=renderToStaticMarkup(React.createElement(reference.HeadAtlasReferenceTeaching,{conceptId:note.conceptId,revision}));
    assert(html.includes(note.anatomy.text));assert(html.includes(note.function.text));assert(!html.includes(content.imaging.CT.text));assert(!html.includes(content.imaging.MRI.text));
    assert(!html.includes('Compare two neighbouring slices'));
  }
  for(const teachingRevision of [undefined,null,'stale',teaching.HEAD_ORBITAL_TEACHING_REVISION]){
    const html=renderToStaticMarkup(React.createElement(review.HeadOrbitalComparisonReview,{packet:comparison.headOrbitalComparisonPacket(),teachingRevision}));
    assert(html.includes('Inspect Left globe in CT'));
    assert.equal(html.includes(content.imaging.CT.text),teachingRevision===teaching.HEAD_ORBITAL_TEACHING_REVISION);
    assert.equal(html.includes(content.imaging.MRI.text),teachingRevision===teaching.HEAD_ORBITAL_TEACHING_REVISION);
    assert.doesNotMatch(html,/<form|<input/);
    for(const item of comparison.headOrbitalComparisonPacket().items)assert(html.includes(`Review ${item.binding!.label} comparison`));
  }
});

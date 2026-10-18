import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as teaching from '../lib/head-ct-bone-teaching.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as comparison from '../lib/head-ct-bone-comparison-review.ts';
import {HEAD_CT_BONE_LEARNING_REVISION,headCtBoneLearningPacket} from '../lib/head-ct-bone-learning.ts';
import {HEAD_ORBITAL_TEACHING_REVISION,headOrbitalTeachingPacket} from '../lib/head-orbital-teaching.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';

const require=createRequire(import.meta.url),sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const content=teaching.headCtBoneTeachingContent,revision=links.HEAD_LINK_REVISION;
const ids=['bone-left-parietal','bone-right-parietal','bone-left-nasal','bone-right-nasal','bone-occipital','bone-ethmoid'];
function compile(imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL('../lib/head-ct-bone-teaching.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)((name:string)=>imports[name]??(name.startsWith('./')?require('../lib/'+name.slice(2).replace(/\.ts$/,'')+'.ts'):require(name)),mod,mod.exports);
  return mod.exports as typeof teaching;
}

test('six original CT-only notes are source-backed, short and independently pinned',async()=>{
  const packet=teaching.headCtBoneTeachingPacket(),comparisonPacket=comparison.headCtBoneComparisonPacket();
  assert.deepEqual(content.notes.map(note=>note.conceptId),ids);
  assert.deepEqual(packet.bindings,comparisonPacket.items.map(item=>item.binding));
  assert.equal(content.headRevision,revision);
  assert.equal(content.comparisonRevision,comparison.HEAD_CT_BONE_COMPARISON_REVISION);
  assert.equal(content.status,'draft');assert.equal(content.reviewedAt,null);
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  const derivedWords=content.notes.reduce((sum,note)=>sum+(note.anatomy.text+' '+note.function.text).trim().split(/\s+/).length,0);
  assert(derivedWords<=190,`anatomy/function derived words: ${derivedWords}`);
  assert.equal(derivedWords,138);
  assert.equal(content.sources.length,1);
  assert.equal(content.sources[0].url,'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull');
  assert.equal(content.sources[0].accessed,'2026-10-09');assert.match(content.sources[0].reuse,/no source prose/);
  for(const note of content.notes){
    assert.deepEqual(note.anatomy.sources,['openstax-skull']);assert.deepEqual(note.function.sources,['openstax-skull']);
    assert(note.task.length>30);
  }
  assert.equal(sha(packet),teaching.HEAD_CT_BONE_TEACHING_REVISION);
  assert.equal(await teaching.verifiedHeadCtBoneTeachingRevision(revision),teaching.HEAD_CT_BONE_TEACHING_REVISION);
  assert.equal(await teaching.verifiedHeadCtBoneTeachingRevision('stale'),null);
  assert.match(content.scope,/partial bone masks|partial.*masks/);
  assert.match(content.scope,/unregistered/);
  assert.match(content.scope,/No MRI counterpart/);
  assert.match(content.imaging.CT.text,/native side/);
  // Existing packets retain their own identities and review gates.
  for(const [packet,pin] of [[comparisonPacket,comparison.HEAD_CT_BONE_COMPARISON_REVISION],[headCtBoneLearningPacket(),HEAD_CT_BONE_LEARNING_REVISION],[headOrbitalTeachingPacket(),HEAD_ORBITAL_TEACHING_REVISION],[headTeachingPacket(),HEAD_TEACHING_REVISION]] as const)assert.equal(sha(packet),pin);
});

test('native and generic selectors are CT-only, exact-source and keep scan tasks out of reference',()=>{
  for(const note of content.notes){
    const current=teaching.headCtBoneTeachingForConcept(note.conceptId,'CT',revision);assert(current);
    assert.equal(current.note,note);assert.equal(current.imaging,content.imaging.CT);
    assert.deepEqual(current.sources,[content.sources[0]]);
    assert.deepEqual(current.concept,links.headConceptById(note.conceptId));
    assert.equal(teaching.headCtBoneTeachingForConcept(note.conceptId,'MRI',revision),null);
    assert.equal(teaching.headCtBoneTeachingForConcept(note.conceptId,'CT','stale'),null);
    const reference=teaching.headCtBoneTeachingForReference(note.conceptId,revision);assert(reference);
    assert.deepEqual(reference.anatomy,note.anatomy);assert.deepEqual(reference.function,note.function);
    assert(!('imaging' in reference));assert(!('task' in reference));
    assert.equal(teaching.headCtBoneTeachingForReference(note.conceptId,'stale'),null);
  }
  for(const id of ['orbit-left-globe','bone-left-parietal-extra','unknown']){
    assert.equal(teaching.headCtBoneTeachingForConcept(id,'CT',revision),null);
    assert.equal(teaching.headCtBoneTeachingForReference(id,revision),null);
  }
});

test('verifier rejects comparison drift, every binding edit, added MRI target and teaching edits',async()=>{
  const isolated=(linkEdits:Partial<typeof links>={},comparisonEdits:Partial<typeof comparison>={})=>compile({
    './head-atlas-links.ts':{...links,...linkEdits},
    './head-ct-bone-comparison-review.ts':{...comparison,...comparisonEdits},
  });
  assert.equal(await isolated({}, {verifiedHeadCtBoneComparisonPacket:async()=>null}).verifiedHeadCtBoneTeachingRevision(revision),null);
  assert.equal(await isolated({headConceptById:()=>null}).verifiedHeadCtBoneTeachingRevision(revision),null);
  for(const key of ['conceptId','label','ctHref','headRevision','atlasHref','scopeNote','mriHref'] as const){
    const changed=isolated({headConceptById:id=>{
      const binding=links.headConceptById(id);return binding?{...binding,[key]:'changed'}:null;
    }});
    assert.equal(await changed.verifiedHeadCtBoneTeachingRevision(revision),null,key);
  }
  const sourceChanged=isolated({headConceptById:id=>{
    const binding=links.headConceptById(id);return binding?{...binding,atlasHref:binding.atlasHref.replace(/source=[a-f0-9]{64}/,'source='+'f'.repeat(64))}:null;
  }});
  assert.equal(await sourceChanged.verifiedHeadCtBoneTeachingRevision(revision),null);
  const altered=isolated();(altered.headCtBoneTeachingContent.notes[0].anatomy as {text:string}).text+=' edited';
  assert.equal(await altered.verifiedHeadCtBoneTeachingRevision(revision),null);
  assert.equal(await teaching.verifiedHeadCtBoneTeachingRevision(revision),teaching.HEAD_CT_BONE_TEACHING_REVISION);
});

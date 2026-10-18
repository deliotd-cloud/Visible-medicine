import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as links from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {HEAD_LEARNING_REVISION,headLearningPacket} from '../lib/head-atlas-learning.ts';
import {HEAD_MRI_ONLY_TEACHING_REVISION,headMriOnlyTeachingContent,headMriOnlyTeachingForConcept,headMriOnlyTeachingForReference,headMriOnlyTeachingPacket,verifiedHeadMriOnlyTeachingRevision} from '../lib/head-mri-only-teaching.ts';

const require=createRequire(import.meta.url);
const ids=['limbic-left-amygdala','limbic-right-amygdala','commissure-corpus-callosum','endocrine-pituitary-gland'];
const source=readFileSync(new URL('../lib/head-mri-only-teaching.ts',import.meta.url),'utf8');
function isolated(headConceptById:typeof links.headConceptById){
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as typeof import('../lib/head-mri-only-teaching.ts')};
  new Function('require','module','exports',compiled)((name:string)=>name==='./head-atlas-links.ts'?{...links,headConceptById}:require(name),mod,mod.exports);
  return mod.exports;
}

test('independent MRI teaching packet has four sourced draft notes and canonical full hash',async()=>{
  const packet=headMriOnlyTeachingPacket();
  assert.equal(packet.content.schema,'vm-head-mri-only-teaching-1');
  assert.equal(packet.content.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(packet.content.status,'draft');
  assert.equal(packet.content.reviewedAt,null);
  assert.equal(packet.content.patientRegistration,false);
  assert.equal(packet.content.clinicalApproval,false);
  assert.equal(packet.content.publicationApproval,false);
  assert.deepEqual(packet.content.notes.map(note=>note.conceptId),ids);
  assert.equal(packet.bindings.length,4);
  const sourceIds=new Set<string>(packet.content.sources.map(item=>item.id));
  assert.deepEqual([...sourceIds],['ut-amygdala','ut-callosum','nci-pituitary']);
  for(const source of packet.content.sources){
    assert.equal(new URL(source.url).protocol,'https:');
    assert.equal(source.accessed,'2026-10-08');
    assert.match(source.reuse,/no text, figures or datasets imported/);
  }
  for(const [index,note] of packet.content.notes.entries()){
    assert.deepEqual(packet.bindings[index],links.headConceptById(note.conceptId));
    assert.equal(packet.bindings[index]?.ctHref,undefined);
    assert.match(note.scope,/not clinically signed off/);
    assert.match(note.scope,/unregistered/);
    assert.match(note.scope,/No exact/);
    assert.match(note.imaging.text,/MRI/);
    for(const fact of [note.anatomy,note.function]){
      assert(fact.sources.length>0);
      for(const id of fact.sources)assert(sourceIds.has(id));
    }
  }
  assert.equal(HEAD_MRI_ONLY_TEACHING_REVISION,'fc36d805260460f51b5be65a074a4d70624b7f63e77039f2b670d10c96b5004c');
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(await verifiedHeadMriOnlyTeachingRevision(links.HEAD_LINK_REVISION),HEAD_MRI_ONLY_TEACHING_REVISION);
  assert.equal(await verifiedHeadMriOnlyTeachingRevision('stale'),null);
  assert(!/patientId|scanId|filePath|pixels|coordinates/i.test(JSON.stringify(packet)));
});

test('MRI-only exact concept lookup denies CT, stale revision and unknown concept',()=>{
  for(const note of headMriOnlyTeachingContent.notes){
    const value=headMriOnlyTeachingForConcept(note.conceptId,'MRI',links.HEAD_LINK_REVISION);assert(value);
    assert.equal(value.note,note);
    assert.equal(value.revision,HEAD_MRI_ONLY_TEACHING_REVISION);
    assert(value.sources.length>0);
    assert.equal(headMriOnlyTeachingForConcept(note.conceptId,'CT',links.HEAD_LINK_REVISION),null);
    assert.equal(headMriOnlyTeachingForConcept(note.conceptId,'MRI','stale'),null);
    const reference=headMriOnlyTeachingForReference(note.conceptId,links.HEAD_LINK_REVISION);assert(reference);
    assert.deepEqual(reference.anatomy,note.anatomy);
    assert.deepEqual(reference.function,note.function);
    assert.equal('imaging'in reference,false);
    assert.equal('task'in reference,false);
  }
  for(const id of ['unknown','limbic-middle-amygdala','limbic-left-hippocampus-extra']){
    assert.equal(headMriOnlyTeachingForConcept(id,'MRI',links.HEAD_LINK_REVISION),null);
    assert.equal(headMriOnlyTeachingForReference(id,links.HEAD_LINK_REVISION),null);
  }
});

test('verifier rejects changed binding or canonical digest without changing current packet',async()=>{
  const withCt=isolated(id=>{const link=links.headConceptById(id);return link&&id===ids[0]?{...link,ctHref:'/atlas/ct-head?concept='+id}:link;});
  assert.equal(await withCt.verifiedHeadMriOnlyTeachingRevision(links.HEAD_LINK_REVISION),null);
  const changedText=isolated(id=>{const link=links.headConceptById(id);return link&&id===ids[0]?{...link,scopeNote:link.scopeNote+' altered'}:link;});
  assert.equal(await changedText.verifiedHeadMriOnlyTeachingRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await verifiedHeadMriOnlyTeachingRevision(links.HEAD_LINK_REVISION),HEAD_MRI_ONLY_TEACHING_REVISION);
});

test('original twenty-five teaching notes and five tours keep their identities',()=>{
  const original=headTeachingPacket(),learning=headLearningPacket();
  assert.equal(original.content.notes.length,25);
  assert.equal(learning.sequences.length,5);
  assert.equal(learning.sequences.flatMap(sequence=>sequence.concepts).length,25);
  assert.equal(HEAD_TEACHING_REVISION,'2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a');
  assert.equal(HEAD_LEARNING_REVISION,'47bae289d0e9bf2bf83596cd9bdbdb93e7a968b57507a55e26700af445763052');
  assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),HEAD_TEACHING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(learning)).digest('hex'),HEAD_LEARNING_REVISION);
  for(const id of ids){assert(!original.content.notes.some(note=>note.conceptId===id));assert(!learning.sequences.some(sequence=>sequence.concepts.includes(id)));}
});

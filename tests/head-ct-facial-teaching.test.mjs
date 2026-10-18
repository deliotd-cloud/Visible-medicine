import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as teaching from '../lib/head-ct-facial-teaching.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as comparison from '../lib/head-ct-facial-comparison-review.ts';

const require=createRequire(import.meta.url);
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids=['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'];
const source=new URL('../lib/head-ct-facial-teaching.ts',import.meta.url);
function isolated(linkOverrides={},comparisonOverrides={}){
  const code=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  const loaded={
    './head-atlas-links.ts':{...links,...linkOverrides},
    './head-ct-facial-comparison-review.ts':{...comparison,...comparisonOverrides},
  };
  new Function('require','module','exports',code)((id)=>loaded[id]??require(id),mod,mod.exports);
  return mod.exports;
}

test('three CT-only original drafts and questions have a separate digest and safe status',async()=>{
  const content=teaching.headCtFacialTeachingContent,packet=teaching.headCtFacialTeachingPacket();
  assert.deepEqual(content.notes.map(note=>note.conceptId),ids);
  assert.deepEqual(content.questions.map(question=>question.conceptId),ids);
  assert.equal(content.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(content.comparisonRevision,comparison.HEAD_CT_FACIAL_COMPARISON_REVISION);
  assert.equal(content.status,'draft');assert.equal(content.reviewedAt,null);
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'])assert.equal(content[key],false);
  assert.equal(content.sources.length,1);
  assert.equal(content.sources[0].url,'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull');
  assert.equal(content.sources[0].accessed,'2026-10-16');
  const factual=[...content.notes.flatMap(note=>[note.anatomy.text,note.function.text]),...content.questions.flatMap(question=>[question.prompt,...question.options.map(option=>option.label),question.explanation])].join(' ');
  assert(factual.trim().split(/\s+/).length<180);
  assert.equal(sha(packet),teaching.HEAD_CT_FACIAL_TEACHING_REVISION);
  assert.notEqual(teaching.HEAD_CT_FACIAL_TEACHING_REVISION,comparison.HEAD_CT_FACIAL_COMPARISON_REVISION);
  assert.equal(await teaching.verifiedHeadCtFacialTeachingRevision(links.HEAD_LINK_REVISION),teaching.HEAD_CT_FACIAL_TEACHING_REVISION);
  assert.equal(await teaching.verifiedHeadCtFacialTeachingRevision('stale'),null);
  assert.match(content.scope,/not spatially registered/);
  assert.match(content.scope,/No MRI, X-ray or ultrasound/);
});

test('CT and 3D selectors stay exact, with separate source-bound questions',()=>{
  for(const id of ids){
    const ct=teaching.headCtFacialTeachingForConcept(id,'CT',links.HEAD_LINK_REVISION);
    const ref=teaching.headCtFacialTeachingForReference(id,links.HEAD_LINK_REVISION);
    const check=teaching.headCtFacialQuestionForConcept(id,links.HEAD_LINK_REVISION);
    assert(ct&&ref&&check);
    assert.deepEqual(ct.concept,links.headConceptById(id));
    assert.equal(check.question.options.filter(option=>option.id===check.question.correctOptionId).length,1);
    assert.deepEqual(check.sources,ct.sources);
    assert(!('task' in ref));assert(!('imaging' in ref));
    assert.equal(teaching.headCtFacialTeachingForConcept(id,'MRI',links.HEAD_LINK_REVISION),null);
    assert.equal(teaching.headCtFacialTeachingForConcept(id,'CT','stale'),null);
    assert.equal(teaching.headCtFacialQuestionForConcept(id,links.HEAD_LINK_REVISION,'stale'),null);
  }
  assert.equal(teaching.headCtFacialTeachingForConcept('bone-left-nasal','CT',links.HEAD_LINK_REVISION),null);
  assert.equal(teaching.headCtFacialQuestionForConcept('bone-left-nasal',links.HEAD_LINK_REVISION),null);
});

test('verification rejects comparison drift, side/label/representation edits and content/order edits',async()=>{
  const revision=links.HEAD_LINK_REVISION;
  assert.equal(await isolated({}, {verifiedHeadCtFacialComparisonPacket:async()=>null}).verifiedHeadCtFacialTeachingRevision(revision),null);
  for(const key of ['id','label','laterality','representation']){
    const changed=isolated({}, {verifiedHeadCtFacialComparisonPacket:async()=>{
      const packet=comparison.headCtFacialComparisonPacket();packet.items[0].ct[key]='changed';return packet;
    }});
    assert.equal(await changed.verifiedHeadCtFacialTeachingRevision(revision),null,key);
  }
  for(const key of ['conceptId','label','ctHref','headRevision','atlasHref','scopeNote','mriHref']){
    const changed=isolated({headConceptById:id=>{const value=links.headConceptById(id);return value?{...value,[key]:'changed'}:null;}});
    assert.equal(await changed.verifiedHeadCtFacialTeachingRevision(revision),null,key);
  }
  for(const mutate of [
    mod=>{mod.headCtFacialTeachingContent.notes[0].anatomy.text+=' altered';},
    mod=>{mod.headCtFacialTeachingContent.questions[0].explanation+=' altered';},
    mod=>{mod.headCtFacialTeachingContent.notes.reverse();},
    mod=>{mod.headCtFacialTeachingContent.questions.reverse();},
    mod=>{mod.headCtFacialTeachingContent.reviewedAt='2026-10-16';},
  ]){
    const changed=isolated();mutate(changed);
    assert.equal(await changed.verifiedHeadCtFacialTeachingRevision(revision),null);
  }
  assert.equal(await teaching.verifiedHeadCtFacialTeachingRevision(revision),teaching.HEAD_CT_FACIAL_TEACHING_REVISION);
});

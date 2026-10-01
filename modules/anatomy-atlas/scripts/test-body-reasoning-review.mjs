import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { build } from './workspace-test-build.mjs';

const compile = async contents => {
  const result = await build({ stdin: { contents, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
};
const api = await compile(`
export * from './lib/body-reasoning-review';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-decisions';
export * from './lib/body-review-response';
export * from './lib/reasoning-questions';
export * from './lib/atlas-practice';
import raw from './public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from './lib/body-display-catalog';
export const catalog = bodyDisplayCatalog(raw as any);
`);
const old = await compile(execFileSync('git', ['show', '07e0655:lib/body-review-decisions.ts'], {encoding:'utf8'}));
const oldParser = await compile(execFileSync('git', ['show', '07e0655:lib/body-review-response.ts'], {encoding:'utf8'}).replaceAll("from './", "from './lib/"));
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}' : JSON.stringify(value);
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha(canonical(JSON.parse(JSON.stringify(value))));
let eligible = 0, absent = 0, changes = 0;
for (const s of api.catalog.structures) {
  const r = api.bodyReasoningReview(api.catalog, s.id);
  if (!r) { absent++; continue; }
  eligible++;
  const session = api.createPracticeSession(api.catalog.structures, api.catalog.bundles.map(b=>b.id),
    {id:1,mode:'reason',sampling:'all',count:1,retryIds:[s.id]},()=>0.87);
  const q = session.questions[0];
  assert.equal(r.answerId, s.id);
  assert.deepEqual(r.choices.map(c=>c.id), [...q.choices].sort());
  for (const [k,v] of Object.entries(q.reasoning)) assert.deepEqual(r[k],v);
  assert(r.choices.length >= 2);
  assert(r.choices.every(c=>c.laterality===s.laterality));
  const material = await api.bodyReviewMaterial(s.id);
  assert.deepEqual(material.reasoning, r);
  assert((await api.parseBodyReviewResponse(material,s.id)));
  const scope = {schema:'vm-body-review-worksheet-2',kind:material.kind,structureId:s.id};
  assert.equal(material.fingerprints.teaching,digest({scope,topics:material.topics,reasoning:r,...(material.guidedTours.length?{guidedTours:material.guidedTours}:{})}));
  assert.equal(material.schema,'vm-body-review-worksheet-3');
  const sourceScope = {...scope,schema:'vm-body-review-worksheet-1'};
  assert.equal(material.fingerprints.source,digest({scope:sourceScope,source:material.source}));
  const context = await api.bodyReviewContext(s.id);
  const oldRevision = sha(JSON.stringify({catalogScope:context.catalogScope,structureId:s.id,
    checklistVersion:old.bodyChecklistVersion,source:material.fingerprints.source,
    teaching:digest({scope:sourceScope,topics:material.topics}),checks:old.bodyChecklists.teaching}));
  assert.notEqual(context.revisions.teaching,oldRevision,'Prior approval cannot cover the expanded question scope');
  const oldRecord = {catalogScope:context.catalogScope,structureId:s.id,track:'teaching',revisionHash:oldRevision,checklistVersion:old.bodyChecklistVersion};
  assert(api.bodyReviewStale(oldRecord,context));
  assert(!api.bodyReviewStale({...oldRecord,revisionHash:context.revisions.teaching},context));
  assert.equal(context.revisions.geometry,sha(JSON.stringify({catalogScope:context.catalogScope,structureId:s.id,
    checklistVersion:old.bodyChecklistVersion,source:material.fingerprints.source,
    renderer:context.rendererHash,checks:old.bodyChecklists.geometry})), 'No blanket geometry re-review for a teaching-only change');
}
assert.equal(eligible,308);
assert.equal(absent,796);
const s = api.catalog.structures.find(s=>api.reasoningConceptFor(s)?.key==='thoracic-ascending-aorta');
const original = await api.bodyReviewMaterial(s.id);
assert.equal(oldParser.parseBodyReviewResponse(original,s.id),null,'Cached old UI must not hide newly reviewable questions');
let rejected = 0;
for (const mutate of [
  p=>delete p.reasoning, p=>p.schema='vm-body-review-worksheet-1',
  p=>p.reasoning.readiness='approved',p=>p.reasoning.key='',p=>p.reasoning.revision=0,
  p=>p.reasoning.prompt=null,p=>p.reasoning.explanation=[],p=>p.reasoning.scope='',
  p=>p.reasoning.references=[],p=>p.reasoning.references[0].url='javascript:alert(1)',
  p=>p.reasoning.references[0].url='https://user:password@example.com',
  p=>p.reasoning.references[0].url='https://example.com\\evil',
  p=>p.reasoning.choices=[p.reasoning.choices[0]],
  p=>p.reasoning.choices.push(p.reasoning.choices[0]),
  p=>p.reasoning.answerId=p.reasoning.choices.find(c=>c.id!==s.id).id,
  p=>p.reasoning.choices.find(c=>c.id===s.id).name+=' changed',
  p=>p.reasoning.choices.find(c=>c.id===s.id).bundleSha256='0'.repeat(64),
  p=>p.reasoning.choices.find(c=>c.id===s.id).sources[0].sha256='0'.repeat(64),
  p=>p.reasoning.choices[0].sources[0].sha256='invalid',
  p=>p.reasoning.choices[0].sources.push(p.reasoning.choices[0].sources[0]),
  p=>p.reasoning.choices[0].id='other-source',p=>p.reasoning.choices[0].laterality='left',
  p=>p.reasoning.choices[0].regions=[],p=>p.reasoning.choices[0].nodeName='',
  p=>p.topics[0].correctAnswer={},p=>p.topics[0].explanation=42,
]) {
  const packet=structuredClone(original);mutate(packet);
  assert.equal((await api.parseBodyReviewResponse(packet,s.id)),null);rejected++;
}
const concept = api.reasoningConceptFor(s);
for (const edit of [c=>c.prompt+=' TEST',c=>c.explanation+=' TEST',c=>c.revision++,
  c=>c.references[0].title+=' TEST',c=>c.references[0].url+='?test=1',c=>c.distractors=['thoracic-aortic-arch']]) {
  const saved = structuredClone(concept);
  try {
    edit(concept);
    const changed = await api.bodyReviewMaterial(s.id);
    assert.notEqual(changed.fingerprints.teaching,original.fingerprints.teaching);
    assert.equal(changed.fingerprints.source,original.fingerprints.source);
    changes++;
  } finally { Object.assign(concept,saved); }
}
assert.deepEqual(await api.bodyReviewMaterial(s.id),original);
const altId = original.reasoning.choices.find(c=>c.id!==s.id).id;
for (const edit of [
  c=>c.structures.find(s=>s.id===altId).name+=' TEST',
  c=>c.structures.find(s=>s.id===altId).sources[0].sha256='0'.repeat(64),
  c=>c.bundles.find(b=>b.id===c.structures.find(s=>s.id===altId).bundle).sha256='0'.repeat(64),
  c=>c.structures=c.structures.filter(s=>s.id!==altId),
]) {
  const catalog = structuredClone(api.catalog); edit(catalog);
  assert.notEqual(digest(api.bodyReasoningReview(catalog,s.id)),digest(original.reasoning)); changes++;
}
const onlyTarget = {...api.catalog,structures:[s]};
assert.equal(api.bodyReasoningReview(onlyTarget,s.id),null,'No invented one-choice question');
assert.equal(api.bodyReasoningReview(api.catalog,'unknown'),null);
const duplicate = {...api.catalog,structures:[...api.catalog.structures,s]};
assert.equal(api.bodyReasoningReview(duplicate,s.id),null);
original.reasoning.choices[0].name='external mutation';
assert.notEqual((await api.bodyReviewMaterial(s.id)).reasoning.choices[0].name,'external mutation');
console.log(JSON.stringify({eligible,absent,rejectedMalformedPackets:rejected,contentAndSourceMutations:changes,oldTeachingApprovalsStale:true,geometryRevisionPreserved:true,oldClientRejected:true,clinicalApproval:false}));

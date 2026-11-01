import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {test} from 'node:test';
import {auditTeachingSnapshots} from './audit-teaching-quality.mjs';
const topics=['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'];
const fixtures=[];
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'vm-teaching-quality-'));fixtures.push(root);return root;}
function snapshot(region='arm') {return {schemaVersion:1,region,entries:[{identity:JSON.stringify({id:'synthetic:arm',name:'Synthetic arm'}),lessons:Object.fromEntries(topics.map(topic=>[topic,{readiness:'draft',title:'Synthetic lesson',body:'Original teaching example',bullets:topic==='quiz'?['A','B']:[],citations:['https://example.test/reference'],...(topic==='quiz'?{correctAnswer:'A'}:{})}]))}],undefinedPaths:[]};}
test('binds every byte and selection while preserving source files',()=>{const root=fixture(),file=path.join(root,'arm.json'),input=JSON.stringify(snapshot());fs.writeFileSync(file,input);const a=auditTeachingSnapshots(root),b=auditTeachingSnapshots(root);assert.deepEqual(a,b);assert.equal(a.source.structures,1);assert.equal(a.source.lessons,9);assert.equal(a.source.resolverFreshnessVerified,false);assert.equal(a.clinicalApproval,false);assert.equal(fs.readFileSync(file,'utf8'),input);const changed=snapshot();changed.entries[0].lessons.anatomy.body+=' Changed.';fs.writeFileSync(file,JSON.stringify(changed));assert.notEqual(auditTeachingSnapshots(root).source.sourceRevision,a.source.sourceRevision);});
test('rejects mismatched regions, unknown files and duplicate identities',()=>{const root=fixture(),file=path.join(root,'arm.json');fs.writeFileSync(file,JSON.stringify(snapshot('leg')));assert.throws(()=>auditTeachingSnapshots(root),/Invalid teaching snapshot/);fs.writeFileSync(file,JSON.stringify(snapshot()));fs.writeFileSync(path.join(root,'other.txt'),'unrelated');assert.throws(()=>auditTeachingSnapshots(root),/Unexpected snapshot filename/);const duplicate=fixture();fs.writeFileSync(path.join(duplicate,'arm.json'),JSON.stringify(snapshot()));fs.writeFileSync(path.join(duplicate,'leg.json'),JSON.stringify(snapshot('leg')));assert.throws(()=>auditTeachingSnapshots(duplicate),/Duplicate teaching identity/);});
test('optional markers restore only existing own null fields and reject unsafe paths',()=>{const root=fixture(),file=path.join(root,'arm.json'),s=snapshot();s.entries[0].lessons.quiz.explanation=null;s.undefinedPaths=[['entries',0,'lessons','quiz','explanation']];fs.writeFileSync(file,JSON.stringify(s));assert.equal(auditTeachingSnapshots(root).source.lessons,9);s.undefinedPaths=[['entries',0,'__proto__','polluted']];fs.writeFileSync(file,JSON.stringify(s));assert.throws(()=>auditTeachingSnapshots(root),/Invalid optional-field path/);assert.equal({}.polluted,undefined);});
// Fixtures are intentionally retained in the caller-selected temporary directory.
// No cleanup traverses user data or relies on computed recursive deletions.

test('paired compiler declarations do not alter teaching evidence or execute code',()=>{
  const root=fixture(),file=path.join(root,'arm.json');
  fs.writeFileSync(file,JSON.stringify(snapshot()));
  const before=auditTeachingSnapshots(root);
  const companion=path.join(root,'arm.d.json.ts');
  fs.writeFileSync(companion,'throw new Error("Compiler companions must never execute");');
  const after=auditTeachingSnapshots(root);
  assert.deepEqual(before.source.excludedCompilerCompanions,[]);
  assert.deepEqual(after.source.excludedCompilerCompanions,['arm.d.json.ts']);
  assert.deepEqual(after.audit,before.audit);
  assert.deepEqual(after.labels,before.labels);
  const {excludedCompilerCompanions:omittedBefore,...beforeSource}=before.source;
  const {excludedCompilerCompanions:omittedAfter,...afterSource}=after.source;
  assert.deepEqual(afterSource,beforeSource);
  assert.equal(after.clinicalApproval,false);
  assert.equal(after.source.resolverFreshnessVerified,false);
  assert.match(after.limitations.at(-1),/excluded, not validated or executed/);
  fs.writeFileSync(companion,'declare const snapshot: unknown; export default snapshot;');
  assert.deepEqual(auditTeachingSnapshots(root),after,'Companion bytes are not lesson evidence');
  const changed=snapshot();changed.entries[0].lessons.anatomy.body+=' Changed.';
  fs.writeFileSync(file,JSON.stringify(changed));
  assert.notEqual(auditTeachingSnapshots(root).source.sourceRevision,after.source.sourceRevision);
});

test('orphan declarations, unrelated TypeScript and non-files still fail closed',()=>{
  for(const name of ['leg.d.json.ts','arm.json.ts','arm.d.ts','arm.d.json.ts.bak','ar_m.d.json.ts']){
    const root=fixture();fs.writeFileSync(path.join(root,'arm.json'),JSON.stringify(snapshot()));
    fs.writeFileSync(path.join(root,name),'declare const data: unknown;');
    assert.throws(()=>auditTeachingSnapshots(root),/Orphan compiler companion|Unexpected snapshot filename/,name);
  }
  const folder=fixture();fs.writeFileSync(path.join(folder,'arm.json'),JSON.stringify(snapshot()));
  fs.mkdirSync(path.join(folder,'arm.d.json.ts'));
  assert.throws(()=>auditTeachingSnapshots(folder),/Expected bounded regular compiler companion/);
  const alone=fixture();fs.writeFileSync(path.join(alone,'arm.d.json.ts'),'');
  assert.throws(()=>auditTeachingSnapshots(alone),/Orphan compiler companion/);
  assert.throws(()=>auditTeachingSnapshots(fixture()),/No teaching snapshots found/);
});

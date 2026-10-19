import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateRevision53Supplement} from './closed53-source-supplement.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {assert53Text,assert53TextPath,declaredRevision53Inputs,
 readExactGit53TextBatch,REVISION53_SOURCE,
 validateRevision53Completion} from './closed53-complete-source.mjs';

const primaryBytes=readFileSync(new URL('./fixtures/head-manual-recovery-53/epoch.json',import.meta.url));
const supplementBytes=readFileSync(new URL('./fixtures/head-manual-recovery-53/supplement.json',import.meta.url));
const backupBytes=readFileSync(new URL('./fixtures/head-manual-recovery-53/website-text-closure.json',import.meta.url));
const primary=JSON.parse(primaryBytes),supplement=validateRevision53Supplement(
 JSON.parse(supplementBytes),primaryBytes);
const existing=new Map(primary.files.map(row=>[row.path,row]));
for(const [path,row]of supplement.records)existing.set(path,row);

test('original53 inputs form a disjoint 15+226+1417 text closure',()=>{
 const closure=validateRevision53Completion(primaryBytes,existing,backupBytes);
 assert.equal(closure.declared.size,1658);
 assert.equal(closure.frozen.size,15);
 assert.equal(closure.backup.size,226);
 assert.equal(closure.atlasRows.length,1417);
 const admitted=new Set([...closure.frozen,...closure.backup.keys(),
  ...closure.atlasRows.map(row=>row.path)]);
 assert.equal(admitted.size,1658);
 for(const path of closure.declared.keys())assert(admitted.has(path),path);
 assert.equal(closure.backup.get('package-lock.json')?.length>0,true);
});

test('one bounded genuine Atlas6ba batch matches every remaining declared source hash',()=>{
 const closure=validateRevision53Completion(primaryBytes,existing,backupBytes);
 const root=checkedAtlasHistoryRepo(REVISION53_SOURCE);
 const texts=readExactGit53TextBatch(['-C',root],REVISION53_SOURCE,closure.atlasRows);
 assert.equal(texts.size,1417);
 const size=[...texts.values()].reduce((n,bytes)=>n+bytes.length,0);
 assert.equal(size,28_536_231);
});

test('path, source, byte and backup fixture mutations are refused',()=>{
 const closure=validateRevision53Completion(primaryBytes,existing,backupBytes);
 for(const path of ['../outside.ts','atlas-review/private.dcm','atlas-review//content.ts','atlas-review/mask.png'])
  assert.throws(()=>assert53TextPath(path));
 const row=closure.atlasRows[0],good=Buffer.from('fixed source text');
 assert.throws(()=>assert53Text(Buffer.from(good.toString()+' forged'),row.sha256,row.path));
 const nul=Buffer.from('a\0b');
 const nulSha=createHash('sha256').update(nul).digest('hex');
 assert.throws(()=>assert53Text(nul,nulSha,'NUL policy'),/NUL is not source text/);
 const changedPrimary=Buffer.from(primaryBytes);
 changedPrimary[changedPrimary.length-2]^=1;
 assert.throws(()=>declaredRevision53Inputs(changedPrimary));
 const changedBackup=Buffer.from(backupBytes);
 changedBackup[changedBackup.length-2]^=1;
 assert.throws(()=>validateRevision53Completion(primaryBytes,existing,changedBackup));
 const missing=new Map(existing);missing.delete('atlas-review/integration-inputs.json');
 assert.throws(()=>validateRevision53Completion(primaryBytes,missing,backupBytes));
});

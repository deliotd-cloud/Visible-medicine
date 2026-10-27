import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex'),proof=JSON.parse(fs.readFileSync(new URL('./fixtures/sql-policy-history/current-binding-seams.json',import.meta.url),'utf8'));
test('current SQL revision binding retains all prior case bodies and schema checks',()=>{
 for(const[i,row]of proof.before.entries()){let text=fs.readFileSync(root+'/'+row.path,'utf8');for(const[a,b]of proof.seams[i].toReversed()){assert.equal(text.split(b).length,2);text=text.replace(b,a);}const original=fs.readFileSync(root+'/'+proof.fixtures[i]);assert.equal(sha(original),row.sha256);assert.deepEqual(Buffer.from(text),original);}
});
test('current SQL replay refuses a borrowed Website before loading its source',()=>{
 const env={...process.env,VM_ATLAS_ACCESS_SQL_ROOT:root+'/foreign'};delete env.NODE_TEST_CONTEXT;
 const r=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',"await import('./tests/atlas-delivery-access-sql-current-source.mjs')"],{cwd:root,env,encoding:'utf8',windowsHide:true,maxBuffer:1024*1024});assert.equal(r.error,undefined);assert.equal(r.signal,null);assert.notEqual(r.status,0);assert.match(r.stderr,/Current SQL source must be this Website/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {canonicalSourceRows,sourceCommitment,enumerateHistoricalSources} from './eus-source-commitment.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const sample=()=>[{path:'z.txt',bytes:1,sha256:sha('z')},{path:'a.txt',bytes:1,sha256:sha('a')}];
test('whole-source commitment has canonical key and path order',()=>{
 const rows=sample(),expected=JSON.stringify([rows[1],rows[0]])+'\n';assert.equal(canonicalSourceRows(rows),expected);assert.equal(canonicalSourceRows([...rows].reverse()),expected);assert.deepEqual(sourceCommitment(rows),sourceCommitment([...rows].reverse()));
});
test('changed bytes or size and missing or extra source cannot retain the commitment',()=>{
 const rows=sample(),expected=sourceCommitment(rows);for(const changed of [[{...rows[0],sha256:sha('q')},rows[1]],[{...rows[0],bytes:2},rows[1]],[rows[0]],[...rows,{path:'extra.txt',bytes:0,sha256:sha('')}]])assert.notDeepEqual(sourceCommitment(changed),expected);
});
test('duplicate, escaping or malformed source metadata is rejected',()=>{
 for(const name of ['../x','/x','x//y','./x','x/../y','C:/x','x\\y'])assert.throws(()=>canonicalSourceRows([{path:name,bytes:1,sha256:sha('x')}]));const rows=sample();assert.throws(()=>canonicalSourceRows([rows[0],rows[0]]));for(const changed of [{...rows[0],bytes:-1},{...rows[0],sha256:'unknown'},{...rows[0],extra:true}])assert.throws(()=>canonicalSourceRows([changed]));
});
test('metadata accessors are refused without invoking their code',()=>{
 let calls=0;const row={...sample()[0]};Object.defineProperty(row,'path',{get(){calls++;return 'x';},enumerable:true});assert.throws(()=>canonicalSourceRows([row]));assert.equal(calls,0);
});
test('filesystem scope excludes only root runtime entries and detects real file changes',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'vm-eus-commitment-'));
 const write=(name,bytes)=>{const file=path.join(temp,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);};
 try{write('a.txt','a');write('nested/b.txt','b');for(const root of ['.git','node_modules','.next','dist','.wrangler'])write(root+'/ignored.txt','runtime');const original=sourceCommitment(enumerateHistoricalSources(temp));assert.equal(original.count,2);write('a.txt','q');assert.notDeepEqual(sourceCommitment(enumerateHistoricalSources(temp)),original);write('a.txt','a');assert.deepEqual(sourceCommitment(enumerateHistoricalSources(temp)),original);write('nested/dist/real-source.txt','nested');assert.equal(sourceCommitment(enumerateHistoricalSources(temp)).count,3);}finally{const target=path.resolve(temp),base=path.resolve(os.tmpdir())+path.sep;assert(target.startsWith(base)&&path.basename(target).startsWith('vm-eus-commitment-'));fs.rmSync(target,{recursive:true});}
});

// Isolating Node's reporter transport changes no application permissions.
import {originalEusChildEnvironment} from './eus-original-delivery.mjs';
test('standalone historical child clears inherited reporter transport and retains app access settings',()=>{
 const before={NODE_TEST_CONTEXT:'child-v8',APP_AUTH:'unchanged',ACCOUNT_ROLE:'unchanged'};const after=originalEusChildEnvironment(before,'/explicit/historical/atlas');assert.equal(Object.hasOwn(after,'NODE_TEST_CONTEXT'),false);assert.equal(before.NODE_TEST_CONTEXT,'child-v8');assert.equal(after.APP_AUTH,before.APP_AUTH);assert.equal(after.ACCOUNT_ROLE,before.ACCOUNT_ROLE);assert.equal(after.VM_ATLAS_SOURCE_REPO,'/explicit/historical/atlas');
});

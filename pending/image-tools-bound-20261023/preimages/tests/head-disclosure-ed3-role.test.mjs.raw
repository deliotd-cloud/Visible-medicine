import assert from 'node:assert/strict';import test from 'node:test';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {restoreEd3DisclosureToToolsEpoch,disclosureTestRoles} from './head-disclosure-ed3-role.mjs';import {restoreHeadToolsTestRole} from './head-tools-test-source-role.mjs';
const base=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,base)),sha=b=>createHash('sha256').update(b).digest('hex'),before='tests/fixtures/head-disclosure-current-epoch-before/tests/';
const current=read('tests/head-disclosure-current-delivery.test.mjs'),tools=read('tests/fixtures/current-source-closure-before/head-disclosure-current-delivery.test.mjs.raw');
test('ed3 full test projects to authenticated complete tools role, then original historic preservation still runs',()=>{
 assert.equal(sha(current),disclosureTestRoles.current);assert.equal(sha(tools),disclosureTestRoles.tools);const restored=restoreEd3DisclosureToToolsEpoch(current);assert.deepEqual(restored,tools);
 assert.equal(sha(restoreHeadToolsTestRole('head-disclosure-current-delivery.test.mjs',restored)),'6feb900f5db6124b287629a669267736baf22751d3142aea15f8d4eda87d0e31');
});
test('only the three declared identity lines change from the actual previous current contract',()=>{
 const old=read(before+'head-disclosure-current-delivery.test.mjs.raw');assert.equal(sha(old),'d9ff129afdaf8ba43d232eb9fbd201bf5a3d4c3327b8970e3c54bd435c44ec22');let restored=current.toString();
 for(const prefix of [' assert.equal(now.source,',' assert.equal(now.reviewSourceFiles,',' assert.equal(current.reviewIntegration,']){const oldLines=old.toString().split('\n').filter(l=>l.startsWith(prefix)),newLines=restored.split('\n').filter(l=>l.startsWith(prefix));assert.equal(oldLines.length,1);assert.equal(newLines.length,1);assert.equal(restored.split(newLines[0]).length,2);restored=restored.replace(newLines[0],oldLines[0]);}
 assert.equal(restored,old.toString(),'Every original historical, runtime, stock-tamper and portable-helper assertion remains complete');
});
test('historic proof changes only one explicit import and the source-role projection argument',()=>{
 const old=read(before+'head-disclosure-role-preservation-20261021.test.mjs.raw');let now=read('tests/head-disclosure-role-preservation-20261021.test.mjs').toString();
 const added="import {restoreEd3DisclosureToToolsEpoch} from './head-disclosure-ed3-role.mjs';";assert.equal(now.split(added).length,2);now=now.replace(added+'\r\n','').replace(added+'\n','');
 const from="restoreEd3DisclosureToToolsEpoch(read('./head-disclosure-current-delivery.test.mjs'))",to="read('./head-disclosure-current-delivery.test.mjs')";assert.equal(now.split(from).length,2);now=now.replace(from,to);assert.equal(now,old.toString(),'All historic section hashes, forged historical/verifier/prefix tests and full-file inverses remain exact');
});
test('changed identity, binding, assertion, import, fixture or prefix bytes are refused',()=>{
 const source=current.toString();for(const [from,to]of [
 ['ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f','0'.repeat(40)],['0305c15be5fb58ea7729a3849bbbdb6e1e40649d','0'.repeat(40)],['reviewSourceFiles,1569','reviewSourceFiles,1568'],['binding.inputs.length,1737','binding.inputs.length,1736'],['assert.equal(lateCalls,0)','assert.equal(lateCalls,1)'],["from './current-atlas-delivery.mjs'","from './forged-current.mjs'"],['head-viewer-before-roving.tsx.raw','forged-viewer.tsx.raw'],['assert.equal(intercepted,1)','assert.equal(intercepted,0)']
 ]){assert(source.includes(from));assert.throws(()=>restoreEd3DisclosureToToolsEpoch(Buffer.from(source.replace(from,to))),{code:'ERR_ASSERTION'});}assert.throws(()=>restoreEd3DisclosureToToolsEpoch(Buffer.concat([current,Buffer.from('\n')])));assert.throws(()=>restoreEd3DisclosureToToolsEpoch(current.toString()));
});
test('old head-tools test and previous current test cannot masquerade as the ed3 current source',()=>{
 for(const bytes of [tools,read(before+'head-disclosure-current-delivery.test.mjs.raw')])assert.throws(()=>restoreEd3DisclosureToToolsEpoch(bytes),{code:'ERR_ASSERTION'});
});
test('old role-restorer stays unchanged and still refuses unprojected new source',()=>{
 const prep=JSON.parse(read('../PREPARATION.json')),row=prep.sourceRows.find(r=>r.path==='tests/head-tools-test-source-role.mjs');assert.equal(sha(read(row.path)),row.sha256);assert.throws(()=>restoreHeadToolsTestRole('head-disclosure-current-delivery.test.mjs',current),{code:'ERR_ASSERTION'});
});
test('every parent input stays exact outside the two explicitly reviewed test files',()=>{
 const prep=JSON.parse(read('../PREPARATION.json')),allowed=new Set(['tests/head-disclosure-current-delivery.test.mjs','tests/head-disclosure-role-preservation-20261021.test.mjs']),changed=[];
 function fileHash(p){const h=createHash('sha256'),fd=fs.openSync(new URL(p,base),'r'),b=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,b,0,b.length,null)))h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
 for(const r of prep.sourceRows)if(fileHash(r.path)!==r.sha256){assert(allowed.has(r.path),r.path);changed.push(r.path);}assert.deepEqual(new Set(changed),allowed);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {loadCatalogueTestBundle} from './disk-catalogue-test-loader.mjs';
import {restoreReferenceCatalogueRole,referenceCatalogueDeliveryRoles} from './reference-catalogue-delivery-role.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
test('disk-backed bundle keeps the same exports, functions and object semantics as the original data-URL substrate',async()=>{
 const contents="export const value=Object.freeze({items:[1,2,3],name:'source'});export const score=n=>n+value.items.length;";
 const old=await build({stdin:{contents,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const expected=await import('data:text/javascript;base64,'+Buffer.from(old.outputFiles[0].contents).toString('base64'));
 const actual=await loadCatalogueTestBundle(contents,root);assert.deepEqual(Object.keys(actual),Object.keys(expected));
 assert.deepEqual(actual.value,expected.value);assert.equal(Object.isFrozen(actual.value),true);assert.equal(actual.score(7),expected.score(7));
});
test('invalid input and non-directory fixture parents are refused before compilation',async()=>{
 await assert.rejects(()=>loadCatalogueTestBundle(null,root),{name:'AssertionError'});
 const parent=path.join(root,'.local','catalogue-loader-fixtures');await mkdir(parent,{recursive:true});
 const fixture=await mkdtemp(path.join(parent,'bad-parent-'));await writeFile(path.join(fixture,'.local'),'not a directory',{flag:'wx'});
 await assert.rejects(()=>loadCatalogueTestBundle('export const value=1',fixture),/EEXIST|ENOTDIR/);
});
function restoreCatalogueLoader(current){
 current=restoreReferenceCatalogueRole(current);
 const old=readFileSync(new URL('./fixtures/regional-reference-before-disk-loader.test.ts.raw',import.meta.url));
 assert.equal(sha(old),'bc6c4172fe97f496320cb4d3170c83aeccbaa68f6b13b9786804fb2dd0f2e589');
 const eol=current.includes('\r\n')?'\r\n':'\n';
 const addition="import {loadCatalogueTestBundle} from './disk-catalogue-test-loader.mjs';"+eol;assert.equal(current.split(addition).length,2);current=current.replace(addition,'');
 const prefix="const bundled=await build({stdin:{contents:",afterPrefix="const catalogueSource=";
 const oldText=old.toString(),start=oldText.indexOf(prefix),end=oldText.indexOf('\nconst copy=',start);assert(start>0&&end>start);
 const afterStart=current.indexOf(afterPrefix),afterEnd=current.indexOf('\nconst copy=',afterStart);assert(afterStart>0&&afterEnd>afterStart);
 const previous=oldText.slice(start,end);
 const close=",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});";
 const url="await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`)";
 assert.equal(previous.split(close).length,2);assert.equal(previous.split(url).length,2);
 const expected=previous.replace(prefix,afterPrefix).replace(close,';').replace(url,'await loadCatalogueTestBundle(catalogueSource,process.cwd())');
 assert.equal(current.slice(afterStart,afterEnd),expected,'Exact unchanged exports/source plus only the declared loader substitution');
 current=current.slice(0,afterStart)+oldText.slice(start,end)+current.slice(afterEnd);
 assert.deepEqual(Buffer.from(current),old,'All original test functions and assertions remain byte-exact');
 return old;
}
test('every complete original catalogue case and assertion survives only the disk-loader seams',()=>{
 restoreCatalogueLoader(readFileSync(new URL('./regional-reference-review-index.test.ts',import.meta.url),'utf8'));
});
test('altered bundle source, removed loader and modified original assertions are refused',()=>{
 const current=readFileSync(new URL('./regional-reference-review-index.test.ts',import.meta.url),'utf8');
 for(const mutate of [s=>s.replace("export {regionalLearningRevision}","export {forgedRevision}"),s=>s.replace('await loadCatalogueTestBundle(catalogueSource,process.cwd())','await Promise.resolve({})'),s=>s.replace('assert.equal(index.approval,false)','assert.equal(index.approval,true)'),s=>s+'\n// foreign source\n']){
  const changed=mutate(current);assert.notEqual(changed,current);assert.throws(()=>restoreCatalogueLoader(changed));
 }
});
test('the actual source-bound delivery roles retain exact old headers and refuse forged live families',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url));
 const current={review:JSON.parse(read('atlas-review/manifest.json')),learner:JSON.parse(read('public/atlas-runtime/head-neck/manifest.json')),limb:JSON.parse(read('public/atlas-runtime/lower-limb/manifest.json'))};
 const old=referenceCatalogueDeliveryRoles(current);assert.equal(old.review.revision,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');assert.equal(old.learner.sourceCommit,old.review.revision);assert.equal(old.limb.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 for(const [key,field]of [['review','revision'],['learner','sourceCommit'],['limb','sourceCommit']]){const bad=structuredClone(current);bad[key][field]='0'.repeat(40);assert.throws(()=>referenceCatalogueDeliveryRoles(bad));}
 assert.throws(()=>referenceCatalogueDeliveryRoles(current,p=>p==='lib/atlas-model-inventory.json'?Buffer.from('{}'):read(p)),/Current delivery changed/);
});

import fs from'node:fs';import assert from'node:assert/strict';import{hash,json}from'./bounded-source-hash-20261026.mjs';
const parent='F:/VisibleMedicine/staging/20261027-related-tour-compare/SOURCE_CANDIDATE.json',p=json(parent),dir='F:/VisibleMedicine/staging/20261027-disclosure-proof-proposal-v2',file='tests/native-disclosure.test.mjs';assert.equal(hash(parent),'f80b70b58d5a22ae18c6ae832305755ec650029f13462847359a6d06de3ce808');assert(!fs.existsSync(dir));fs.mkdirSync(dir+'/tests',{recursive:true});
const edits=[];let source=fs.readFileSync(p.website+'/'+file,'utf8').replaceAll('\r\n','\n');const change=(a,b)=>{assert.equal(source.split(a).length,2,a);source=source.replace(a,b);edits.push([a,b]);};
change("import {restoreNativeDisclosureConsumer} from './native-disclosure-source.mjs';","import {restoreNativeDisclosureConsumer} from './native-disclosure-source.mjs';\nimport {restoreWorkspaceAccessSource,workspaceAccessSourceSha256} from './workspace-access-source-role.mjs';");
change("function fixture(){",`// Bridge only the separately authenticated Workspace access transition. The
// original native-disclosure inverse and every historical assertion stay intact.
function workspaceAtDisclosureEpoch(path,bytes){
 return path==='app/workspace/page.tsx'?restoreWorkspaceAccessSource(path,bytes):bytes;
}
function restoreCurrentConsumer(path,bytes){return restoreNativeDisclosureConsumer(path,workspaceAtDisclosureEpoch(path,bytes));}
function restoreWorkspaceTestEpoch(bytes){
 assert.equal(sha(bytes),'1d609ac330a72b4a0fdbe64bc257a2b11e5af7577422932bed2570b5847e8185','Exact complete outer Workspace test');
 let text=bytes.toString();
 const seams=[
  ["import {restoreWorkspaceAccessSource} from './workspace-access-source-role.mjs';\\n",''],
  ["const source=restoreWorkspaceAccessSource('app/workspace/page.tsx',readFileSync(new URL('../app/workspace/page.tsx',import.meta.url),'utf8')).toString('utf8');","const source=readFileSync(new URL('../app/workspace/page.tsx',import.meta.url),'utf8');"],
 ];
 for(const[from,to]of seams){assert.equal(text.split(from).length,2,'One exact test-loading seam');text=text.replace(from,to);}
 return Buffer.from(text);
}
function fixture(){`);
change("let bytes=readFileSync(new URL('../'+r.path,import.meta.url));if(r.path===", "let bytes=workspaceAtDisclosureEpoch(r.path,readFileSync(new URL('../'+r.path,import.meta.url)));if(r.path==='tests/workspace-embed-disclosure.test.mjs')bytes=restoreWorkspaceTestEpoch(bytes);if(r.path===");
// Retain the old negative cases while making them reject mutations before either inverse.
const testStart=source.indexOf("test('foreign bytes, changed authorization");assert(testStart>0);const beforeTail=source.slice(testStart),afterTail=beforeTail.replaceAll('restoreNativeDisclosureConsumer(','restoreCurrentConsumer(');change(beforeTail,afterTail);
const extraTests=`\ntest('the current Workspace access gate is required before the historical disclosure proof',()=>{
 const path='app/workspace/page.tsx',bytes=readFileSync(new URL('../'+path,import.meta.url));
 assert.equal(sha(bytes),workspaceAccessSourceSha256);
 const historical=workspaceAtDisclosureEpoch(path,bytes);
 assert.notEqual(sha(historical),sha(bytes));assert.throws(()=>workspaceAtDisclosureEpoch(path,historical));
 for(const mutated of [Buffer.concat([bytes,Buffer.from('\\n// foreign')]),Buffer.from(bytes.toString().replace('if (administrator) {','if (true) {'))])assert.throws(()=>restoreCurrentConsumer(path,mutated));
});
test('changed test assertions cannot hide inside the outer test-loading inverse',()=>{
 const bytes=readFileSync(new URL('./workspace-embed-disclosure.test.mjs',import.meta.url));
 assert(Buffer.isBuffer(restoreWorkspaceTestEpoch(bytes)));
 assert.throws(()=>restoreWorkspaceTestEpoch(Buffer.concat([bytes,Buffer.from('\\n')])));
 const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>restoreWorkspaceTestEpoch(changed));
});\n`;
change(afterTail,afterTail+extraTests);fs.writeFileSync(dir+'/EDITS.json',JSON.stringify(edits,null,2)+'\n',{flag:'wx'});fs.writeFileSync(dir+'/'+file,source,{flag:'wx'});const patch={schema:'visible-medicine.patchset/1',installableFiles:[{path:file,beforeSha256:hash(p.website+'/'+file),afterSha256:hash(dir+'/'+file)}]};fs.writeFileSync(dir+'/PATCHSET.json',JSON.stringify(patch,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(dir+'/SUCCESSOR_CONFIG.json',JSON.stringify({schema:'vm-scoped-source-successor/1',stage:'F:/VisibleMedicine/staging/20261027-disclosure-proof-repair-v2',parent:{path:parent,sha256:hash(parent)},patchset:{path:dir+'/PATCHSET.json',sha256:hash(dir+'/PATCHSET.json')},allowedPaths:[file],reason:'Test-only recognition of the exact existing Workspace access transition before the original disclosure proof; unchanged product and authorization code.'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(patch));

// Test-only finite replay of the verified compact epoch and pinned current witness.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const base=new URL('./fixtures/compact-epoch/',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifestSha='999586528bdb759e28f065f10dae4f1343afe8a525e5236b2a6e40d2f2e291c5';
const witnessSha='2a3268e2bab7450aa8461c4e5489a0607ada3f3791f72c633baef5a7cce03e57';
const originalTestSha='7257e974b953d81a4858642fddba053d56f0aa6168a765b9be620a5ce009cdf1';
const originalTest='tests/head-review-compact-preservation.test.mjs';
export const caseNames=Object.freeze([
 'head notes reorder and facial disclosure preserve every original medical fact, scope, ID and independent decision',
 'only declared target handling changes in the navigator; original inert selection, whitelist and surrounding form are exact',
 'the stock Review binder gains exactly one navigator source and no other dependency',
 'all existing current-delivery and preservation assertions survive explicit 1711-to-1712 input enumeration',
 'all original head navigation refusals and assertions remain except the intentionally supported listed SECTION',
]);
function safeName(name){
 assert(typeof name==='string'&&!path.isAbsolute(name)&&!name.includes('\\')&&!name.includes(':')&&
  name.split('/').every(part=>part&&part!=='.'&&part!=='..'),'Finite relative path');
 return name;
}
function rowsOf(file,expected){
 const bytes=fs.readFileSync(new URL(file,base));assert.equal(sha(bytes),expected,'Exact local witness '+file);
 return JSON.parse(bytes);
}
function closure(){
 const manifest=rowsOf('MANIFEST.json',manifestSha);
 assert.equal(manifest.schema,'vm-compact-history-closure/1');
 assert.equal(manifest.sourceSnapshotSha256,'3da619c2dad3cf02655b49a08bb1a131603cdd0389a82e083b61e22871a49af7');
 assert.equal(manifest.sourceRows,5479);assert.equal(manifest.originalTest,originalTest);
 assert.equal(manifest.originalTestSha256,originalTestSha);assert.equal(manifest.files.length,16);
 const snapshotBytes=fs.readFileSync(new URL('FINAL_SOURCE_INPUTS.json.raw',base));
 assert.equal(sha(snapshotBytes),manifest.sourceSnapshotSha256,'Exact verified original source snapshot');
 const snapshot=JSON.parse(snapshotBytes);assert.equal(snapshot.length,manifest.sourceRows);
 const snapshotRows=new Map(snapshot.map(row=>[row.path,row]));assert.equal(snapshotRows.size,snapshot.length);
 const names=new Set();
 for(const row of manifest.files){
  safeName(row.path);assert(!names.has(row.path));names.add(row.path);
  assert.deepEqual(row,snapshotRows.get(row.path),'Closure row from exact original snapshot');
  const bytes=fs.readFileSync(new URL('closure/'+row.path+'.raw',base));
  assert.equal(bytes.length,row.bytes,'Finite historical length '+row.path);
  assert.equal(sha(bytes),row.sha256,'Finite historical bytes '+row.path);
 }
 const source=fs.readFileSync(new URL('closure/'+originalTest+'.raw',base));
 assert.equal(sha(source),originalTestSha,'Complete original test source');
 assert.deepEqual([...source.toString('utf8').matchAll(/^test\('([^']+)'/gm)].map(m=>m[1]),caseNames,'All original case names and order');
 return manifest.files;
}
function currentRoot(){
 const configured=process.env.VM_COMPACT_CURRENT_WEBSITE;
 if(configured){assert(path.isAbsolute(configured),'Explicit current root must be absolute');return fs.realpathSync(configured);}
 return fs.realpathSync(fileURLToPath(new URL('../',import.meta.url)));
}
export function checkedCurrentFiles(names){
 const witness=rowsOf('CURRENT_WITNESS.json',witnessSha);
 assert.equal(witness.schema,'vm-compact-current-witness/1');
 assert.equal(witness.sourceReceiptSha256,'d673e00573725781013a196f2caf040ea36110a06d56f4d879f219582e32a885');
 assert.equal(witness.source,'9cef8900417bf592d3130f6ff92bf3e748cb55fc');
 assert.equal(witness.files.length,11);
 const map=new Map(witness.files.map(row=>[row.path,row]));assert.equal(map.size,11);
 const root=currentRoot(),basePath=root.toLowerCase()+path.sep;
 for(const name of names){
  safeName(name);const row=map.get(name);assert(row,'Declared current witness '+name);
  const file=path.resolve(root,...name.split('/'));
  assert(file.toLowerCase().startsWith(basePath),'Current witness inside checkout');
  const stat=fs.lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular current witness');
  assert(fs.realpathSync(file).toLowerCase().startsWith(basePath),'No current source link escape');
  const bytes=fs.readFileSync(file);
  assert.equal(bytes.length,row.bytes,'Exact current length '+name);
  assert.equal(sha(bytes),row.sha256,'Exact current source '+name);
 }
 return {root,source:witness.source};
}
export function currentSectionInverse(){return import(pathToFileURL(path.join(currentRoot(),'tests/head-review-sections-history-inverse.mjs')).href);}
export function currentDeliveryContract(){return import(pathToFileURL(path.join(currentRoot(),'tests/current-atlas-delivery.mjs')).href);}
function completeTap(tap){
 assert.equal((tap.match(/^TAP version 13\r?$/gm)||[]).length,1,'One original TAP stream');
 assert(!/^Bail out!/im.test(tap),'No original bailout');
 const points=[...tap.matchAll(/^(not )?ok (\d+) - ([^\r\n]+)(?:\r?$)/gm)];
 assert.equal(points.length,5,'All five original points');
 assert.deepEqual(points.map(m=>[m[1]??null,Number(m[2]),m[3]]),caseNames.map((name,i)=>[null,i+1,name]),'Exact original case names, order and pass');
 assert(!/^(?:not )?ok \d+.*#\s*(?:SKIP|TODO)\b/im.test(tap),'No skipped original case');
 const plans=[...tap.matchAll(/^1\.\.(\d+)\r?$/gm)];assert.equal(plans.length,1);assert.equal(Number(plans[0][1]),5);
 const counts={};for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
  const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'One terminal '+key);assert(matches[0].index>plans[0].index,'Terminal counts after plan');
  counts[key]=Number(matches[0][1]);
 }
 assert.deepEqual(counts,{tests:5,pass:5,fail:0,cancelled:0,skipped:0,todo:0});return counts;
}
function materialize(files){
 const parent=fs.realpathSync(process.env.VM_COMPACT_TEMP_ROOT||os.tmpdir());
 assert(fs.statSync(parent).isDirectory(),'Existing temporary parent');
 const folder=fs.mkdtempSync(path.join(parent,'vm-compact-epoch-'));
 const token=randomUUID();fs.writeFileSync(path.join(folder,'.vm-owned'),token);
 for(const row of files){
  const target=path.join(folder,...safeName(row.path).split('/'));
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const bytes=fs.readFileSync(new URL('closure/'+row.path+'.raw',base));fs.writeFileSync(target,bytes,{flag:'wx'});
 }
 return {parent,folder,token};
}
function removeOwned({parent,folder,token},files){
 const realParent=fs.realpathSync(parent),realFolder=fs.realpathSync(folder);
 assert.equal(path.dirname(realFolder).toLowerCase(),realParent.toLowerCase(),'Only direct owned temporary child');
 assert(path.basename(realFolder).startsWith('vm-compact-epoch-'),'Only named owned temporary child');
 assert.equal(fs.readFileSync(path.join(realFolder,'.vm-owned'),'utf8'),token,'Owned temp marker');
 const allowed=new Set(['.vm-owned',...files.map(row=>row.path)]),found=new Set();
 const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name),stat=fs.lstatSync(full);
  assert(!stat.isSymbolicLink(),'No linked temporary entry');
  if(stat.isDirectory())visit(full);else{
   assert(stat.isFile(),'Only regular temporary files');
   const rel=path.relative(realFolder,full).replaceAll('\\','/');assert(allowed.has(rel),'Only owned closure files');found.add(rel);
  }
 }};visit(realFolder);assert.deepEqual(found,allowed,'Exact owned temporary closure');
 fs.rmSync(realFolder,{recursive:true,force:false});
}
let cached;
export function runHistoricalCompact(){
 if(cached)return cached;
 const files=closure(),owned=materialize(files);let result;
 try{
  const env={};for(const key of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])
   if(process.env[key]!==undefined)env[key]=process.env[key];
  Object.assign(env,{TEMP:owned.folder,TMP:owned.folder,NODE_OPTIONS:'--max-old-space-size=512',GIT_OPTIONAL_LOCKS:'0'});
  const child=spawnSync(process.execPath,['--max-old-space-size=512','--test','--test-concurrency=1','--test-reporter=tap',originalTest],
   {cwd:owned.folder,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:8*1024*1024});
  assert.equal(child.error,undefined,String(child.error));assert.equal(child.signal,null,'No child signal');
  assert.equal(child.status,0,child.stderr+'\n'+child.stdout);
  const counts=completeTap(child.stdout);
  result=Object.freeze({sourceSha256:originalTestSha,snapshotSha256:'3da619c2dad3cf02655b49a08bb1a131603cdd0389a82e083b61e22871a49af7',
   tapSha256:sha(Buffer.from(child.stdout)),counts,caseNames});
 }finally{removeOwned(owned,files)}
 closure();cached=result;return cached;
}

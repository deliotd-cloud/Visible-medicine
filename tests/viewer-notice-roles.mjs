// Test-only actual recipe extraction and complete original-context transports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import {finished} from 'node:stream/promises';
import readline from 'node:readline';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {renderThirdPartyNotices} from '../scripts/review-license-notices.mjs';
import {createTestEvidenceDirectory} from '../scripts/test-evidence-directory.mjs';
const FIXTURE_SHA256='e454df9d261970ad6e82f503cced5abfd244fde5e60446aca9f137bc8477478a';
const fixtureBase=new URL('./fixtures/viewer-notice-roles/',import.meta.url);
const site=fileURLToPath(new URL('../',import.meta.url));
const roles=['wave4','admission','guard'];
const entries={wave4:'tests/atlas-current-history-wave4-contract.test.mjs',admission:'tests/notice-history-preservation.test.mjs',guard:'tests/wave4-notice-digest-guard.test.mjs'};
const rawNames={wave4:'original-wave4.mjs.raw',admission:'original-admission.mjs.raw',guard:'original-guard3.mjs.raw'};
const caseCounts={wave4:4,admission:1,guard:3};
const originalHashes={wave4:'67d44d60387a833b16726fdb090d9f28e8231af3f557b90c0a70d496f14eea05',admission:'73bf416154b1f5ecb3d94e551d900582149aa102f25c1509d048ad5be2c47dff',guard:'cf8505c4815bda3498c6bb8fd981a900026b8066be395851ea1ccaa4478edce4'};
const countKeys=['tests','pass','fail','cancelled','skipped','todo'];
export const noticeSha=bytes=>createHash('sha256').update(bytes).digest('hex');
const current445InputsSha='ccb6eb61419e37ed262dba1371cf714082b40dfd86e87a8420293040ccd50915';
const current445WitnessSha='389b9dd188f8640fc6fd180fa39c5652b2f14110c55e463d7d4ba272bdb903bc';
const currentSourceReceipt='F:/VisibleMedicine/staging/20261028-head-search-comparison/SOURCE_CANDIDATE_V2.json';
const latestInputsSha='02b12568072278b7804867e45b12d58086f7ecb539654b943d75ec8ab9880f25';
const latestWitnessSha='036b180f35b295b9c7a10cdc47d03f2f44b7719050bdf38fe836f10639b2cbc1';
const latestSourceReceipt='F:/VisibleMedicine/staging/20261030-head-tour-speed-website/SOURCE_CANDIDATE.json';
const latestSourceReceiptSha='9bcb022985ae614b187e928e28a6bd007a038bc7b4af78effbcb3564df76fa45';
const currentSourceReceiptSha='1ca6a96c8fb27f46e6f62ea25b8c5293079d9b1dea1a0d1039e17e3d3d3e11b0';
const historical727Evidence='F:/VisibleMedicine/staging/20261025-viewer-notice-roles-source/LOCAL_ONLY/inputs.json';
const historical727Tail='F:/VisibleMedicine/staging/20261025-viewer-notice-roles-source/LOCAL_ONLY/historical-tail.txt';
function fixedJson(file,expected){const bytes=fs.readFileSync(file);assert.equal(noticeSha(bytes),expected,'Exact fixed input: '+file);return JSON.parse(bytes);}
function loadCurrent445Role(){
 const f=loadNoticeFixture();
 const preimage=fs.readFileSync(new URL('viewer-notice-roles-before-20261028.mjs.raw',fixtureBase));
 assert.equal(noticeSha(preimage),'2dee063d9d9896274447609a30701982cbea7ee5118dbe3e714fd35a0f87800a','Whole preceding notice helper remains recoverable');
 const current=fixedJson(new URL('current-445-inputs.json.raw',fixtureBase),current445InputsSha);
 const witness=fixedJson(new URL('current-445-recipe-witness.json.raw',fixtureBase),current445WitnessSha);
 const source=fixedJson(currentSourceReceipt,currentSourceReceiptSha);
 const old=fixedJson(historical727Evidence,f.localEvidence.sha256);
 assert.equal(current.schema,'vm-viewer-notice-local-inputs-current-445/1');
 assert.equal(witness.schema,'vm-current-445-review-notice-recipe-witness/1');
 assert.equal(witness.inventory.sha256,current445InputsSha);
 assert.equal(source.atlasHead,current.current.source);
 assert.equal(current.candidateReceipt.sha256,currentSourceReceiptSha);
 assert.equal(current.historical727Evidence.sha256,f.localEvidence.sha256);
 assert.equal(current.historical727Evidence.currentSourceThere,f.current.source);
 assert.equal(old.schema,'vm-viewer-notice-local-inputs/1');
 assert.deepEqual(Object.keys(old.roles).sort(),[...roles].sort());
 assert.equal(current.rowCount,55);assert.equal(current.current.rows.length,55);
 assert.equal(current.current.packages.length,24);assertPackageIdentities(f.packages,current.current.packages);
 const oldRows=new Map(old.current.rows.map(row=>[row.path,row]));
 const sourceRows=new Map(source.sourceRows.map(row=>[row.path,row]));
 const changed=new Set(current.changedCandidateReceiptRows);
 assert.deepEqual([...changed],[
  'atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/manifest.json',
  'public/atlas-review-viewer/manifest.json','public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt',
  'tests/fixtures/current-atlas-delivery.json']);
 assert.equal(current.unchangedAuthenticated727Rows,50);
 assert.deepEqual(current.current.rows.map(row=>row.path),old.current.rows.map(row=>row.path),'Exact finite path set and order');
 for(const row of current.current.rows){
  const expected=changed.has(row.path)?sourceRows.get(row.path):oldRows.get(row.path);
  assert(expected,'Undeclared current notice input: '+row.path);
  assert.equal(row.sha256,expected.sha256,'Current notice row authority: '+row.path);
  assert.equal(row.bytes,expected.bytes,'Current notice row length authority: '+row.path);
 }
 const oldPin=sourceRows.get('tests/fixtures/current-atlas-delivery.json');
 const oldPinWitness=current.current.rows.find(row=>row.path==='tests/fixtures/current-atlas-delivery.json');
 assert.deepEqual(Object.keys(oldPinWitness).sort(),['authority','bytes','path','sha256']);
 assert.equal(oldPinWitness.authority,'fixed-source-candidate-receipt');
 assert.deepEqual({path:oldPinWitness.path,bytes:oldPinWitness.bytes,sha256:oldPinWitness.sha256},oldPin,'Historical445 pin row remains receipt-authenticated');
 assert.equal(oldPin.sha256,'0719262f53c1e98a5b3c79bb07ab81eb70b1470825fb3bfa20d862f0b503057e','Historical445 pin bytes');
 const historicalPin=fixedJson(new URL('current-445-delivery-pin.json.raw',fixtureBase),'0719262f53c1e98a5b3c79bb07ab81eb70b1470825fb3bfa20d862f0b503057e');
 for(const key of ['source','sourceTree','reviewIntegration','runtimeSources','viewerFiles','viewerPackages'])
  assert.deepEqual(current.current[key],historicalPin[key],'Historical445 pinned delivery: '+key);
 assert.equal(current.current.source,source.atlasHead);assert.equal(current.current.sourceTree,source.atlasTree);
 assert.equal(current.current.reviewIntegration,source.reviewBindingSha256);
 assert.equal(current.current.viewerFiles,source.viewerFiles);assert.equal(current.current.viewerPackages,source.viewerPackages);
 assert.equal(witness.builder.sha256,f.recipe.builderSha256);
 assert.equal(witness.builder.fragmentSha256,f.recipe.fragmentSha256);
 assert.equal(witness.builder.outputExpression,f.recipe.outputExpression);
 assert.equal(witness.currentViewer.source,source.atlasHead);
 assert.equal(witness.currentViewer.packageCount,24);
 assert.equal(witness.currentViewer.personalRecordsIncluded,false);
 assert.equal(witness.historicalLicenceTail.sha256,f.oldTail.sha256);
 return {f,current,witness};
}
function loadLatestRole(){
 const {f,current:previous,witness:previousWitness}=loadCurrent445Role();
 const current=fixedJson(new URL('current-9bcb-inputs.json.raw',fixtureBase),latestInputsSha);
 const witness=fixedJson(new URL('current-9bcb-recipe-witness.json.raw',fixtureBase),latestWitnessSha);
 const source=fixedJson(latestSourceReceipt,latestSourceReceiptSha);
 const historicalSite=source.website;
 const pinBytes=fs.readFileSync(path.join(historicalSite,'tests/fixtures/current-atlas-delivery.json'));
 assert.equal(noticeSha(pinBytes),'7b14a7455de0b87e781192d5b1072c9c17c42ab5611c96247a0e7e677b416ac8','Exact latest delivery pin');
 const pin=JSON.parse(pinBytes);
 assert.equal(current.schema,'vm-viewer-notice-local-inputs-current-9bcb/1');
 assert.equal(witness.schema,'vm-current-9bcb-review-notice-recipe-witness/1');
 assert.equal(current.candidateReceipt.sha256,latestSourceReceiptSha);
 assert.equal(current.candidateReceipt.path,latestSourceReceipt);
 assert.equal(witness.sourceReceipt.sha256,latestSourceReceiptSha);
 assert.equal(witness.sourceReceipt.path,latestSourceReceipt);
 assert.equal(witness.previous445WitnessSha256,current445WitnessSha);
 assert.equal(witness.inventory.sha256,latestInputsSha);
 assert.equal(witness.inventory.path,'tests/fixtures/viewer-notice-roles/current-9bcb-inputs.json.raw');
 assert.equal(current.currentPin.path,'tests/fixtures/current-atlas-delivery.json');
 assert.equal(current.currentPin.sha256,noticeSha(pinBytes));
 assert.equal(current.currentPin.source,pin.source);
 assert.equal(current.currentPin.reviewIntegration,pin.reviewIntegration);
 assert.equal(current.rowCount,55);assert.equal(current.current.rows.length,55);
 assert.equal(current.current.packages.length,24);assertPackageIdentities(f.packages,current.current.packages);
 assert.deepEqual(current.current.packages,previous.current.packages,'Exact authenticated package recipe bindings');
 assert.equal(current.historical727Evidence.sha256,f.localEvidence.sha256);
 const changed=[
  'atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/manifest.json',
  'public/atlas-review-viewer/manifest.json','public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt',
  'tests/fixtures/current-atlas-delivery.json'];
 assert.deepEqual(current.changedCandidateReceiptRows,changed,'Only five declared receipt changes');
 assert.equal(current.unchangedAuthenticated727Rows,50);
 assert.deepEqual(current.current.rows.map(row=>row.path),previous.current.rows.map(row=>row.path),'Same finite 55 paths and order');
 const before=new Map(previous.current.rows.map(row=>[row.path,row]));
 const sourceRows=new Map(source.sourceRows.map(row=>[row.path,row]));assert.equal(sourceRows.size,source.sourceRows.length,'Unique sealed source rows');
 for(const row of current.current.rows){
  const old=before.get(row.path),authority=changed.includes(row.path)?sourceRows.get(row.path):old;
  assert(authority,'Missing exact row authority: '+row.path);
  assert.equal(row.sha256,authority.sha256,'Latest row authority: '+row.path);
  assert.equal(row.bytes,authority.bytes,'Latest length authority: '+row.path);
  if(changed.includes(row.path))assert.notEqual(row.sha256,old.sha256,'Declared changed row actually changed: '+row.path);
 }
 assert.equal(source.atlasHead,pin.source);assert.equal(source.atlasTree,pin.sourceTree);
 assert.equal(source.reviewBindingSha256,pin.reviewIntegration);
 for(const key of ['source','sourceTree','reviewIntegration','runtimeSources','viewerFiles','viewerPackages'])
  assert.deepEqual(current.current[key],pin[key],'Latest pinned delivery: '+key);
 assert.equal(witness.builder.sha256,f.recipe.builderSha256);
 assert.equal(witness.builder.fragmentSha256,f.recipe.fragmentSha256);
 assert.equal(witness.builder.outputExpression,f.recipe.outputExpression);
 assert.equal(witness.currentViewer.source,pin.source);
 assert.equal(witness.currentViewer.packageCount,24);
 assert.equal(witness.currentViewer.personalRecordsIncluded,false);
 assert.equal(witness.currentViewer.manifestSha256,sourceRows.get('public/atlas-review-viewer/manifest.json').sha256);
 assert.equal(witness.currentViewer.noticeSha256,sourceRows.get('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt').sha256);
 assert.equal(witness.currentViewer.noticeBytes,sourceRows.get('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt').bytes);
 assert.equal(witness.currentViewer.sourceNoticeSha256,sourceRows.get('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').sha256);
 assert.equal(witness.currentViewer.sourceNoticeBytes,sourceRows.get('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').bytes);
 assert.equal(witness.currentViewer.tailSha256,previousWitness.currentViewer.tailSha256);
 assert.equal(witness.currentViewer.tailBytes,previousWitness.currentViewer.tailBytes);
 assert.equal(witness.historicalLicenceTail.sha256,f.oldTail.sha256);
 return {f,current,witness};
}
function relative(value){assert(typeof value==='string'&&value&&!path.isAbsolute(value)&&!value.includes('\\')&&!value.includes(':')&&!value.includes('\0'),'Explicit relative input');assert(value.split('/').every(p=>p&&p!=='.'&&p!=='..'),'No input traversal');return value;}
export function assertNoticeRow(row,bytes){assert(Buffer.isBuffer(bytes));assert.equal(bytes.length,row.bytes,'Input length changed: '+row.path);assert.equal(noticeSha(bytes),row.sha256,'Input hash changed: '+row.path);}
export function loadNoticeFixture(){
 const bytes=fs.readFileSync(new URL('manifest.json',fixtureBase));assert.equal(noticeSha(bytes),FIXTURE_SHA256,'Exact notice fixture');const f=JSON.parse(bytes);
 assert.equal(f.schema,'vm-viewer-notice-roles/1');assert.deepEqual(f.caseCounts,caseCounts);
 for(const role of roles){assert.equal(f.originals[role].sha256,originalHashes[role]);assertNoticeRow({path:rawNames[role],...f.originals[role]},fs.readFileSync(new URL(rawNames[role],fixtureBase)));}
 assert.equal(f.recipe.builderSha256,'ff794e14a3c95e0404f114d364db370a9ef6059cf0dc90c34f004bf9d856cfc4');
 assert.equal(f.current.source,'727ed5b451ae940a01e56272c8fbc703ea3b0095');return f;
}
function evidence(f){const file=process.env.VM_NOTICE_LOCAL_EVIDENCE;assert(typeof file==='string'&&path.isAbsolute(file),'Explicit VM_NOTICE_LOCAL_EVIDENCE required; no current fallback');const bytes=fs.readFileSync(file);assert.equal(noticeSha(bytes),f.localEvidence.sha256,'Local-only read inventory changed');const e=JSON.parse(bytes);assert.equal(e.schema,'vm-viewer-notice-local-inputs/1');assert.deepEqual(Object.keys(e.roles).sort(),[...roles].sort());return e;}
function checkedRows(root,rows,expected){
 assert(Array.isArray(rows)&&rows.length===expected,'Exact finite input count');const names=new Set(),bytes=new Map();
 for(const row of rows){relative(row.path);assert(!names.has(row.path),'Duplicate finite input');names.add(row.path);assert.match(row.sha256,/^[a-f0-9]{64}$/);assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0);const file=path.join(root,row.path),stat=fs.lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular input required');const b=fs.readFileSync(file);assertNoticeRow(row,b);bytes.set(row.path,b);}
 return bytes;
}
export function assertNoticeIdentity(pin,viewer){
 const {f}=loadLatestRole();const admitted=validateCurrentAtlasDelivery();
 for(const key of ['source','sourceTree','reviewIntegration','runtimeSources','viewerFiles','viewerPackages'])assert.deepEqual(pin[key],admitted[key],'Exact current notice identity: '+key);
 assert.equal(viewer.sourceCommit,admitted.source);assert.equal(viewer.websiteIntegrationSha256,admitted.reviewIntegration);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.packages.length,24);assert.equal(viewer.files.length,admitted.viewerFiles);
 assertPackageIdentities(f.packages,viewer.packages);
}
export function assertPackageIdentities(expected,actual){
 assert(Array.isArray(actual)&&actual.length===expected.length,'Complete package identity set');const map=new Map();
 for(const row of actual){assert(!map.has(row.name),'Duplicate/ambiguous package identity');map.set(row.name,row);}
 for(const row of expected){const value=map.get(row.name);assert(value,'Missing required package: '+row.name);for(const key of ['name','version','license'])assert.equal(value[key],row[key],'Wrong package '+key+': '+row.name);}
}
export function compareNoticeBytes(actual,expected,digest=noticeSha){
 assert.equal(digest(actual),digest(expected),'Notice bytes differ; inspect local source bindings without a large Buffer diff');
 assert.deepEqual(actual,expected,'Exact notice bytes after digest guard');
}
export function noticeSections(bytes){
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes),matches=[...text.matchAll(/^## ([^\r\n ]+) ([^\r\n ]+) \(([^\r\n]+)\)\r?$/gm)],seen=new Set();
 return matches.map((m,i)=>{assert(!seen.has(m[1]),'Duplicate notice section');seen.add(m[1]);return {name:m[1],version:m[2],license:m[3],bytes:Buffer.from(text.slice(m.index,matches[i+1]?.index??text.length))};});
}
export function assertHistoricalNoticeRetention(oldTail,currentTail){
 const f=loadNoticeFixture();assert.equal(oldTail.length,f.oldTail.bytes);assert.equal(noticeSha(oldTail),f.oldTail.sha256,'Genuine historical22 tail');
 const old=noticeSections(oldTail),now=noticeSections(currentTail);assert.equal(old.length,22);assert.equal(now.length,24);const byName=new Map(now.map((p,i)=>[p.name,{...p,index:i}]));let previous=-1;
 for(const row of old){const current=byName.get(row.name);assert(current,'Historical notice missing: '+row.name);assert(current.index>previous,'Historical notice order changed');assert(current.bytes.equals(row.bytes),'Historical notice bytes changed: '+row.name);previous=current.index;}
 assertPackageIdentities(f.packages,now);const oldNames=new Set(old.map(r=>r.name));assert.deepEqual(now.filter(r=>!oldNames.has(r.name)).map(r=>r.name),['its-fine','react-use-measure'],'Exactly the two admitted added notices');
 return {oldPackages:old.length,currentPackages:now.length};
}
export function extractNoticeRecipe(builder){
 const f=loadNoticeFixture(),builderSha=noticeSha(builder);
 if(builderSha==='95b95fad2fa21cad7984d27d22a657d2a6d0764790b6fd1edec3635fb982feeb'){
  const helper=fs.readFileSync(path.join(site,'scripts/review-license-notices.mjs'));
  assert.equal(noticeSha(helper),'0b3fb8f94523d8e34c9ccb54bc7e72d080b959dc1e2e73cf79e02de1d5837624','Exact refactored notice renderer');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(builder);
  assert(text.includes("import { collectRenderedPackages, renderThirdPartyNotices } from './review-license-notices.mjs';"),'Actual builder imports the renderer');
  assert(text.includes("renderThirdPartyNotices(packages, manifest.revision,\n    readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md', 'utf8'))"),'Actual builder writes the rendered source notice');
  return new TextDecoder('utf-8',{fatal:true}).decode(helper);
 }
 assert.equal(builderSha,f.recipe.builderSha256,'Actual builder source changed');const text=new TextDecoder('utf-8',{fatal:true}).decode(builder),a=text.indexOf(f.recipe.start),b=text.indexOf(f.recipe.end);
 assert(a>=0&&b>a&&text.indexOf(f.recipe.start,a+f.recipe.start.length)===-1&&text.indexOf(f.recipe.end,b+f.recipe.end.length)===-1,'Exact read-only recipe boundaries');
 const fragment=text.slice(a,b);assert.equal(noticeSha(Buffer.from(fragment)),f.recipe.fragmentSha256,'Exact original recipe fragment');
 assert(!fragment.includes('writeFileSync')&&!fragment.includes('await build'),'No CLI generation side effects in recipe');
 const output=/^writeFileSync\('public\/atlas-review-viewer\/THIRD_PARTY_NOTICES\.txt', ([^\r\n]+)\);/m.exec(text);assert(output,'Actual output expression');assert.equal(output[1],f.recipe.outputExpression,'Exact builder output expression');return fragment;
}
export function readCurrentNoticeInputs(){
 const {f,current:historical,witness}=loadLatestRole(),pin=validateCurrentAtlasDelivery();
 const current=structuredClone(historical),rows=new Map(current.current.rows.map(row=>[row.path,row]));
 const changed=current.changedCandidateReceiptRows;
 assert.deepEqual(changed,[
  'atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/manifest.json',
  'public/atlas-review-viewer/manifest.json','public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt',
  'tests/fixtures/current-atlas-delivery.json']);
 const source=execFileSync('git',['--no-replace-objects','-C',currentAtlasDeliveryRoot(),'show',pin.source+':LICENSES/THIRD_PARTY_NOTICES.md'],{windowsHide:true,maxBuffer:8*1024*1024});
 const actualSource=fs.readFileSync(path.join(site,changed[0]));compareNoticeBytes(actualSource,source);
 const review=JSON.parse(fs.readFileSync(path.join(site,changed[1])));
 const imported=review.files.find(row=>row.path==='LICENSES/THIRD_PARTY_NOTICES.md');assert(imported);
 assert.equal(imported.sourceSha256,noticeSha(source));assert.equal(imported.importedSha256,noticeSha(actualSource));
 const viewer=JSON.parse(fs.readFileSync(path.join(site,changed[2])));
 const output=fs.readFileSync(path.join(site,changed[3]));
 assert.equal(viewer.files.find(row=>row.path==='THIRD_PARTY_NOTICES.txt')?.sha256,noticeSha(output));
 const pinBytes=fs.readFileSync(path.join(site,changed[4]));assert.deepEqual(JSON.parse(pinBytes),pin);
 for(const file of changed){const bytes=fs.readFileSync(path.join(site,file)),row=rows.get(file);assert(row);row.sha256=noticeSha(bytes);row.bytes=bytes.length;}
 // The old 55-row witness remains sealed above. The current builder moved its
 // pure notice loop into a separately bound helper, so authenticate both exact
 // production inputs from the current Review integration receipt.
 const receipt=JSON.parse(fs.readFileSync(path.join(site,'atlas-review/integration-inputs.json')));
 assert.equal(receipt.sourceCommit,pin.source);assert.equal(receipt.sha256,pin.reviewIntegration);
 for(const [file,expected] of [
  ['scripts/build-clinical-review-viewer.mjs','95b95fad2fa21cad7984d27d22a657d2a6d0764790b6fd1edec3635fb982feeb'],
  ['scripts/review-license-notices.mjs','0b3fb8f94523d8e34c9ccb54bc7e72d080b959dc1e2e73cf79e02de1d5837624'],
 ]){
  const bytes=fs.readFileSync(path.join(site,file));assert.equal(noticeSha(bytes),expected,`Exact current notice recipe: ${file}`);
  assert.equal(receipt.inputs.find(row=>row.path===file)?.sha256,expected,`Review-bound notice recipe: ${file}`);
  const row=rows.get(file);if(row){row.sha256=expected;row.bytes=bytes.length;}
  else{const added={path:file,sha256:expected,bytes:bytes.length};current.current.rows.push(added);rows.set(file,added);current.rowCount++;}
 }
 assert.equal(rows.get(changed[1]).sha256,pin.documents[changed[1]]);
 assert.equal(rows.get(changed[2]).sha256,pin.documents[changed[2]]);
 Object.assign(current.current,{source:pin.source,sourceTree:pin.sourceTree,reviewIntegration:pin.reviewIntegration,
  runtimeSources:pin.runtimeSources,viewerFiles:pin.viewerFiles,viewerPackages:pin.viewerPackages});
 current.currentPin={path:changed[4],sha256:noticeSha(pinBytes),source:pin.source,reviewIntegration:pin.reviewIntegration};
 const e={current:current.current};return {f,e,bytes:checkedRows(site,e.current.rows,current.rowCount),current,witness};
}
export function assertNoticeCurrentPrefix(){const f=loadNoticeFixture(),bytes=fs.readFileSync(path.join(site,'tests/viewer-notice-current.test.mjs'));assert.equal(noticeSha(bytes.subarray(0,f.prefix.bytes)),f.prefix.sha256,'All original first-three current case bodies/setup are byte-exact');}
export function assertNoticePackageSource(binding,pkg,lock){
 relative(binding.packageJson);assert(binding.packageJson.endsWith('/package.json'),'Explicit package metadata file');assertPackageIdentities([binding],[pkg]);const packageDir=binding.packageJson.slice(0,-'/package.json'.length);assert(lock.packages&&Object.hasOwn(lock.packages,packageDir),'Recorded package location absent from lock');assert.equal(lock.packages[packageDir].version,binding.version,'Locked version/source mismatch');return packageDir;
}
export function readHistoricalNoticeTail(){
 const f=loadNoticeFixture();fixedJson(historical727Evidence,f.localEvidence.sha256);
 const bytes=fs.readFileSync(historical727Tail);assert.equal(bytes.length,f.oldTail.bytes);assert.equal(noticeSha(bytes),f.oldTail.sha256,'Supporting historical tail bytes');return bytes;
}
function currentRecipe(f,e,bytes){
 assert(Array.isArray(e.current.packages)&&e.current.packages.length===24);assertPackageIdentities(f.packages,e.current.packages);
 const lock=JSON.parse(bytes.get('package-lock.json')),packages=new Map(),dirs=new Map();
 for(const binding of e.current.packages){
  relative(binding.packageJson);const pkgBytes=bytes.get(binding.packageJson);assert(pkgBytes,'Package source outside exact input set');assert.equal(noticeSha(pkgBytes),binding.packageJsonSha256);const pkg=JSON.parse(pkgBytes);
  const packageDir=assertNoticePackageSource(binding,pkg,lock);
  const directory=path.join(site,packageDir);assert(!dirs.has(directory),'Ambiguous package directory');
  const licenseNames=[];for(const source of binding.noticeSources){assert(bytes.has(source.path),'Notice source outside exact input set');assertNoticeRow(source,bytes.get(source.path));if(path.posix.dirname(source.path)===packageDir)licenseNames.push(path.posix.basename(source.path));else assert.equal(source.path,'LICENSES/clinical-review/react-three-fiber-LICENSE.txt','Only declared Fiber fallback may be outside package root');}
  assert(licenseNames.length>0||(binding.name==='@react-three/fiber'&&binding.version==='9.7.0'),'Missing selected notice source');
  dirs.set(directory,licenseNames.sort());packages.set(binding.name,{...pkg,directories:[directory]});
 }
 const readFileSync=(file,encoding)=>{assert.equal(encoding,'utf8');const abs=path.resolve(site,file),rel=path.relative(site,abs).replaceAll('\\','/');relative(rel);assert(bytes.has(rel),'Recipe attempted undeclared read');return bytes.get(rel).toString('utf8');};
 const readdirSync=directory=>{const abs=path.resolve(directory);assert(dirs.has(abs),'Recipe attempted undeclared directory');const names=fs.readdirSync(abs),selected=names.filter(n=>/^(license|licence|notice|copying|ofl)(\.|$)/i.test(n)).sort();assert.deepEqual(selected,dirs.get(abs),'Package notice selection changed');return names;};
 extractNoticeRecipe(bytes.get('scripts/build-clinical-review-viewer.mjs'));
 assert.equal(noticeSha(bytes.get('scripts/review-license-notices.mjs')),'0b3fb8f94523d8e34c9ccb54bc7e72d080b959dc1e2e73cf79e02de1d5837624');
 // Both exact files are bound in the Review receipt; execute only the current
 // pure renderer. The package source/selection guards above remain in force.
 const manifest=JSON.parse(bytes.get('atlas-review/manifest.json'));
 return Buffer.from(renderThirdPartyNotices([...packages.values()],manifest.revision,
  readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8')));
}
export function verifyCurrentNotice({pin,viewerManifest,source,viewer,oldTail}){
 const {f,e,bytes,current,witness}=readCurrentNoticeInputs();assertNoticeCurrentPrefix();assertNoticeIdentity(pin,viewerManifest);assert.equal(fs.realpathSync(process.cwd()),fs.realpathSync(site),'Actual current recipe cwd');
 const canonical=value=>noticeSha(Buffer.from(JSON.stringify(value)));
 assert.equal(canonical(pin),canonical(JSON.parse(bytes.get('tests/fixtures/current-atlas-delivery.json'))),'Actual current delivery pin argument');
 assert.equal(canonical(viewerManifest),canonical(JSON.parse(bytes.get('public/atlas-review-viewer/manifest.json'))),'Actual Viewer manifest argument');
 assert(bytes.get('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').equals(source),'Actual imported/source-bound notice differs');assert(bytes.get('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt').equals(viewer),'Actual Viewer input differs');
 const expected=currentRecipe(f,e,bytes);compareNoticeBytes(viewer,expected);const entry=viewerManifest.files.find(r=>r.path==='THIRD_PARTY_NOTICES.txt');assert(entry);assert.equal(entry.sha256,noticeSha(viewer));
 const prefix=Buffer.from('# Clinical Review third-party notices\n\nAtlas source: '+pin.source+'\n\n');assert(viewer.subarray(0,prefix.length).equals(prefix),'Current source framing');
 assert(viewer.subarray(prefix.length,prefix.length+source.length).equals(source),'Complete current source notice');const tail=viewer.subarray(prefix.length+source.length);assert.equal(tail.length,witness.currentViewer.tailBytes);assert.equal(noticeSha(tail),witness.currentViewer.tailSha256,'Exact retained 24-package tail');const result=assertHistoricalNoticeRetention(oldTail,tail);
 const after=readCurrentNoticeInputs();assert.equal(after.f.localEvidence.sha256,f.localEvidence.sha256);assert.equal(after.current.current.source,current.current.source);compareNoticeBytes(after.bytes.get('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'),viewer);assertNoticeCurrentPrefix();return {...result,sha256:noticeSha(viewer)};
}

export function assertCompleteNoticeChild(result,tap,expected){
 assert.equal(result.error,undefined,'Original child transport/start failure');assert.equal(result.signal,null,'Original child signalled');assert.equal(result.code,0,'Original child failed; inspect local evidence');
 assert.equal([...tap.matchAll(/^TAP version 13\r?$/gm)].length,1,'One real standalone TAP stream');
 assert(!/^\s*not ok\b/im.test(tap),'Failed point contradicts success');assert(!/^\s*(?:not )?ok\b[^\r\n]*#\s*(?:skip|todo)\b/im.test(tap),'Skipped/TODO point contradicts success');assert(!/^\s*Bail out!/im.test(tap),'No bailout');
 const counts={};for(const key of countKeys){const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,'One terminal '+key);counts[key]=Number(matches[0][1]);}
 assert.deepEqual(counts,{tests:expected,pass:expected,fail:0,cancelled:0,skipped:0,todo:0},'Every original case must pass');
 const plans=[...tap.matchAll(/^1\.\.(\d+)\r?$/gm)],points=[...tap.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)];assert.equal(plans.length,1,'One final plan');assert.equal(Number(plans[0][1]),expected,'Exact whole original root');assert.deepEqual(points.map(m=>Number(m[1])),Array.from({length:expected},(_,i)=>i+1),'All original points, no duplicates/missing roots');assert(plans[0].index>points.at(-1).index,'Plan follows points');for(const key of countKeys)assert(tap.lastIndexOf('# '+key+' ')>plans[0].index,'Counts follow plan');return counts;
}
export function noticeChildEnvironment(environment,native){
 const env={};for(const key of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','TEMP','TMP','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])if(environment[key]!==undefined)env[key]=environment[key];
 Object.assign(env,{NODE_OPTIONS:'--max-old-space-size=768',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',WRANGLER_SEND_METRICS:'false'});
 if(native)Object.assign(env,{VM_ATLAS_SOURCE_REPO:native,ATLAS_SOURCE_REPO:native});return env;
}
function explicitRoot(name){const root=process.env[name];assert(typeof root==='string'&&root,name+' is required; no current fallback');return fs.realpathSync(root);}
function roleRoots(role){
 const key={wave4:'VM_NOTICE_WAVE4_WEBSITE',admission:'VM_NOTICE_ADMISSION_WEBSITE',guard:'VM_NOTICE_GUARD_WEBSITE'}[role];const root=explicitRoot(key);assert.notEqual(root,fs.realpathSync(site),'Historical/current Website separation');
 return {website:root,...(role==='wave4'?{native:explicitRoot('VM_NOTICE_WAVE4_ATLAS')}:{})};
}
function git(root,args,bytes=false){return execFileSync('git',['--no-replace-objects','-C',root,...args],{windowsHide:true,encoding:bytes?undefined:'utf8',env:noticeChildEnvironment(process.env),maxBuffer:8*1024*1024});}
function verifyHistorical(role,f,e,r){
 const input=e.roles[role];assert.equal(input.entry,entries[role]);assert.equal(input.cases,caseCounts[role]);checkedRows(r.website,input.rows,f.localEvidence.roleRows[role]);
 const receipt={wave4:'../TEST_READY_SOURCE.json',admission:'../PREPARATION.json',guard:'../SOURCE_CANDIDATE.json'}[role];assert.equal(input.receipt.relative,receipt);assert.equal(noticeSha(fs.readFileSync(path.resolve(r.website,receipt))),f.receipts[role],'Original context receipt');assert.equal(input.receipt.sha256,f.receipts[role]);
 const original=fs.readFileSync(new URL(rawNames[role],fixtureBase));assert(original.equals(fs.readFileSync(path.join(r.website,entries[role]))),'Actual whole original module URI must contain exact fixture bytes');
 assert.equal(noticeSha(fs.readFileSync(path.join(site,entries[role]))),f.collectors[role],'Exact current collector');
 if(role==='wave4'){
  assert.equal(input.source,f.historicalNative.source);assert.equal(input.tree,f.historicalNative.tree);assert.equal(input.pinSha256,f.historicalNative.pinSha256);
  assert.equal(fs.realpathSync(git(r.native,['rev-parse','--show-toplevel']).trim()),r.native,'Native repository root');assert.equal(git(r.native,['rev-parse','HEAD']).trim(),input.source,'Native6d7 HEAD');assert.equal(git(r.native,['rev-parse','HEAD^{tree}']).trim(),input.tree,'Native6d7 tree');assert(git(r.native,['status','--porcelain']).trim()==='','Native worktree must be clean');
  assert.equal(noticeSha(fs.readFileSync(path.join(r.website,'tests/fixtures/current-atlas-delivery.json'))),input.pinSha256,'Exact historical46file/22package pin');
  for(const [scope,rows]of [['native',input.nativeCommits],['website',input.websiteCommits]])for(const row of rows){assert.equal(git(r[scope],['rev-parse',row.revision+'^{commit}']).trim(),row.revision,'Exact required historical commit');}
  assert.equal(input.gitObjects.length,f.localEvidence.gitObjects,'Exact immutable blob read set');const seen=new Set();for(const row of input.gitObjects){assert(['native','website'].includes(row.scope));assert.match(row.revision,/^[a-f0-9]{40}$/);relative(row.path);const key=row.scope+':'+row.revision+':'+row.path;assert(!seen.has(key),'Unique historical blob');seen.add(key);assert.equal(noticeSha(git(r[row.scope],['show',row.revision+':'+row.path],true)),row.sha256,'Immutable historical blob bytes changed: '+row.path);}
 }
}
export async function runOriginalNoticeRole(role){
 assert(roles.includes(role),'Exact declared notice role');const f=loadNoticeFixture(),e=evidence(f),r=roleRoots(role);verifyHistorical(role,f,e,r);
 const dir=createTestEvidenceDirectory(site,'viewer-notice-role-runs',{evidenceRoot:process.env.VM_TEST_EVIDENCE_ROOT,label:role});
 const out=fs.createWriteStream(path.join(dir,'child.tap'),{flags:'wx'}),err=fs.createWriteStream(path.join(dir,'child.stderr.log'),{flags:'wx'});
 const args=['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',entries[role]];
 const child=spawn(process.execPath,args,{cwd:r.website,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env:noticeChildEnvironment(process.env,r.native)});child.stdout.pipe(out);child.stderr.pipe(err);
 const save=(name,value)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});save('started.json',{role,pid:child.pid,parentPid:process.pid,args,cwd:r.website,entry:entries[role],cases:caseCounts[role],localEvidenceSha256:f.localEvidence.sha256});
 const result=await new Promise(resolve=>{let error;child.once('error',e=>{error=String(e)});child.once('close',(code,signal)=>resolve({code,signal,...(error?{error}:{})}))});await Promise.all([finished(out),finished(err)]);
 let inputError;try{const after=loadNoticeFixture();verifyHistorical(role,after,evidence(after),r)}catch(error){inputError=String(error)}
 let tap='';const lines=readline.createInterface({input:fs.createReadStream(path.join(dir,'child.tap')),crlfDelay:Infinity});for await(const line of lines)if(/^(?:TAP version|\s*(?:not )?ok\b|1\.\.|# (?:tests|pass|fail|cancelled|skipped|todo) |\s*Bail out!)/i.test(line))tap+=line+'\n';
 let counts,transportError;try{counts=assertCompleteNoticeChild(result,tap,caseCounts[role])}catch(error){transportError=String(error)}save('terminal.json',{role,...result,counts:counts??null,expectedCases:caseCounts[role],inputsStable:!inputError,inputError:inputError??null,transportError:transportError??null,passing:!inputError&&!transportError,clinicalApproval:false,licensingClearance:false});
 assert(!inputError,'Original notice inputs changed; local evidence: '+dir);assert(!transportError,'Original notice role did not complete unchanged; local evidence: '+dir);return {role,counts,evidence:dir};
}

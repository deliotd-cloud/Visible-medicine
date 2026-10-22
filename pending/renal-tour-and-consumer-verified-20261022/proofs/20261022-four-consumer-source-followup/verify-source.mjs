import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {restorePreNeckDelivery,restorePreNeckImporter,restoreAtlas190HistoricalTest,restoreSurfaceDesktopHistoricalTest} from '../CODE/tests/four-consumer-source-inverse.mjs';

const proposal='F:/VisibleMedicine/staging/20261022-four-consumer-source-followup/';
const frozen='F:/VisibleMedicine/staging/20261022-spinal-shoulder-history-successor/';
const site=frozen+'website/';
const sha=value=>createHash('sha256').update(value).digest('hex');
assert.equal(sha(readFileSync(frozen+'SOURCE.json')),'ff37b7b498682fed64b4a593a91bdc0584757a6dff208b844345cf5748c49f8e');

const rows=[
 ['atlas190-current-delivery.test.mjs','b198b7505c9ac9bc826d2a952ac4fcad8760dbdc250d0a488a8c09a0526b9ad3','2fd1d412272c940c014b12dc5ecef7483f7bee19fe3c3e60e584284e1ad12733','ca323d1248f3043f1d73edf29020acd1f283e80b8f299c93452b5378a74bf819',4],
 ['colic-adapter-inverse.test.mjs','2c8c34f331fa4789a60dc087e9eae67f482285ef80f81a68b9c1bd19bb86a3dc','cfcaa8e253a9699aba33383c13c43d718ad17aa62534583ed9ba31208fcdd567','6835a14e7e5c08f3e83c93d8f61942485e54cad4fc399cae4ba540d54ee857fb',6],
 ['current-delivery-admission-485.test.mjs','44a61494ef1a2bf577b6aed4937d7d99dc855a0eb4e1eda6445393696010461f','cd62ac7ad157eb93c5fb225f585569c599dae5cd0eee9ddff6cef6e022d7a192','f7a20dbe231fbbdb13502501d7a71f9e4cfb0983f1a0ce8857d21f815d98a8ca',2],
 ['current-head-index-whole-role-transition-20261021.test.mjs','e6e0bf4d9fb2255a971c645a48838c98ab124669ef392956793b6265acdf01d0','e59a4aa67d69c6c9cb77dc35ee683b5d68a4cbba8a56c512bb28d74e91319c07','94d971b0d4f33dec9cdc124fb5a5a1f1bd6fa9920d2f5ad8f2c03bc6c5142259',4],
];
function inverse(newText,patch){
 const lines=newText.split('\n');
 const hunks=[...patch.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@[^\n]*\n((?:(?!^@@ ).*\n?)*)/gm)];
 for(const match of hunks.reverse()){
  const count=Number(match[4]??1),at=Number(match[3])-(count===0?0:1);
  const oldLines=[],newLines=[];
  for(const row of match[5].replace(/\n$/,'').split('\n')){
   if(row.startsWith('-'))oldLines.push(row.slice(1));
   else if(row.startsWith('+'))newLines.push(row.slice(1));
   else if(row!=='')throw Error('Unexpected diff context');
  }
  assert.equal(oldLines.length,Number(match[2]??1));assert.equal(newLines.length,count);
  assert.deepEqual(lines.slice(at,at+count),newLines);
  lines.splice(at,count,...oldLines);
 }
 return lines.join('\n');
}
for(const [name,rawHash,codeHash,patchHash,hunks] of rows){
 const rawPath=proposal+'RAW/tests/'+name,codePath=proposal+'CODE/tests/'+name;
 const raw=readFileSync(rawPath),code=readFileSync(codePath);
 assert.equal(sha(raw),rawHash,name+' raw');assert.equal(sha(code),codeHash,name+' code');
 assert.deepEqual(raw,readFileSync(site+'tests/'+name),name+' frozen preimage');
 const diff=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',rawPath,codePath],{encoding:'utf8'});
 assert.equal(diff.status,1,name+' changed');assert.equal(diff.stderr,'');
 const patch=diff.stdout.slice(diff.stdout.indexOf('@@ '));
 assert.equal((patch.match(/^@@ /gm)||[]).length,hunks,name+' declared hunk count');
 assert.equal(sha(patch),patchHash,name+' exact full seam text');
 assert.equal(inverse(code.toString('utf8'),patch),raw.toString('utf8'),name+' whole original source restored');
 console.log('whole-source inverse '+name);
}
assert.equal(sha(readFileSync(proposal+'CODE/tests/four-consumer-source-inverse.mjs')),'ecc4f96cfa0c495ea2fe45519774ccc90a5b4bf66efce2834917431991efca38');

const read=p=>readFileSync(site+p);
const colicRaw=readFileSync(proposal+'RAW/tests/colic-adapter-inverse.test.mjs','utf8');
const rowText=colicRaw.slice(colicRaw.indexOf('const rows=['),colicRaw.indexOf('];',colicRaw.indexOf('const rows=[')));
const rowNames=[...rowText.matchAll(/\['([^']+\.(?:mjs|ts))',\d+,/g)].map(match=>match[1]);
assert.equal(rowNames.length,13,'All original colic theorem inputs enumerated');
const oldSite='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor/website/';
const changedRows=rowNames.filter(name=>sha(readFileSync(oldSite+'tests/'+name))!==sha(read('tests/'+name)));
assert.deepEqual(changedRows,['desktop-learning-row-history.test.mjs'],'Only the desktop theorem input changed between source receipts');

const currentDelivery=read('tests/current-atlas-delivery.test.mjs');
const preNeck=restorePreNeckDelivery(currentDelivery,
 read('tests/fixtures/head-surface-before-20261022/tests__current-atlas-delivery.test.mjs.raw'),
 read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw'));
const preNeckImporter=restorePreNeckImporter(read('scripts/import-clinical-review.mjs'),
 read('tests/fixtures/colic-fa1-preimage/import-clinical-review.mjs.raw'));
const atlas190Original=restoreAtlas190HistoricalTest(readFileSync(proposal+'CODE/tests/atlas190-current-delivery.test.mjs'));
assert.deepEqual(atlas190Original,read('tests/atlas190-current-delivery.test.mjs'));
const desktopCurrent=read('tests/desktop-learning-row-history.test.mjs');
const desktopPrior=restoreSurfaceDesktopHistoricalTest(desktopCurrent);
assert.equal(sha(desktopPrior),'189e900c45910ac63e2227098c0e4187eb69c9854018c893fc172ddaf32639c9');
assert.deepEqual(desktopPrior,readFileSync(oldSite+'tests/desktop-learning-row-history.test.mjs'));
const wider=await import(pathToFileURL(site+'tests/head-tools-wider-consumer-inverse.mjs'));
assert.equal(sha(wider.restoreHeadToolsWiderConsumer('desktop-learning-row-history.test.mjs',desktopPrior)),
 '8c94803ea09e9389837e1b46ea41d52701e115ac1bed55f4e58444365141ca51');
const colic=await import(pathToFileURL(site+'tests/colic-later-source-inverse.mjs'));
assert.equal(sha(colic.restoreColicLaterSource('current-atlas-delivery.test.mjs',preNeck)),'799e1b3935e6687bb47a025e5bff33acaee2c813dff83d8bec652f1102ae3b9b');
assert.equal(sha(colic.restoreColicLaterSource('atlas190-current-delivery.test.mjs',atlas190Original)),'ee51701b213d8a7b2720c5243146b286683cb791d48d5775c23f02501f842198');
const pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
const bindingBytes=read('atlas-review/integration-inputs.json'),binding=JSON.parse(bindingBytes);
assert.equal(pin.source,'389bd0ca846a42c7f21055f55904bcf5df81a09f');
assert.equal(pin.sourceTree,'25acdee40ee57e0253cdcca924aa64b4b38586c8');
assert.equal(pin.reviewIntegration,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');
assert.equal(pin.reviewSourceFiles,1560);assert.equal(binding.inputs.length,1727);
assert.equal(sha(bindingBytes),'e1fdb1e5140dffa5fdb78d94b23738eecbf25157b626baa6c8c56929ecdd4b5f');
assert.equal(binding.sha256,pin.reviewIntegration);
assert.equal(sha(preNeckImporter),'79b35cb768676eb22f8eaa5785e71b76a588f9de00f78bdb47a73e37bfc4b1b1');

const mutations=[
 ['current delivery',()=>restorePreNeckDelivery(Buffer.from(currentDelivery.toString().replace('assert(artifacts>100)','assert(artifacts>0)')),
  read('tests/fixtures/head-surface-before-20261022/tests__current-atlas-delivery.test.mjs.raw'),read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw'))],
 ['importer',()=>restorePreNeckImporter(Buffer.from(read('scripts/import-clinical-review.mjs').toString().replace('389bd0ca','389bd0cb')),read('tests/fixtures/colic-fa1-preimage/import-clinical-review.mjs.raw'))],
 ['atlas190',()=>restoreAtlas190HistoricalTest(Buffer.from(readFileSync(proposal+'CODE/tests/atlas190-current-delivery.test.mjs','utf8').replace('assert(m[k]===false','assert(m[k]===true')))],
 ['historical colic',()=>{const bad=Buffer.from(preNeck);bad[0]^=1;colic.restoreColicLaterSource('current-atlas-delivery.test.mjs',bad);}],
 ['surface desktop',()=>{const bad=Buffer.from(desktopCurrent);bad[0]^=1;restoreSurfaceDesktopHistoricalTest(bad);} ],
];
for(const [name,run] of mutations){assert.throws(run,name+' mutation refused');console.log('refused '+name+' mutation');}
console.log('PASS four whole original test sources, four exact epoch inverses, all 13 colic inputs checked, current389 scalars, five mutations');

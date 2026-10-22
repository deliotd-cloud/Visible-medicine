// Authenticate the two changed test-source roles before their original whole-history proofs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-tools-bound-successor',sourcePath=root+'/BUILT_SOURCE.json',source=json(sourcePath),website=source.website;
assert.equal(sha(read(sourcePath)),'b1c8248969db0df0ab77da5458c08b744bceac1a5105af435a9c6eafc6a5f142');
assert.equal(json(root+'/native-built/TERMINAL.json').counts.fail,2);
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
const worker='F:/VisibleMedicine/staging/20261022-head-tools-role-admission';
assert.equal(sha(read(worker+'/HANDOFF.json')),'9d9dd2469a12660a099fc6debc1c6e8a7e226e7b4f4504fdd0b6936069353d4b');
assert.equal(sha(read(worker+'/CODE/tests/head-disclosure-current-delivery.test.mjs')),'999704133a16bff87fb69948a0ef67ba3b5973218235ee3b99ef2d455cbfe58d');
const own='F:/VisibleMedicine/staging/20261022-head-tools-consumer-admission';assert(!fs.existsSync(own));
for(const kind of ['CODE','RAW'])fs.mkdirSync(own+'/'+kind+'/tests',{recursive:true});
function hunks(before,after){
 const a=before.split('\n'),b=after.split('\n'),dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const edits=[];let i=0,j=0,open=null;const flush=()=>{if(open){edits.push(open);open=null;}};
 while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}if(!open)open={beforeStart:i,afterStart:j,removed:[],added:[]};if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))open.removed.push(a[i++]);else open.added.push(b[j++]);}flush();return edits;
}
const specs={};
for(const name of ['head-filtered-layout.test.mjs','head-disclosure-current-delivery.test.mjs']){
 const before=read(worker+'/RAW/tests/'+name),after=read(worker+'/CODE/tests/'+name);
 assert.deepEqual(before,read(website+'/tests/'+name));assert.deepEqual(Buffer.from(after.toString()),after);
 specs[name]={beforeSha256:sha(before),afterSha256:sha(after),hunks:hunks(before.toString(),after.toString())};
 assert(specs[name].hunks.length>0&&specs[name].hunks.length<5);
}
const helper=`// Test-only exact current-to-pre-tools source roles; no current production or delivery substitution.\nimport assert from 'node:assert/strict';\nimport {createHash} from 'node:crypto';\nconst sha=b=>createHash('sha256').update(b).digest('hex');\nconst specs=${JSON.stringify(specs,null,2)};\nexport function restoreHeadToolsTestRole(name,bytes){\n const spec=specs[name];assert(spec,'Only two explicit historical test roles');\n assert.equal(sha(bytes),spec.afterSha256,name+': authenticated complete current test source');\n const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes,'Lossless current source');\n const lines=text.split('\\n');\n for(const hunk of spec.hunks.toReversed()){assert.deepEqual(lines.slice(hunk.afterStart,hunk.afterStart+hunk.added.length),hunk.added,'Complete exact later hunk');lines.splice(hunk.afterStart,hunk.added.length,...hunk.removed);}\n const before=Buffer.from(lines.join('\\n'));assert.equal(sha(before),spec.beforeSha256,name+': authenticated complete prior test source');\n const forward=before.toString().split('\\n');\n for(const hunk of spec.hunks.toReversed()){assert.deepEqual(forward.slice(hunk.beforeStart,hunk.beforeStart+hunk.removed.length),hunk.removed,'Complete exact original hunk');forward.splice(hunk.beforeStart,hunk.removed.length,...hunk.added);}\n assert.equal(forward.join('\\n'),text,'Complete round-trip, including every later assertion');return before;\n}\n`;
fs.writeFileSync(own+'/CODE/tests/head-tools-test-source-role.mjs',helper,{flag:'wx'});
const importLine="import {restoreHeadToolsTestRole} from './head-tools-test-source-role.mjs';\n";
const consumers=['head-disclosure-role-preservation-20261021.test.mjs','current-head-index-whole-role-transition-20261021.test.mjs'];
for(const name of consumers){
 const before=read(website+'/tests/'+name);fs.writeFileSync(own+'/RAW/tests/'+name,before,{flag:'wx'});let text=before.toString();
 const anchor="import {createHash} from 'node:crypto';\n";assert.equal(text.split(anchor).length,2);text=text.replace(anchor,anchor+importLine);
 const from=name===consumers[0]?"const candidate=read('./head-disclosure-current-delivery.test.mjs').toString();":"     :read(name);";
 const to=name===consumers[0]?"const candidate=restoreHeadToolsTestRole('head-disclosure-current-delivery.test.mjs',read('./head-disclosure-current-delivery.test.mjs')).toString();":"     :name==='head-filtered-layout.test.mjs'?restoreHeadToolsTestRole(name,read(name)):read(name);";
 assert.equal(text.split(from).length,2,name+': exact sole source read');text=text.replace(from,to);
 assert.equal(text.replace(importLine,'').replace(to,from),before.toString(),name+': every historical assertion/body/refusal remains byte exact');
 fs.writeFileSync(own+'/CODE/tests/'+name,text,{flag:'wx'});
}
const regression=`import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';\nimport {restoreHeadToolsTestRole} from './head-tools-test-source-role.mjs';\nconst sha=b=>createHash('sha256').update(b).digest('hex');\nconst expected=${JSON.stringify(Object.fromEntries(Object.entries(specs).map(([name,spec])=>[name,spec.beforeSha256])))};\nfor(const [name,digest] of Object.entries(expected)){\n const actual=readFileSync(new URL('./'+name,import.meta.url));\n test(name+': entire earlier contract is reconstructed and authenticated',()=>assert.equal(sha(restoreHeadToolsTestRole(name,actual)),digest));\n test(name+': appended unknown source is refused',()=>assert.throws(()=>restoreHeadToolsTestRole(name,Buffer.concat([actual,Buffer.from('\\nconst forged=true;\\n')]))));\n test(name+': changed assertion is refused',()=>assert.throws(()=>restoreHeadToolsTestRole(name,Buffer.from(actual.toString().replace('assert.equal','assert.notEqual')))));\n}\ntest('unknown historical test role is refused',()=>assert.throws(()=>restoreHeadToolsTestRole('unknown.test.mjs',Buffer.from(''))));\n`;
fs.writeFileSync(own+'/CODE/tests/head-tools-test-source-role.test.mjs',regression,{flag:'wx'});
const oldPin=read(root+'/quality/current-pin.before.json');assert.equal(sha(oldPin),'422a105495609f03a1e20660716406c737e1a14337843ed61d084bf95c7c7bed');
const fixture='tests/fixtures/current-delivery-before-head-tools-20261022.json';assert(!fs.existsSync(website+'/'+fixture));
fs.copyFileSync(root+'/quality/current-pin.before.json',website+'/'+fixture,fs.constants.COPYFILE_EXCL);
const sourceWithFixture={...source,at:new Date().toISOString(),previousSource:sourcePath,previousSourceSha256:sha(read(sourcePath)),sourceRows:[...source.sourceRows,{path:fixture,bytes:oldPin.length,sha256:sha(oldPin)}].sort((a,b)=>a.path.localeCompare(b.path)),sourcePaths:source.sourcePaths+1,addedHistoricalFixtureOnly:true};
const fixtureSource=root+'/WITH_HISTORY_FIXTURE_SOURCE.json';fs.writeFileSync(fixtureSource,JSON.stringify(sourceWithFixture,null,2)+'\n',{flag:'wx'});
const rows=[];
for(const stage of [worker,own])for(const name of fs.readdirSync(stage+'/CODE/tests')){
 assert(/^[a-z0-9-]+\.(test\.)?mjs$/.test(name));const relative='tests/'+name,prior=source.sourceRows.find(row=>row.path===relative),code=stage+'/CODE/'+relative;
 if(prior)assert.equal(sha(read(stage+'/RAW/'+relative)),prior.sha256);
 rows.push({path:relative,code,sha256:sha(read(code)),before:prior?stage+'/RAW/'+relative:null,beforeSha256:prior?.sha256??null});
}
assert.equal(rows.length,7);const plan={sourceReceipt:fixtureSource,sourceReceiptSha256:sha(read(fixtureSource)),rows,receipt:own+'/APPLIED_SOURCE.json',scope:'Two exact changed test roles and their named whole-source consumers; original body/refusals preserved, current UI/delivery checked separately, strict pin and validator untouched.'};
fs.writeFileSync(own+'/PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({plan:own+'/PLAN.json',rows:rows.length,authenticatedHistoryFixture:fixture,productBytesChanged:0,ownerPreviewChanged:false}));

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import vm from 'node:vm';

const root='F:/VisibleMedicine/staging/20261022-corpus-ui-current-followups';
const tests='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests';
const atlas='F:/VisibleMedicine/atlas';
const names=['corpus-xray-v2-current-delivery.test.mjs','corpus-ui-role-preservation.test.mjs','ui-teaching-current-delivery.test.mjs'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const code=path=>readFileSync(join(root,'CODE/tests',path));
const source=code('corpus-ui-role-preservation.test.mjs').toString('utf8');
let executable=source.replace(/^import .*;\r?\n/gm,'');
executable=executable.replace('const read=p=>readFileSync(new URL(p,import.meta.url));','');
assert(!executable.includes('const read=p=>readFileSync(new URL(p,import.meta.url));'));
function execute(overrides={},verbose=false){
 const results=[];
 const read=path=>overrides[path.replace(/^\.\//,'')]??(names.includes(path.replace(/^\.\//,''))?code(path.replace(/^\.\//,'')):readFileSync(join(tests,path)));
 const test=(title,body)=>{
  try{body();results.push({title,pass:true});if(verbose)process.stdout.write('PASS '+title+'\n');}
  catch(error){results.push({title,pass:false,error:error.message.split('\n')[0]});if(verbose)process.stdout.write('FAIL '+title+' '+error.message.split('\n')[0]+'\n');}
 };
 vm.runInNewContext(executable,{assert,createHash,readFileSync,read,test,Buffer,console},{filename:join(root,'CODE/tests/corpus-ui-role-preservation.test.mjs')});
 return results;
}
const results=execute({},true);
assert.equal(results.length,4,'Four outer historical theorem bodies execute, including the embedded fifth appendix theorem');
assert(results.every(row=>row.pass),'All four outer historical theorem bodies must pass');
for(const [label,path,index,mutated] of [
 ['current corpus refusal removed','corpus-xray-v2-current-delivery.test.mjs',1,Buffer.from(code('corpus-xray-v2-current-delivery.test.mjs').toString().replace('forged.draft.checks.foreign=true;',''))],
 ['current UI source count reverted','ui-teaching-current-delivery.test.mjs',3,Buffer.from(code('ui-teaching-current-delivery.test.mjs').toString().replace('assert.equal(delivery.reviewSourceFiles, 1558);','assert.equal(delivery.reviewSourceFiles, 1553);'))],
 ]){
 const attempt=execute({[path]:mutated});
 assert.equal(attempt.length,4,label+': all historical bodies execute');
 assert.equal(attempt[index].pass,false,label+': source mutation refused');
 process.stdout.write('REFUSED '+label+' '+attempt[index].error+'\n');
}

const git=(revision,path)=>execFileSync('git',['show',revision+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const sourcePaths=['content/corpus-spongiosum-xray-v2.pins.json','content/corpus-spongiosum-xray-v2.transition.json','content/corpus-spongiosum-xray-v2.ts','lib/corpus-spongiosum-xray-v2.ts','content/regional-teaching/pelvis.json'];
const pin=JSON.parse(readFileSync(join(tests,'fixtures/current-atlas-delivery.json')));
const manifest=JSON.parse(readFileSync(join(tests,'../atlas-review/manifest.json')));
const inputs=JSON.parse(readFileSync(join(tests,'../atlas-review/integration-inputs.json')));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(manifest.files.length,1558);assert.equal(inputs.inputs.length,1723);
assert.equal(pin.reviewSourceFiles,1558);assert.equal(pin.runtimeSources['head-neck'],pin.source);
for(const name of ['shoulder','lower-limb','female-pelvis'])assert.equal(pin.runtimeSources[name],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
for(const path of sourcePaths){
 const current=git(pin.source,path),previous=git('190a63238eadcf906abe89dcbb6a67c88afe70b9',path);
 assert.deepEqual(current,previous,path+': Git-byte-identical across current and historical roles');
 const row=manifest.files.find(file=>file.path===path);
 if(row){
  const imported=readFileSync(join(tests,'../atlas-review',path));
  assert.equal(row.sourceSha256,sha(current),path+': current committed source');
  assert.equal(row.importedSha256,sha(imported),path+': current protected import');
  assert.deepEqual(current,imported,path+': imported corpus bytes');
  assert.equal(inputs.inputs.find(file=>file.path==='atlas-review/'+path)?.sha256,sha(imported),path+': current integration input');
 }
 process.stdout.write((row?'GIT_REVIEW_EQUAL ':'GIT_EQUAL ')+path+' '+sha(current)+'\n');
}
const uiPaths=['content/median-antebrachial-xray-pins.json','content/median-antebrachial-xray.ts','lib/median-antebrachial-xray.ts','content/regional-teaching/forearm.json','app/review/body/review-dashboard.tsx','app/review/body/page.tsx','lib/body-review-material.ts'];
for(const [index,path] of uiPaths.entries()){
 const current=git(pin.source,path);
 if(index<4)assert.deepEqual(current,git('c237fa215f061147975e91b01fa830b3f44458c7',path),path+': unchanged from authored introduction');
 const row=manifest.files.find(file=>file.path===path);
 if(row){
  const imported=readFileSync(join(tests,'../atlas-review',path));
  assert.equal(row.sourceSha256,sha(current),path+': exact current Git source');
  assert.equal(row.importedSha256,sha(imported),path+': exact Review import');
  assert.equal(inputs.inputs.find(file=>file.path==='atlas-review/'+path)?.sha256,sha(imported),path+': exact UI input');
 }
}
assert.equal(sha(JSON.stringify(inputs.inputs)),pin.reviewIntegration,'Entire current input list digest');
assert.equal(new Set(inputs.inputs.map(row=>row.path)).size,inputs.inputs.length,'No duplicate input paths');
for(const row of inputs.inputs){
 assert(/^[A-Za-z0-9_./-]+$/.test(row.path)&&row.path.split('/').every(part=>part&&part!=='.'&&part!=='..'),'Contained input path: '+row.path);
 assert.equal(sha(readFileSync(join(tests,'..',row.path))),row.sha256,'Actual current integration input: '+row.path);
}
process.stdout.write(JSON.stringify({codeHashes:Object.fromEntries(names.map(name=>[name,sha(code(name))])),historicalBodiesPassed:results.length,embeddedHistoricalAppendix:1,mutationsRefused:2,corpusGitRowsEqual:sourcePaths.length,corpusGitReviewRowsEqual:3,uiGitRowsVerified:uiPaths.length,currentReviewFiles:manifest.files.length,currentInputsVerified:inputs.inputs.length})+'\n');

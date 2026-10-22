import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const site='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/';
const stage='F:/VisibleMedicine/staging/20261022-six-remaining-clinical-runtime-followup/CODE/tests/';
const {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=await import(pathToFileURL(site+'tests/current-atlas-delivery.mjs'));
const pin=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(ref,path)=>execFileSync('git',['show',ref+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const review=JSON.parse(readFileSync(site+'atlas-review/manifest.json'));
const names=['clinical-review-lacrimal-quiz.test.ts','clinical-review-laryngeal-muscle-quiz.test.ts',
 'clinical-review-laryngeal-framework-quiz.test.ts','clinical-review-ocular-support-quiz.test.ts',
 'clinical-review-orbital-support-quiz.test.ts','clinical-review-pectoral-ultrasound.test.ts'];
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
for(const name of names){
 const code=readFileSync(stage+name,'utf8');
 const start=code.indexOf('const sourceHashes');
 assert(start>=0,name+': explicit source set');
 const end=code.indexOf(name.includes('lacrimal')?']);':'};',start);
 assert(end>start,name+': source-set end');
 const block=code.slice(start,end);
 const paths=[...block.matchAll(/['"](content\/[a-z0-9-]+\.(?:ts|json)|lib\/[a-z0-9-]+\.ts)['"],?\s*['"]([a-f0-9]{64})['"]|['"](content\/[a-z0-9-]+\.(?:ts|json)|lib\/[a-z0-9-]+\.ts)['"]:\s*['"]([a-f0-9]{64})['"]/g)]
  .map(match=>[match[1]??match[3],match[2]??match[4]]);
 assert(paths.length>=2,name+': bounded source identities');
 for(const [path,expected] of paths){
  const old=git('9fba9a1e24b6669aafd48e945d55fc0939d50ab2',path);
  const current=git(pin.source,path);
  assert.equal(sha(old),expected,name+': historical Git '+path);
  assert.deepEqual(current,old,name+': current Git '+path);
  const record=review.files.find(row=>row.path===path);
  assert(record,path+': Review record');
  assert.equal(record.sourceSha256,expected);
  assert.equal(record.importedSha256,expected);
  assert.equal(sha(readFileSync(site+'atlas-review/'+path)),expected);
  const checkout=readFileSync(atlas+'/'+path);
  const crlf=Buffer.from(current.toString('utf8').replaceAll('\n','\r\n'));
  assert(checkout.equals(current)||checkout.equals(crlf),path+': Git blob or exact CRLF checkout');
  for(const module of ['head-neck','shoulder']){
   assert.deepEqual(git(pin.runtimeSources[module],path),current,module+': runtime Git '+path);
   const inputs=JSON.parse(readFileSync(site+`public/atlas-runtime/${module}/source-inputs.json`));
   assert.equal(inputs.find(row=>row.path===path)?.sha256,sha(checkout),module+': checkout source '+path);
  }
  for(const module of ['female-pelvis','lower-limb']){
   const inputs=JSON.parse(readFileSync(site+`public/atlas-runtime/${module}/source-inputs.json`));
   assert.equal(inputs.find(row=>row.path===path),undefined,module+': no foreign dependency '+path);
  }
 }
 console.log(name+': '+paths.length+' Git/Review/checkout/runtime source paths closed');
}
console.log('runtime source families '+JSON.stringify(pin.runtimeSources));

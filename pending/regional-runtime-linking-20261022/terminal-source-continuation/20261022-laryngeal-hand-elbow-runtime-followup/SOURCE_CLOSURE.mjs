import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const site='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/';
const stage='F:/VisibleMedicine/staging/20261022-laryngeal-hand-elbow-runtime-followup/CODE/tests/';
const {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=await import(pathToFileURL(site+'tests/current-atlas-delivery.mjs'));
const pin=validateCurrentAtlasDelivery();
const atlas=currentAtlasDeliveryRoot();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(ref,path)=>execFileSync('git',['show',ref+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const review=JSON.parse(readFileSync(site+'atlas-review/manifest.json'));
const names=['clinical-review-cranial-teaching-batch.test.ts','clinical-review-dorsal-hand-ultrasound.test.ts',
 'clinical-review-elbow-arterial-ultrasound.test.ts','clinical-review-foot-variant-quiz.test.ts',
 'clinical-review-foot-venous-arch-imaging.test.ts'];
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
for(const name of names){
 const code=readFileSync(stage+name,'utf8');
 const block=/const sourceHashes(?::Record<string,string>)?=\{([\s\S]*?)\}(?: as const)?;/.exec(code);
 assert(block,name+': explicit source hashes');
 const paths=[...block[1].matchAll(/'(content\/[a-z0-9-]+\.(?:ts|json)|lib\/[a-z0-9-]+\.ts)':'([a-f0-9]{64})'/g)];
 assert(paths.length>=3,name+': bounded source set');
 for(const [,path,expected] of paths){
  const historical=git('9fba9a1e24b6669aafd48e945d55fc0939d50ab2',path);
  const current=git(pin.source,path);
  assert.equal(sha(historical),expected,name+': historical '+path);
  assert.deepEqual(current,historical,name+': current Git '+path);
  const record=review.files.find(row=>row.path===path);
  assert(record,path+': current Review record');
  assert.equal(record.sourceSha256,expected);
  assert.equal(record.importedSha256,expected);
  assert.equal(sha(readFileSync(site+'atlas-review/'+path)),expected);
  const checkout=readFileSync(atlas+'/'+path);
  const crlf=Buffer.from(current.toString('utf8').replaceAll('\n','\r\n'));
  assert(checkout.equals(current)||checkout.equals(crlf),path+': exact Git blob or LF-to-CRLF checkout');
  for(const module of ['head-neck','shoulder']){
   assert.deepEqual(git(pin.runtimeSources[module],path),current,module+': runtime Git '+path);
   const inputs=JSON.parse(readFileSync(site+`public/atlas-runtime/${module}/source-inputs.json`));
   assert.equal(inputs.find(row=>row.path===path)?.sha256,sha(checkout),module+': checkout source input '+path);
  }
  for(const module of ['female-pelvis','lower-limb']){
   const inputs=JSON.parse(readFileSync(site+`public/atlas-runtime/${module}/source-inputs.json`));
   assert.equal(inputs.find(row=>row.path===path),undefined,module+': no foreign teaching dependency '+path);
  }
 }
 console.log(name+': '+paths.length+' historical/current Git, Review, checkout, learner source paths closed');
}
console.log('pin runtime sources '+JSON.stringify(pin.runtimeSources));

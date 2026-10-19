import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {createHash} from 'node:crypto';
import test from 'node:test';

const revision='a10496da94d9d054306bbc48e5ae9c98239d82b5';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

const historicalWebsite='c285a3871181565c35535ed65eb48d23fc13acd8';
function historicalFile(path:string,encoding:'utf8'):string;
function historicalFile(path:string):Buffer;
function historicalFile(path:string,encoding?:'utf8'){
 const bytes=Buffer.from(execFileSync('git',['show',historicalWebsite+':'+path],{encoding:null,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return encoding==='utf8'?bytes.toString('utf8'):bytes;
}
test('historical practice completion uses the same exact app sources in learner and Review',()=>{
  const base='public/atlas-runtime/head-neck/';
  const learner=JSON.parse(historicalFile(base+'manifest.json','utf8'));
  const review=JSON.parse(historicalFile('atlas-review/manifest.json','utf8'));
  const inputs=JSON.parse(historicalFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(learner.sourceCommit,revision);assert.equal(review.revision,revision);
  for(const path of ['app/body-explorer.tsx','app/practice-panel-navigation.tsx']){
    const input=inputs.filter(row=>row.path===path);assert.equal(input.length,1);
    const imported=review.files.filter((row:{path:string})=>row.path===path);assert.equal(imported.length,1);
    assert.equal(imported[0].sourceSha256,input[0].sha256);
    assert.equal(sha(historicalFile('atlas-review/'+path)),imported[0].importedSha256);
  }
  const app=historicalFile('atlas-review/app/body-explorer.tsx','utf8');
  assert.match(app,/<h2 data-practice-results tabIndex=\{\-1\} aria-describedby=\{practiceResultSummaryId\}>/);
  assert.match(app,/<p id=\{practiceResultSummaryId\}>/);
  const navigation=historicalFile('atlas-review/app/practice-panel-navigation.tsx','utf8');
  assert(navigation.includes("phase === 'results'"));
  assert(navigation.includes("target.closest('[hidden], [inert]')"));
  assert(navigation.includes('target.focus({ preventScroll: true })'));
});

test('current practice completion keeps source-bound learner and Review focus behavior',()=>{
 const base='public/atlas-runtime/head-neck/';
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 const source=(path:string)=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 for(const path of ['app/body-explorer.tsx','app/practice-panel-navigation.tsx']){
  const input=inputs.filter(row=>row.path===path);assert.equal(input.length,1);
  assert.equal(input[0].sha256,sha(source(path)));
  const imported=review.files.filter((row:{path:string})=>row.path===path);assert.equal(imported.length,1);
  assert.equal(imported[0].sourceSha256,input[0].sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),imported[0].importedSha256);
 }
 const app=readFileSync('atlas-review/app/body-explorer.tsx','utf8');
 assert.match(app,/<h2 data-practice-results tabIndex=\{\-1\} aria-describedby=\{practiceResultSummaryId\}>/);
 assert.match(app,/<p id=\{practiceResultSummaryId\}>/);
 const navigation=readFileSync('atlas-review/app/practice-panel-navigation.tsx','utf8');
 assert(navigation.includes("phase === 'results'"));
 assert(navigation.includes("target.closest('[hidden], [inert]')"));
 assert(navigation.includes('target.focus({ preventScroll: true })'));
 const read=(name:string)=>readFileSync(name);
 validateCurrentAtlasDelivery({read});
 assert.throws(()=>validateCurrentAtlasDelivery({read:(name:string)=>{
  if(name!==base+'source-inputs.json')return read(name);
  const data=JSON.parse(read(name).toString());
  data.find((f:any)=>f.path==='app/body-explorer.tsx').sha256='0'.repeat(64);
  return Buffer.from(JSON.stringify(data));
 }}));
});
test('hashed regional payload delivers the results focus target without granting approval or imaging access',()=>{
  const base='public/atlas-runtime/head-neck/',manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const scripts=manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
    const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256);return bytes.toString();
  }).join('\n');
  assert(scripts.includes('data-practice-results'));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});

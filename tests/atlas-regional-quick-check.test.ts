import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {createHash} from 'node:crypto';

const historicalWebsite='c285a3871181565c35535ed65eb48d23fc13acd8';
function historicalFile(path:string,encoding:'utf8'):string;
function historicalFile(path:string):Buffer;
function historicalFile(path:string,encoding?:'utf8'){
 const bytes=Buffer.from(execFileSync('git',['show',historicalWebsite+':'+path],{encoding:null,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return encoding==='utf8'?bytes.toString('utf8'):bytes;
}
test('historical learner and review CSS keep the return control after, not over, answers',()=>{
  for (const root of ['public/atlas-runtime/head-neck/','public/atlas-review-viewer/']) {
    const manifest=JSON.parse(historicalFile(root+'manifest.json','utf8'));
    assert.equal(manifest.sourceCommit,root.includes('atlas-review-viewer')?'a10496da94d9d054306bbc48e5ae9c98239d82b5':'a10496da94d9d054306bbc48e5ae9c98239d82b5');
    const css=manifest.files.filter((f:{path:string})=>f.path.endsWith('.css')).map((f:{path:string;sha256:string})=>{
      const bytes=historicalFile(root+f.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
      return bytes.toString();
    }).join('\n');
    const rules=[...css.matchAll(/\.anatomy-controls-return\s*\{([^}]+)\}/g)];
    assert(rules.length>0,root);
    for (const rule of rules) {
      assert.match(rule[1],/position:\s*static(?:;|$)/);
      assert(!/position:\s*(sticky|fixed|absolute)/.test(rule[1]));
      assert.match(rule[1],/min-height:\s*44px(?:;|$)/);
    }
  }
});

// Delivery evidence only: Atlas actual-component tests establish answer behavior.
test('historical regional learner and review viewers ship the tested selectable-question source',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(historicalFile(base+'manifest.json','utf8'));
  const review=JSON.parse(historicalFile('atlas-review/manifest.json','utf8'));
  const inputs=JSON.parse(historicalFile(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(manifest.sourceCommit,'a10496da94d9d054306bbc48e5ae9c98239d82b5');
  assert.equal(review.revision,'a10496da94d9d054306bbc48e5ae9c98239d82b5');
  for(const [path,sha256] of Object.entries({
    'app/atlas-workspace.tsx':'fb0b89748213755782a9eeb4522193425e912da976020249eaa80ecb56ef653d',
    'app/structure-quick-check.tsx':'7944394d093532c548b062e68be601d0fe6d4ebe7b4c5267275ade0436548632',
    'app/structure-quick-check.css':'fb0ae0d036f91d13bd0d6a82c335159c1f3620c8d0301e63724f369c5e836942',
  })) {
    assert.equal(inputs.find(f=>f.path===path)?.sha256,sha256,path);
    assert.equal(review.files.find((f:{path:string})=>f.path===path)?.sourceSha256,sha256,path+' review parity');
  }
  const js=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const bytes=historicalFile(base+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  for(const text of ['Quiz notes','Structure check','Check answer','Try again','Formative draft','cannot be marked']) assert(js.includes(text),text);
  for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection']) assert.equal(manifest[key],false);
});

test('current learner and Review CSS retain a static, accessible return control',()=>{
 for(const root of ['public/atlas-runtime/head-neck/','public/atlas-review-viewer/']){
  const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  const css=manifest.files.filter((f:{path:string})=>f.path.endsWith('.css')).map((f:{path:string;sha256:string})=>{
   const bytes=readFileSync(root+f.path);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
   return bytes.toString();
  }).join('\n');
  const rules=[...css.matchAll(/\.anatomy-controls-return\s*\{([^}]+)\}/g)];
  assert(rules.length>0,root);
  for(const rule of rules){
   assert.match(rule[1],/position:\s*static(?:;|$)/);
   assert(!/position:\s*(sticky|fixed|absolute)/.test(rule[1]));
   assert.match(rule[1],/min-height:\s*44px(?:;|$)/);
  }
 }
});

test('current regional quick check binds exact source, Review parity and emitted questions',()=>{
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
 assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 const source=(path:string)=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 for(const path of ['app/atlas-workspace.tsx','app/structure-quick-check.tsx','app/structure-quick-check.css']){
  const exact=sha(source(path));
  assert.deepEqual(inputs.filter(f=>f.path===path),[{path,sha256:exact}]);
  const imported=review.files.filter((f:{path:string})=>f.path===path);assert.equal(imported.length,1);
  assert.equal(imported[0].sourceSha256,exact);
  assert.equal(sha(readFileSync('atlas-review/'+path)),imported[0].importedSha256);
 }
 const js=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
  const bytes=readFileSync(base+f.path);
  assert.equal(sha(bytes),f.sha256);
  return bytes.toString();
 }).join('\n');
 for(const text of ['Quiz notes','Structure check','Check answer','Try again','Formative draft','cannot be marked'])assert(js.includes(text),text);
 for(const key of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);
 const read=(name:string)=>readFileSync(name);
 validateCurrentAtlasDelivery({read});
 const tamper=(alter:(data:any)=>void)=>()=>validateCurrentAtlasDelivery({read:(name:string)=>{
  if(name!==base+'source-inputs.json')return read(name);
  const data=JSON.parse(read(name).toString());alter(data);return Buffer.from(JSON.stringify(data));
 }});
 assert.throws(tamper(data=>{data.find((f:any)=>f.path==='app/structure-quick-check.tsx').sha256='0'.repeat(64);}));
 assert.throws(tamper(data=>{data.find((f:any)=>f.path==='app/structure-quick-check.css').path='app/foreign-quick-check.css';}));
 assert.throws(tamper(data=>{data.push(data.find((f:any)=>f.path==='app/atlas-workspace.tsx'));}));
});

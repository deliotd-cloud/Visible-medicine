import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {historicalBinderBytes,currentBinderBytes,currentAddedBinderInputs,assertCurrentBinderSourceDelta,assertRealCurrentInputs} from './binder-history-controls.mjs';
const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path));
const sha=value=>createHash('sha256').update(value).digest('hex');
const original=read('tests/fixtures/atlas-runtime-expansion-before-20261022/bind-clinical-review.mjs.raw');
const proposal=historicalBinderBytes().toString();
const addition="  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',\n";
const seam="  'components/AtlasRuntimeFrame.tsx','components/AtlasBodyLearning.tsx','components/atlas-body-learning.css','lib/atlas-body-learning-selection.ts',\n";
const checkSource=code=>{
 assert.equal(sha(original),'d8ce02c58eba914cc3243714c59dd35cbc0c38f7ddab90df626b14fdf0c7ef8d');
 assert.equal(code.split(addition).length,2);
 assert.equal(code.replace(addition,''),original.toString(),'Complete original binder survives outside two named inputs');
 assert.equal(code,original.toString().replace(seam,seam+addition),'Only declared insertion');
};
assertRealCurrentInputs();

// Run the actual binder algorithm. Only filesystem IO and console output are
// isolated; no Review record, viewer, approval or owner draft is written.
function bind(code,changes={}){
 const source='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
 const body={sha256:'body-source',clinicalApproved:false};
 const shoulder={revisions:{synthetic:{geometry:'geometry-source',teaching:'teaching-source'},empty:{geometry:null,teaching:null}},clinicalApproved:false};
 const manifest={revision:source,clinicalApproved:false,files:[
  {path:'content/body-renderer-revision.json',sourceSha256:'retained-body-source',importedSha256:'initial'},
  {path:'content/review-revisions.json',sourceSha256:'retained-shoulder-source',importedSha256:'initial'},
  {path:'content/synthetic.json',sourceSha256:'retained-other-source',importedSha256:'retained-other-import'},
 ]};
 const files=new Map([
  ['atlas-review/manifest.json',Buffer.from(JSON.stringify(manifest))],
  ['atlas-review/content/body-renderer-revision.json',Buffer.from(JSON.stringify(body))],
  ['atlas-review/content/review-revisions.json',Buffer.from(JSON.stringify(shoulder))],
  ['atlas-review/content/synthetic.json',Buffer.from('synthetic preserved import')],
  ...['AtlasRuntimeFrame.tsx','atlas-runtime-expansion.ts','atlas-runtime-frame.css'].map(name=>['components/'+name,read('components/'+name)]),
  ['scripts/bind-clinical-review.mjs',Buffer.from(code)],
 ]);
 for(const [path,bytes]of Object.entries(changes))files.set(path,Buffer.from(bytes));
 const writes=new Map();
 const fsRead=path=>{
  const bytes=writes.get(path)??files.get(path)??Buffer.from('synthetic named input: '+path);
  return Buffer.from(bytes);
 };
 const fsWrite=(path,bytes)=>{assert(path.startsWith('atlas-review/'));writes.set(path,Buffer.from(bytes));};
 const fsList=path=>{
  if(path==='scripts/clinical-review-viewer')return ['synthetic.tsx'];
  assert.equal(path,'app/workspace/atlas-review');return ['page.tsx','nested/page.tsx','ignored.txt'];
 };
 const imports=["import { readFileSync, writeFileSync, readdirSync } from 'node:fs';\n","import { createHash } from 'node:crypto';\n"];
 let executable=code;
 for(const statement of imports){assert.equal(executable.split(statement).length,2);executable=executable.replace(statement,'');}
 new Function('readFileSync','writeFileSync','readdirSync','createHash','console',executable)(fsRead,fsWrite,fsList,createHash,{log(){}});
 const json=path=>JSON.parse(writes.get('atlas-review/'+path));
 return {writes,inputs:json('integration-inputs.json'),manifest:json('manifest.json'),body:json('content/body-renderer-revision.json'),shoulder:json('content/review-revisions.json')};
}

test('actual binder retains its complete original with only two additional exact presentation inputs',()=>{
 checkSource(proposal);
 for(const changed of [proposal.replace(addition,''),proposal+'\n// unrelated',proposal.replace("for (const file of manifest.files)","for (const file of [])")])
  assert.throws(()=>checkSource(changed));
 const before=bind(original.toString()),after=bind(proposal);
 const newPaths=['components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css'];
 const expected=before.inputs.inputs.map(row=>row.path).concat(newPaths).sort();
 assert.deepEqual(after.inputs.inputs.map(row=>row.path).sort(),expected);
 assert.equal(new Set(after.inputs.inputs.map(row=>row.path)).size,after.inputs.inputs.length);
 for(const row of before.inputs.inputs){
  if(row.path==='scripts/bind-clinical-review.mjs')continue;
  assert.deepEqual(after.inputs.inputs.find(item=>item.path===row.path),row);
 }
 for(const path of newPaths)assert.equal(after.inputs.inputs.find(row=>row.path===path).sha256,sha(read(path)));
 assert.equal(after.inputs.sha256,sha(JSON.stringify(after.inputs.inputs)));
});

test('each actual viewer input independently changes the exact presentation revision without changing source or approval',()=>{
 const base=bind(proposal);
 for(const path of ['components/AtlasRuntimeFrame.tsx','components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css']){
  const changed=bind(proposal,{[path]:Buffer.concat([read(path),Buffer.from('\n/* synthetic changed presentation */\n')])});
  assert.notEqual(changed.inputs.sha256,base.inputs.sha256,path);
  assert.notEqual(changed.body.sha256,base.body.sha256,path);
  for(const track of ['geometry','teaching'])assert.notEqual(changed.shoulder.revisions.synthetic[track],base.shoulder.revisions.synthetic[track],path+'/'+track);
  assert.equal(changed.manifest.revision,base.manifest.revision);
  assert.deepEqual(changed.shoulder.sourceRevisions,base.shoulder.sourceRevisions);
  assert.equal(changed.body.sourceRendererSha256,base.body.sourceRendererSha256);
  assert.deepEqual(changed.shoulder.revisions.empty,{geometry:null,teaching:null});
  assert.equal(changed.body.clinicalApproved,false);assert.equal(changed.shoulder.clinicalApproved,false);assert.equal(changed.manifest.clinicalApproved,false);
  for(const [i,row]of base.manifest.files.entries()){
   assert.equal(changed.manifest.files[i].sourceSha256,row.sourceSha256);
   if(row.path==='content/synthetic.json')assert.deepEqual(changed.manifest.files[i],row);
  }
  assert.deepEqual([...changed.writes.keys()].sort(),[
   'atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json',
   'atlas-review/integration-inputs.json','atlas-review/manifest.json',
  ]);
 }
});

test('current binder independently binds every later Review, private-reference and head input without changing source or approval',()=>{
 const historical=historicalBinderBytes(),current=currentBinderBytes();
 const role=assertCurrentBinderSourceDelta(historical,current);
 assert.equal(sha(Buffer.from(proposal)),role.historicalSha256);
 assert.equal(sha(read('scripts/bind-clinical-review.mjs')),role.currentSha256);
 const additions=currentAddedBinderInputs();
 assert.deepEqual(additions,role.declaredAdditionalPaths);
 const realAdditions=Object.fromEntries(additions.map(path=>[path,read(path)]));
 const before=bind(proposal),after=bind(current.toString(),realAdditions);
 const beforeRows=new Map(before.inputs.inputs.map(row=>[row.path,row]));
 const afterRows=new Map(after.inputs.inputs.map(row=>[row.path,row]));
 assert.deepEqual([...afterRows.keys()].filter(path=>!beforeRows.has(path)).sort(),[...additions].sort(),'exact later input set');
 assert.equal(afterRows.size,beforeRows.size+additions.length);
 for(const [path,row]of beforeRows){
  if(path==='scripts/bind-clinical-review.mjs')continue;
  assert.deepEqual(afterRows.get(path),row,'all historical inputs retained: '+path);
 }
 assert.equal(afterRows.get('scripts/bind-clinical-review.mjs').sha256,role.currentSha256);
 for(const path of additions)assert.equal(afterRows.get(path).sha256,sha(realAdditions[path]),path);
 assert.equal(after.inputs.sha256,sha(JSON.stringify(after.inputs.inputs)));
 const unchangedSourceAndApproval=result=>{
  assert.equal(result.manifest.revision,before.manifest.revision);
  assert.equal(result.manifest.clinicalApproved,false);
  assert.equal(result.body.clinicalApproved,false);assert.equal(result.shoulder.clinicalApproved,false);
  assert.equal(result.body.sourceRendererSha256,before.body.sourceRendererSha256);
  assert.deepEqual(result.shoulder.sourceRevisions,before.shoulder.sourceRevisions);
  assert.deepEqual(result.shoulder.revisions.empty,{geometry:null,teaching:null});
  for(const [i,row]of before.manifest.files.entries())assert.equal(result.manifest.files[i].sourceSha256,row.sourceSha256);
  assert.deepEqual([...result.writes.keys()].sort(),[
   'atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json',
   'atlas-review/integration-inputs.json','atlas-review/manifest.json',
  ]);
 };
 unchangedSourceAndApproval(after);
 assert.notEqual(after.inputs.sha256,before.inputs.sha256);
 assert.notEqual(after.body.sha256,before.body.sha256);
 for(const track of ['geometry','teaching'])assert.notEqual(after.shoulder.revisions.synthetic[track],before.shoulder.revisions.synthetic[track]);
 for(const path of additions){
  const changed=bind(current.toString(),{...realAdditions,[path]:Buffer.concat([realAdditions[path],Buffer.from('\n/* synthetic tamper */\n')])});
  assert.notEqual(changed.inputs.sha256,after.inputs.sha256,'tamper invalidates Review: '+path);
  assert.notEqual(changed.body.sha256,after.body.sha256,'tamper invalidates body presentation: '+path);
  for(const track of ['geometry','teaching'])assert.notEqual(changed.shoulder.revisions.synthetic[track],after.shoulder.revisions.synthetic[track],path+'/'+track);
  unchangedSourceAndApproval(changed);
 }
 const foreign=Buffer.concat([current,Buffer.from('\n// foreign binder change\n')]);
 assert.throws(()=>assertCurrentBinderSourceDelta(historical,foreign));
 assert.throws(()=>assertCurrentBinderSourceDelta(historical,historical),'prior binder cannot impersonate current');
 assertRealCurrentInputs();
 assert.deepEqual(currentBinderBytes(),current,'current binder unchanged after controls');
});

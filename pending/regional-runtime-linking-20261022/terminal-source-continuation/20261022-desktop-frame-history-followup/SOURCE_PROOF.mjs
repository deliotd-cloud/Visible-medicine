// Pure source chain: current frame -> frozen c4a/fa1; corrected tests -> V5 -> fa1.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,writeFileSync,unlinkSync,rmdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-desktop-frame-history-followup/';
const site='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const rawHashes={
 'desktop-learning-row-history.test.mjs':'88aa79624b76b3cb69e52f15a378b47466dc6fd2549847339721afd4f56c1514',
 'drawable-epoch-current-admission.test.mjs':'08836926edb3c2cd47a69ac2b0e1c6d31a58360cf4b85781b54670c8d25fa18d',
 'colic-adapter-inverse.test.mjs':'8780092a4889681421adb5f696f06f28cdb5a29c157ba31271b38c1cf3ded0ff',
};
function one(source,from,to,label){assert.equal(source.split(from).length,2,label+': unique seam');return source.replace(from,to);}
function cut(source,start,end,label){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert(a>=0&&b>a&&source.indexOf(start,a+1)===-1,label+': bounded span');
 return source.slice(0,a)+source.slice(b);
}
function desktopInverse(source){
 source=one(source,"import {restorePreExpansionFrame} from './expansion-frame-adoption-inverse.mjs';\n",'','desktop import');
 source=cut(source,"const framePath='components/AtlasRuntimeFrame.tsx';\n","test('previous live delivery",'desktop frame proof');
 source=one(source,' const historicalFrame=frozenFrame();\n','','desktop row preproof');
 source=one(source,' const historicalBinder=frozenBinder();\n','','desktop binder preproof');
 source=one(source," assert.equal(after.inputs.find(r=>r.path===framePath)?.sha256,sha(historicalFrame),'Frozen c4a frame binding');\n",'','desktop binding');
 source=one(source," assert.equal(after.inputs.find(r=>r.path===binderPath)?.sha256,sha(historicalBinder),'Frozen c4a binder binding');\n",'','desktop binder binding');
 return one(source,"  const bytes=r.path===framePath?historicalFrame:r.path===binderPath?historicalBinder:read(replaced.has(r.path)?prior+'binding-inputs/'+r.path+'.raw':\n   colicReplaced.has(r.path)?'fixtures/colic-fa1-preimage/binding-inputs/'+r.path+'.raw':'../'+r.path);",
  "  const bytes=read(replaced.has(r.path)?prior+'binding-inputs/'+r.path+'.raw':\n   colicReplaced.has(r.path)?'fixtures/colic-fa1-preimage/binding-inputs/'+r.path+'.raw':'../'+r.path);",'desktop row reader');
}
function drawableInverse(source){
 source=one(source,"import {restorePreExpansionFrame} from './expansion-frame-adoption-inverse.mjs';\n",'','drawable import');
 source=cut(source,"const framePath='components/AtlasRuntimeFrame.tsx';\n",'const prior=JSON.parse','drawable frame proof');
 source=one(source,'const frameHistoryBytes=frozenFrame();\n','','drawable row preproof');
 source=one(source,'const binderHistoryBytes=frozenBinder();\n','','drawable binder preproof');
 source=one(source,"const read=path=>Object.hasOwn(pin.documents,path)?readFa('documents/'+path+'.raw'):\n faBindingMoves.has(path)?readFa('binding-inputs/'+path+'.raw'):\n path===framePath?frameHistoryBytes:path===binderPath?binderHistoryBytes:readLive(path);",
  "const read=path=>Object.hasOwn(pin.documents,path)?readFa('documents/'+path+'.raw'):\n faBindingMoves.has(path)?readFa('binding-inputs/'+path+'.raw'):readLive(path);",'drawable row reader');
 source=one(source," assert.equal(after.inputs.find(row=>row.path===framePath)?.sha256,sha(frameHistoryBytes),'Frozen fa1 frame binding');\n",'','drawable binding');
 return one(source," assert.equal(after.inputs.find(row=>row.path===binderPath)?.sha256,sha(binderHistoryBytes),'Frozen fa1 binder binding');\n",'','drawable binder binding');
}
function witnessInverse(source){
 source=one(source,"import {mkdtempSync,readFileSync,rmdirSync,unlinkSync,writeFileSync} from 'node:fs';",
  "import {readFileSync} from 'node:fs';",'witness fs import');
 source=one(source,"import {join} from 'node:path';\nimport {tmpdir} from 'node:os';\n",'','witness temp import');
 source=cut(source,'const frameHistoryCodeHashes={','function inverse(newText,patch){','witness V5 adapter');
 source=one(source,"const dir=fileURLToPath(new URL('.',import.meta.url));\nfunction inverse",
  "const dir=fileURLToPath(new URL('.',import.meta.url));\n\nfunction inverse",'witness original spacing');
 source=one(source,"  const old=readFileSync(oldPath),current=readFileSync(newPath);\n  const forward=Object.hasOwn(frameHistoryCodeHashes,name)?restoreV5FrameHistory(name,current,forwardSha):current;",
  '  const old=readFileSync(oldPath),forward=readFileSync(newPath);','witness forward source');
 return cut(source,'  let temporary,sourcePath=newPath,result;\n',"  assert.equal(result.status,count===0?0:1,name+' declared seam status');",'witness patch source').replace(
  "  assert.equal(sha(forward),forwardSha,name+' adapter bytes');\n  assert.equal(result.status",
  "  assert.equal(sha(forward),forwardSha,name+' adapter bytes');\n  const result=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',oldPath,newPath],{encoding:'utf8'});\n  assert.equal(result.status");
}
for(const [name,expected] of Object.entries(rawHashes)){
 const raw=readFileSync(stage+'RAW/tests/'+name),code=readFileSync(stage+'CODE/tests/'+name);
 assert.equal(sha(raw),expected,name+': V5 raw identity');
 const inverse=name.startsWith('desktop')?desktopInverse:name.startsWith('drawable')?drawableInverse:witnessInverse;
 assert.deepEqual(Buffer.from(inverse(code.toString('utf8'))),raw,name+': complete CODE to V5 RAW');
 console.log(name+' RAW '+sha(raw)+' CODE '+sha(code)+' full inverse OK');
}
const component=readFileSync(site+'components/AtlasRuntimeFrame.tsx');
const frozen=readFileSync(site+'tests/fixtures/atlas-runtime-expansion-before-20261022/AtlasRuntimeFrame.tsx.raw');
const binder=readFileSync(site+'scripts/bind-clinical-review.mjs');
const frozenBinder=readFileSync(site+'tests/fixtures/atlas-runtime-expansion-before-20261022/bind-clinical-review.mjs.raw');
assert.equal(sha(component),'7d4d9d36f5f8b7a88477355ba76b3adb4e93d080cff9356dfe5725f3fc6c76d8');
assert.equal(sha(frozen),'335b8b70b2ff60c3a951efb9eb18d98de8d230411c00896ff4a4123eff051261');
const {restorePreExpansionFrame}=await import(pathToFileURL(site+'tests/expansion-frame-adoption-inverse.mjs'));
assert.deepEqual(Buffer.from(restorePreExpansionFrame(component.toString('utf8'))),frozen,'Actual whole-frame inverse');
assert.equal(sha(binder),'0339eedafdc65e60fb35efd7f59c839a57afa274966c405e4b373f8722f95d06');
assert.equal(sha(frozenBinder),'d8ce02c58eba914cc3243714c59dd35cbc0c38f7ddab90df626b14fdf0c7ef8d');
const binderAddition="  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',\n";
assert.equal(binder.toString('utf8').split(binderAddition).length,2);
assert.deepEqual(Buffer.from(binder.toString('utf8').replace(binderAddition,'')),frozenBinder,'Actual whole-binder inverse');
for(const binding of [
 'tests/fixtures/drawable-epoch-preimage/documents/atlas-review/integration-inputs.json',
 'tests/fixtures/colic-fa1-preimage/documents/atlas-review/integration-inputs.json.raw',
]){
 const rows=JSON.parse(readFileSync(site+binding)).inputs;
 assert.equal(rows.length,1719,binding+': all original inputs');
 assert.equal(rows.find(row=>row.path==='components/AtlasRuntimeFrame.tsx')?.sha256,sha(frozen),binding+': frozen frame row');
 assert.equal(rows.find(row=>row.path==='scripts/bind-clinical-review.mjs')?.sha256,sha(frozenBinder),binding+': frozen binder row');
}
assert.throws(()=>{
 const changed=component.toString('utf8').replace('Restore viewer','Restore pane');
 assert.deepEqual(Buffer.from(restorePreExpansionFrame(changed)),frozen);
},'Modified later frame must refuse exact history');
assert.throws(()=>{
 const changed=binder.toString('utf8').replace(binderAddition,'');
 assert.equal(sha(Buffer.from(changed)),sha(binder));
},'Deleted binder addition must refuse exact current source');
console.log('V5 component/binder exact whole-buffer inverses and both 1719-row frozen identities OK');

// Execute actual staged witness adapter and all unchanged thirteen fa1 inverse rows.
const witness=readFileSync(stage+'CODE/tests/colic-adapter-inverse.test.mjs','utf8');
const a=witness.indexOf('const rows=['),b=witness.indexOf("test('all thirteen",a);
assert(a>=0&&b>a);
const pure=witness.slice(a,b).replace("const dir=fileURLToPath(new URL('.',import.meta.url));",
 'const dir='+JSON.stringify(site+'tests/')+';');
const {rows,restoreV5FrameHistory,inverse}=Function('assert','createHash','Buffer',pure+'\nreturn {rows,restoreV5FrameHistory,inverse};')(
 assert,createHash,Buffer);
assert.equal(rows.length,13);
for(const [name,count,patchSha,forwardSha] of rows){
 if(name!=='desktop-learning-row-history.test.mjs'&&name!=='drawable-epoch-current-admission.test.mjs')continue;
 const oldPath=site+'tests/fixtures/colic-fa1-preimage/'+name+'.raw';
 const old=readFileSync(oldPath);
 const changed=name.startsWith('desktop')||name.startsWith('drawable');
 const current=readFileSync(changed?stage+'CODE/tests/'+name:site+'tests/'+name);
 const forward=changed?
  restoreV5FrameHistory(name,current,forwardSha):current;
 if(changed){
  const mutant=Buffer.from(current.toString('utf8').replace("import {restorePreExpansionFrame} from './expansion-frame-adoption-inverse.mjs';\n",''));
  assert.throws(()=>restoreV5FrameHistory(name,mutant,forwardSha),name+': missing historical inverse import refused');
 }
 assert.equal(sha(forward),forwardSha,name+': unchanged V5 forward source');
 let temp,path=site+'tests/'+name,result;
 try{
  if(forward!==current){temp=mkdtempSync(join(tmpdir(),'vm-frame-proof-'));path=join(temp,'v5.mjs');writeFileSync(path,forward);}
  result=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',oldPath,path],{encoding:'utf8'});
 }finally{if(temp){unlinkSync(path);rmdirSync(temp);}}
 assert.equal(result.status,count===0?0:1,name+': original patch status');
 const patch=count===0?'':result.stdout.slice(result.stdout.indexOf('@@ '));
 assert.equal((patch.match(/^@@ /gm)||[]).length,count,name+': original hunk count');
 assert.equal(sha(Buffer.from(patch)),patchSha,name+': original patch bytes');
 assert.equal(inverse(forward.toString(),patch),old.toString(),name+': entire fa1 source inverse');
}
console.log('Actual colic witness: both affected fa1 source/patch inverses OK; other 11 frozen rows retained');

import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,unlinkSync,rmdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-colic-complete-source-followup';
const desktop='F:/VisibleMedicine/staging/20261022-desktop-frame-history-followup';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const canonical='F:/VisibleMedicine/website';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(path);
const name='colic-adapter-inverse.test.mjs';
const raw=read(join(stage,'RAW/tests',name));
const predecessor=read(join(stage,'PREDECESSOR/tests',name));
const code=read(join(stage,'CODE/tests',name));
assert.equal(sha(raw),'8780092a4889681421adb5f696f06f28cdb5a29c157ba31271b38c1cf3ded0ff');
assert.deepEqual(raw,read(join(website,'tests',name)),'exact V5 witness');
assert.equal(sha(predecessor),'1a652b9af840f497b211b67663fe085b44c4cbe6a30528ec8e2f646524d641ab');
assert.deepEqual(predecessor,read(join(desktop,'CODE/tests',name)),'exact main-reviewed desktop predecessor');
assert.equal(sha(code),'2add31dc03372e7c1960a2f91bdfe429e03c7eeed53d53274a638ca72fdddbb0');
const helper=read(join(stage,'CODE/tests/colic-later-source-inverse.mjs'));
assert.equal(sha(helper),'53880d21096880b81b88cf241eefd7e4f8d8853eaae8157ec3af1be7f889fa44');
const helperApi=await import(pathToFileURL(join(stage,'CODE/tests/colic-later-source-inverse.mjs')).href);
const {colicLaterSourceNames,restoreColicLaterSource}=helperApi;
assert.equal(colicLaterSourceNames.length,4);
const one=(source,from,to)=>{assert.equal(source.split(from).length,2,'unique witness seam');return source.replace(from,to);};
let source=code.toString('utf8');
source=one(source,"import {colicLaterSourceNames,restoreColicLaterSource} from './colic-later-source-inverse.mjs';\n",'');
source=one(source,'  const frameForward=Object.hasOwn(frameHistoryCodeHashes,name)?restoreV5FrameHistory(name,current,forwardSha):current;\n  const forward=restoreColicLaterSource(name,frameForward);',
 '  const forward=Object.hasOwn(frameHistoryCodeHashes,name)?restoreV5FrameHistory(name,current,forwardSha):current;');
const addition="\ntest('four later source epochs restore exact fa1-forward tests and refuse mutations',()=>{";
assert.equal(source.split(addition).length,2);
source=source.slice(0,source.indexOf(addition));
assert.deepEqual(Buffer.from(source),predecessor,'complete final→desktop predecessor inverse');
const priorProof=read(join(desktop,'SOURCE_PROOF.mjs')).toString('utf8');
const a=priorProof.indexOf('function one('),b=priorProof.indexOf('for(const [name,expected]');
assert(a>=0&&b>a);
const {witnessInverse}=Function('assert',priorProof.slice(a,b)+'\nreturn {witnessInverse};')(assert);
assert.deepEqual(Buffer.from(witnessInverse(predecessor.toString('utf8'))),raw,'complete desktop predecessor→V5 inverse');

const originalWitness=predecessor.toString('utf8');
const rowsStart=originalWitness.indexOf('const rows=['),rowsEnd=originalWitness.indexOf("test('all thirteen",rowsStart);
assert(rowsStart>=0&&rowsEnd>rowsStart);
const pure=originalWitness.slice(rowsStart,rowsEnd).replace("const dir=fileURLToPath(new URL('.',import.meta.url));",
 'const dir='+JSON.stringify(website+'/tests/')+';');
const {rows,restoreV5FrameHistory,inverse}=Function('assert','createHash','Buffer',pure+'\nreturn {rows,restoreV5FrameHistory,inverse};')(assert,createHash,Buffer);
assert.equal(rows.length,13);
const temp=mkdtempSync(join(stage,'pure-proof-'));
const proven=[];
try{
 for(const [file,count,patchSha,forwardSha] of rows){
  const oldPath=join(website,'tests/fixtures/colic-fa1-preimage',file+'.raw');
  const old=read(oldPath);
  const current=read(['desktop-learning-row-history.test.mjs','drawable-epoch-current-admission.test.mjs'].includes(file)
   ?join(desktop,'CODE/tests',file):join(website,'tests',file));
  const afterFrame=['desktop-learning-row-history.test.mjs','drawable-epoch-current-admission.test.mjs'].includes(file)
   ?restoreV5FrameHistory(file,current,forwardSha):current;
  const forward=restoreColicLaterSource(file,afterFrame);
  assert.equal(sha(forward),forwardSha,file+': unchanged original fa1-forward hash');
  if(colicLaterSourceNames.includes(file)){
   assert.deepEqual(forward,read(join(canonical,'tests',file)),file+': authenticated canonical forward preimage');
   const altered=Buffer.from(afterFrame);altered[0]^=1;
   assert.throws(()=>restoreColicLaterSource(file,altered),file+': changed V5 source refused');
  }
  const virtualPath=join(temp,file);
  writeFileSync(virtualPath,forward);
  const result=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--unified=0','--',oldPath,virtualPath],{encoding:'utf8'});
  assert.equal(result.status,count===0?0:1,file+': original status');
  const patch=count===0?'':result.stdout.slice(result.stdout.indexOf('@@ '));
  assert.equal((patch.match(/^@@ /gm)||[]).length,count,file+': original patch count');
  assert.equal(sha(Buffer.from(patch)),patchSha,file+': original patch hash');
  assert.equal(inverse(forward.toString(),patch),old.toString(),file+': complete fa1 source inverse');
  proven.push({path:'tests/'+file,originalHunks:count,originalPatchSha256:patchSha,forwardSha256:forwardSha,source:file.startsWith('desktop-learning')||file.startsWith('drawable-epoch-current')?'desktop2CODE':colicLaterSourceNames.includes(file)?'V5-reversed-later':'unchanged-V5'});
  unlinkSync(virtualPath);
 }
}finally{rmdirSync(temp);}
const output={at:new Date().toISOString(),sourceReceiptSha256:'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f',rawSha256:sha(raw),desktopPredecessorSha256:sha(predecessor),codeSha256:sha(code),helperSha256:sha(helper),fullCodeToDesktopToV5Inverse:true,allFourExactLaterSourceInverses:true,fourMutationRefusals:true,allThirteenOriginalFa1PatchesPreserved:true,rows:proven,limits:['Pure source/Git proof only; no node --test, esbuild, typecheck, build or browser run','Main must review and natively rerun after live 172-root terminal','No candidate, pin, validator, production, clinical data or owner preview edit']};
writeFileSync(join(stage,'SOURCE_PROOF.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({wholeChain:true,later:4,rows:proven.length}));

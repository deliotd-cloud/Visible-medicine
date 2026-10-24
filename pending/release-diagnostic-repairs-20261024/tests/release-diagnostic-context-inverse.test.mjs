// Lightweight source/inverse checks only. Not the original medical or integration suites.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {releaseDiagnosticContexts,restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
import {restoreArterialCurrentRole} from './arterial-current-role-inverse.mjs';
const site=fileURLToPath(new URL('../',import.meta.url));
const original='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const read=p=>readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
const records=releaseDiagnosticContexts();
assert.equal(records.length,11);
for(const row of records){
 test('whole original recovered: '+row.path,()=>{
  const before=read(original+'/'+row.path),after=read(site+'/'+row.path);
  assert.equal(sha(before),row.beforeSha256);assert.equal(sha(after),row.afterSha256);
  assert.deepEqual(restoreReleaseDiagnosticContext(row.path,after),before);
  let applied=before.toString();for(const [a,b]of row.seams){assert.equal(applied.split(a).length,2);applied=applied.replace(a,b);}
  assert.deepEqual(Buffer.from(applied),after,'Reapply every explicit reviewed seam');
 });
 test('foreign additions and removed assertions refused: '+row.path,()=>{
  const after=read(site+'/'+row.path),changed=Buffer.from(after);changed[0]^=1;
  assert.throws(()=>restoreReleaseDiagnosticContext(row.path,changed));
  assert.throws(()=>restoreReleaseDiagnosticContext(row.path,Buffer.concat([after,Buffer.from('/* foreign */')])));
  const text=after.toString();assert(text.includes('assert.'));
  assert.throws(()=>restoreReleaseDiagnosticContext(row.path,Buffer.from(text.replace('assert.','void.'))));
  assert.throws(()=>restoreReleaseDiagnosticContext(row.path,read(original+'/'+row.path)),'An old source is not admitted as the new source');
 });
}
test('undeclared old contexts retain their own exact refusal path',()=>{
 const sentinel=Buffer.from('untouched');assert.equal(restoreReleaseDiagnosticContext('release-to-lower',sentinel),sentinel);
 assert.equal(restoreReleaseDiagnosticContext('undeclared',sentinel),sentinel);
});
test('returned context data cannot mutate the private inverse table',()=>{
 const copy=releaseDiagnosticContexts();copy[0].seams[0][0]='forged';copy[0].afterSha256='0'.repeat(64);copy.length=0;
 const row=records[0];assert.deepEqual(restoreReleaseDiagnosticContext(row.path,read(site+'/'+row.path)),read(original+'/'+row.path));
});
test('real existing arterial current-role inverse still recovers its complete original',()=>{
 const restored=restoreArterialCurrentRole(read(site+'/tests/arterial-history-preservation.test.mjs'));
 assert.equal(sha(restored),'31d98d7601b3a4413d6ef7c62e4694ba7241962f627830913e68802738938cb5');
 assert.deepEqual(restored,read('F:/VisibleMedicine/staging/20261022-arterial-current-role-followup/website/tests/arterial-history-preservation.test.mjs'));
});
for(const [file,name]of [['complete-release-followup-preservation.test.mjs','original'],['complete-release-five-followups-preservation.test.mjs','inverse']]){
 test('existing '+name+' complete-release row function preserves the arterial theorem',()=>{
  const source=read(site+'/tests/'+file).toString();
  const start=source.indexOf('const rows=')+'const rows='.length,end=source.indexOf('],sha=');assert(start>0&&end>start);
  const rows=JSON.parse(source.slice(start,end+1)),row=rows.find(r=>r.path==='tests/atlas-arterial-evidence-limits.test.mjs');assert(row);
  const line=source.split('\n').find(l=>l.startsWith('function '+name+'(row,bytes){'));assert(line);
  const invoke=new Function('assert','sha','restoreReleaseDiagnosticContext','Buffer','return ('+line+');')(assert,sha,restoreReleaseDiagnosticContext,Buffer);
  const before=read(original+'/'+row.original),after=read(site+'/'+row.path);
  assert.equal(sha(before),row.before);assert.equal(row.after,'35aa317814977114af7caf761ca5b4504b319b92a76e3e18dd8b281fa50d608d');
  assert.deepEqual(invoke(row,after),before);
  assert.throws(()=>invoke(row,Buffer.concat([after,Buffer.from('/* foreign */')])));
  const missing=Buffer.from(after.toString().replace('assert.equal(refused,142);',''));assert.notDeepEqual(missing,after);assert.throws(()=>invoke(row,missing));
 });
}
test('all four arterial wrong-source forgeries remain genuinely different from the current source',()=>{
 const text=read(site+'/tests/atlas-arterial-evidence-limits.test.mjs').toString();
 assert(text.includes("assert.equal(CURRENT_ATLAS_REVISION,'6e810b188dde401f6c19a970928f316a479696df')"));
 assert(text.includes('shoulder:CURRENT_ATLAS_REVISION,\'lower-limb\':CURRENT_ATLAS_REVISION,\'female-pelvis\':CURRENT_ATLAS_REVISION'));
 assert(text.includes('wrong.runtimeSources[name]=historical;'));assert(!text.includes("name==='head-neck'?historical:CURRENT_ATLAS_REVISION"));
 const historical=text.match(/const historical='([a-f0-9]{40})'/)?.[1];assert.equal(historical,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.notEqual(historical,'6e810b188dde401f6c19a970928f316a479696df',name);
 assert(text.includes("assert.throws(()=>validateCurrentAtlasDelivery({pin:wrong})"));
});
test('coverage update retains exact scopes and only the two proved dependency counts',()=>{
 const index=records.find(r=>r.path==='tests/anatomy-coverage-index.test.mjs'),view=records.find(r=>r.path==='tests/anatomy-coverage-view.test.ts');
 assert.equal(index.seams.length,1);assert.equal(view.seams.length,1);
 assert.deepEqual(index.seams[0],["assert.equal(Object.keys(index.evidence.sourceInputs).length,168);","assert.equal(Object.keys(index.evidence.sourceInputs).length,171);"]);
 assert.deepEqual(view.seams[0],["assert.equal(imported.length,142);","assert.equal(imported.length,145);"]);
});

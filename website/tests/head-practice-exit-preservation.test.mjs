import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePracticeExitViewer} from './head-practice-exit-inverse.mjs';
import {restorePracticeConfirmConsumer} from './head-practice-confirm-harness-inverse.mjs';
import {readPartition6HistoricalTest} from './partition6-history-context.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex'),prefix='tests/fixtures/head-practice-exit-before/';
test('complete original viewer survives only four explicit practice-exit seams',()=>{
 readPartition6HistoricalTest('imaging-presentation.test.mjs');
 const old=read(prefix+'components/HeadAtlasViewer.tsx.raw'),current=readFileSync('F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/website/components/HeadAtlasViewer.tsx','utf8');assert.equal(sha(old),'2597a39850383fcc7be5c11762ad767101f0c7978c33099b854d51ef8ddc0509');assert.deepEqual(Buffer.from(restorePracticeExitViewer(current)),old);assert.throws(()=>restorePracticeExitViewer(current+'\n// forged'));assert.throws(()=>restorePracticeExitViewer(current.replace('window.confirm(', 'window.alert(')));
});
test('worker behavior assertions execute unchanged against the integrated real viewer',()=>{
 const old=read(prefix+'worker-v2-test.mjs.raw').toString();assert.equal(sha(old),'c2f804c9154e3bbab18e8328f26b138084d306afbde99fce3bb2577bbbebfea5');const current=read('tests/head-practice-exit.test.mjs').toString(),from="new URL('../components/HeadAtlasViewer.tsx',import.meta.url)",to="new URL('../components/HeadAtlasViewer.v2.tsx',import.meta.url)";assert.equal(current.split(from).length,2);assert.equal(current.replace(from,to),old);
});
test('all original imaging inventory, font, scope and binding assertions remain exact',()=>{
 const original=read(prefix+'tests/imaging-presentation.test.mjs.raw').toString();let current=readPartition6HistoricalTest('imaging-presentation.test.mjs').toString();for(const addition of ["import {restorePracticeExitViewer} from './head-practice-exit-inverse.mjs';\n","import {restorePracticeConfirmConsumer} from './head-practice-confirm-harness-inverse.mjs';\n"]){assert.equal(current.split(addition).length,2);current=current.replace(addition,'');}const reader="let now=restorePracticeConfirmConsumer(p,read('tests/'+p)).toString();";assert.equal(current.split(reader).length,2);current=current.replace(reader,"let now=text('tests/'+p);");const before="assert.equal(text('components/HeadAtlasViewer.tsx'),oldViewer",after="assert.equal(restorePracticeExitViewer(text('components/HeadAtlasViewer.tsx')),oldViewer";assert.equal(current.split(after).length,2);assert.equal(current.replace(after,before),original,'The full preceding theorem is not replaced by a fixture');
});
test('all original live-viewer and historical-reader assertions survive the explicit native-confirm fixture seam',()=>{
 for(const name of ['head-image-history.test.ts','head-disclosure-harness-preservation.test.mjs','head-image-history-anchor-harness.test.mjs','head-history-role-preservation.test.mjs']){
  const current=read('tests/'+name),prior=read(prefix+'tests/'+name+'.raw');assert.deepEqual(restorePracticeConfirmConsumer(name,current),prior);assert.throws(()=>restorePracticeConfirmConsumer(name,Buffer.concat([current,Buffer.from('\n// forged')])));
 }
});

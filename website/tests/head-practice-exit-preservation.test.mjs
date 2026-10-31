import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePracticeExitViewer} from './head-practice-exit-inverse.mjs';
import {restorePracticeConfirmConsumer} from './head-practice-confirm-harness-inverse.mjs';
import {readPartition6HistoricalTest} from './partition6-history-context.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex'),prefix='tests/fixtures/head-practice-exit-before/';

// The focus successor added one test without changing the original anchor case.
// Recover its entire preceding source before applying the unchanged confirm inverse.
function beforeFocusAnchor(name,bytes){
 if(name!=='head-image-history-anchor-harness.test.mjs')return bytes;
 assert.equal(sha(bytes),'1ef8b03bdb7851b34942b105da5e5664c409b161342f7ea12afa3fcf688cf792');
 const addition="import {restoreHeadHistoryFlow} from './head-history-flow-inverse.mjs';\n\n"+
 "test('focus successor history projection is exact and refuses altered source',()=>{\n"+
 " const bytes=fs.readFileSync(new URL('./head-image-history.test.ts',import.meta.url));\n"+
 " assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'feffec52b348dcf945b8126f8f8d27776817281cb4716bf72ac792ec78859983');\n"+
 " const prior=restoreHeadHistoryFlow(bytes);assert.equal(crypto.createHash('sha256').update(prior).digest('hex'),'33f1aa202a5463e0899e58e6a10b552cd2cb44c5e91341bfe7988497fd62a2dc');\n"+
 " assert.throws(()=>restoreHeadHistoryFlow(Buffer.concat([bytes,Buffer.from('foreign')])));\n"+
 "});\n";
 const current=bytes.toString('utf8');assert.deepEqual(Buffer.from(current),bytes);
 assert.equal(current.split(addition).length,2,'One complete added focus test');
 const prior=Buffer.from(current.replace(addition,''));
 assert.equal(sha(prior),'fec315d0caa2a1bb80fb990b05250fd088776d7aeacd7baba62184795c5f3c99','Whole original anchor case retained');
 return prior;
}
function restoreCurrentConfirmConsumer(name,bytes){return restorePracticeConfirmConsumer(name,beforeFocusAnchor(name,bytes));}
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
  const current=read('tests/'+name),prior=read(prefix+'tests/'+name+'.raw');assert.deepEqual(restoreCurrentConfirmConsumer(name,current),prior);assert.throws(()=>restoreCurrentConfirmConsumer(name,Buffer.concat([current,Buffer.from('\n// forged')])));
 }
});

test('anchor projection refuses changes to either the added or preceding assertions',()=>{
 const name='head-image-history-anchor-harness.test.mjs',current=read('tests/'+name);
 for(const [from,to] of [['focus successor history projection','changed focus test'],['native-anchor history harness','changed original test'],["Buffer.from('foreign')","Buffer.from('')"]]){
  const text=current.toString();assert.equal(text.split(from).length,2);
  assert.throws(()=>beforeFocusAnchor(name,Buffer.from(text.replace(from,to))));
 }
 assert.throws(()=>beforeFocusAnchor(name,Buffer.concat([current,Buffer.from('\n')])));
});

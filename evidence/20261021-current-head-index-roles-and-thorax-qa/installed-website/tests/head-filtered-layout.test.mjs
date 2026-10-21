import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('filtered practice uses a closed native disclosure; every original practice/selection/quiz handler is preserved',()=>{
 const old=read('tests/fixtures/head-viewer-before-filtered-layout.tsx.raw');
 assert.equal(hash(old),'871d02c03888f904d6bbb1458148b4b6320fe9a4a83b5c948f38d0969b6a24e8');
 let candidate=read('components/HeadAtlasViewer.tsx').toString();
 const start='{study&&filtersActive&&<details className="head-overlay-settings head-filtered-practice" onKeyDown={headDisclosureKeyDown}><summary>Practise these results ({filteredPracticeEntries.length} masks)</summary><div className="head-filtered-practice-options">';
 const end='    </div></details>}\n    <div id="head-index-list"';
 for(const [from,to] of [[start,'{study&&filtersActive&&<>'],[end,'    </>}\n    <div id="head-index-list"']]){
  assert.equal(candidate.split(from).length,2,'One declared wrapper seam');candidate=candidate.replace(from,to);
 }
 assert.equal(candidate,old.toString(),'Whole component inverse, including question eligibility, scoring, masks, study IDs and navigation');
});

test('results cannot flex-shrink below two typical rows and expanded practice scrolls within its own panel',()=>{
 const old=read('tests/fixtures/head-css-before-filtered-layout.raw');
 assert.equal(hash(old),'3edd00db77c3259e85f08243fec6a2be8ac9eb40655782fd8464a6e1aa404a3a');
 const oldRule='.head-structure-list{overflow:auto;min-height:0;flex:1;border-top:1px solid var(--imaging-line);padding-top:8px;scrollbar-color:#3d5b53 transparent}';
 const newRules='.head-structure-list{overflow:auto;min-height:144px;flex:1 0 144px;border-top:1px solid var(--imaging-line);padding-top:8px;scrollbar-color:#3d5b53 transparent}\n.head-filtered-practice{flex-shrink:0}\n.head-filtered-practice[open]{max-height:260px;overflow:auto;overscroll-behavior:contain}\n.head-filtered-practice-options{display:grid;gap:10px;padding-top:10px}';
 assert.equal(old.toString().split(oldRule).length,2);
 assert.equal(read('components/head-atlas.css').toString(),old.toString().replace(oldRule,newRules),'No global/page/image-layout rules changed');
});

test('complete previous roving test executes unchanged outside its historical full-byte context',()=>{
 const old=read('tests/fixtures/head-roving-test-before-filtered-layout.mjs.raw');
 assert.equal(hash(old),'d5b6b164983902f113cce14d01283a0b1cb7e620aba811d511842f1a43d9f106');
 const seam="let inverse=text('components/HeadAtlasViewer.tsx');";
 assert.equal(old.toString().split(seam).length,2);
 const archived=read('tests/fixtures/head-index-tab-stop-before-role-20261021.mjs.raw');
 assert.equal(hash(archived),'baef44aa7d0cbde7c9b2aa6f246670ef738c523444ec2ef2a9cbc85724f241b3');
 assert.equal(archived.toString(),old.toString().replace(seam,"let inverse=text('tests/fixtures/head-viewer-before-filtered-layout.tsx.raw');"));
 assert.notEqual(read('tests/head-index-tab-stop.test.mjs').toString(),archived.toString(),'Current roving test separately checks the later source role');
});

test('pre-layout Review fixture remains immutable but cannot approve the changed viewer/CSS',async()=>{
 const old=read('tests/fixtures/current-delivery-before-filtered-layout.json');
 assert.equal(hash(old),'c9638a225b9fc7c0e7ef2825f64ee229890732d26bff6fbdce9786bd5aa73bf5');
 const {validateCurrentAtlasDelivery}=await import('./current-atlas-delivery.mjs');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(old)}));
});

test('original compact-toolbar proof retains all assertions with one historical CSS read; toolbar AST remains live',()=>{
 const old=read('tests/fixtures/head-toolbar-test-before-filtered-layout.mjs.raw');
 assert.equal(hash(old),'38319ac1772060f0d834e72b23ca876714fa7695032631d97d1767ace347846a');
 const seam="const candidate=readFileSync(new URL('../components/head-atlas.css',import.meta.url),'utf8');";
 assert.equal(old.toString().split(seam).length,2);
 assert.equal(read('tests/native-head-toolbar-compact.test.mjs').toString(),old.toString().replace(seam,"const candidate=readFileSync(new URL('./fixtures/head-css-before-filtered-layout.raw',import.meta.url),'utf8');"));
});

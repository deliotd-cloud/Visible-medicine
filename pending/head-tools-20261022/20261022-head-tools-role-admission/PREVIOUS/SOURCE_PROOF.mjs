import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreHeadToolsBefore20261022} from './CODE/tests/head-tools-epoch-20261022.mjs';

const website=process.argv[2];
assert(website,'Pass the exact bound-successor website path');
const root=new URL('./',import.meta.url);
const read=path=>readFileSync(new URL(path,root));
const fromWebsite=path=>readFileSync(new URL(path,`file:///${website.replaceAll('\\','/').replace(/^\/+/, '')}/`));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const rawDisclosure=read('RAW/tests/head-disclosure-current-delivery.test.mjs').toString();
const codeDisclosure=read('CODE/tests/head-disclosure-current-delivery.test.mjs').toString();
const rawFiltered=read('RAW/tests/head-filtered-layout.test.mjs').toString();
const codeFiltered=read('CODE/tests/head-filtered-layout.test.mjs').toString();

assert.equal(sha(fromWebsite('../BUILT_SOURCE.json')),'b1c8248969db0df0ab77da5458c08b744bceac1a5105af435a9c6eafc6a5f142');
assert.equal(sha(fromWebsite('components/HeadAtlasViewer.tsx')),'a9b7c4b3d8f4febab394e983ace55df020cbcc84dc33daa8b2af6e7abd90fd1b');
assert.equal(sha(fromWebsite('tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw')),'a14d1d851fff12960b35ffe71e282a0f2ec00e9a9077c74e72d3ed456ad25daa');
assert.equal(sha(read('RAW/tests/head-disclosure-current-delivery.test.mjs')),'6feb900f5db6124b287629a669267736baf22751d3142aea15f8d4eda87d0e31');
assert.equal(sha(read('RAW/tests/head-filtered-layout.test.mjs')),'151e0511ce7ce925ff7a58469100759586f7aae3b40b85458db4da1ae7c05e3e');

const oldReview="assert.equal(binding.sha256,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');";
const newReview="assert.equal(binding.sha256,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');";
const historicalRole=`\ntest('pre-head-tools Review pin remains an authenticated older role and cannot approve the changed viewer',()=>{\n const before=JSON.parse(read('quality/current-pin.before.json'));\n assert.equal(before.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');\n const current=validateCurrentAtlasDelivery();\n assert.equal(current.reviewIntegration,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');\n assert.notEqual(before.reviewIntegration,current.reviewIntegration);\n assert.throws(()=>validateCurrentAtlasDelivery({pin:before}));\n});\n`;
assert.equal(rawDisclosure.split(oldReview).length-1,1);
assert.equal(codeDisclosure.split(newReview).length-1,1);
assert.equal(codeDisclosure.split(historicalRole).length-1,1);
assert.equal(codeDisclosure.replace(historicalRole,'').replace(newReview,oldReview),rawDisclosure,'all previous disclosure checks remain');

const importLine="import {restoreHeadToolsBefore20261022} from './head-tools-epoch-20261022.mjs';\n";
const oldRead="let candidate=read('components/HeadAtlasViewer.tsx').toString();";
const newRead="let candidate=restoreHeadToolsBefore20261022(read('components/HeadAtlasViewer.tsx'),read('tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw'));";
assert.equal(codeFiltered.split(importLine).length-1,1);
assert.equal(codeFiltered.split(newRead).length-1,1);
assert.equal(codeFiltered.replace(importLine,'').replace(newRead,oldRead),rawFiltered,'all previous filtered-layout checks remain');

const current=fromWebsite('components/HeadAtlasViewer.tsx');
const before=fromWebsite('tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw');
const restored=restoreHeadToolsBefore20261022(current,before);
assert.equal(restored,before.toString());
for(const [id,mutation] of [
  ['pane label',current.toString().replace(' selected anatomy 3D scan view',' selected anatomy 3D view')],
  ['locator condition',current.toString().replace('!!selected?.entry.supplementary_geometries?.length','!!selected?.entry.supplementary_geometries')],
  ['historical fixture',before.toString()+'\n'],
])assert.throws(()=>id==='historical fixture'?restoreHeadToolsBefore20261022(current,Buffer.from(mutation)):restoreHeadToolsBefore20261022(Buffer.from(mutation),before),id+' must refuse');

const old=fromWebsite('tests/fixtures/head-viewer-before-filtered-layout.tsx.raw').toString();
const start='{study&&filtersActive&&<details className="head-overlay-settings head-filtered-practice" onKeyDown={headDisclosureKeyDown}><summary>Practise these results ({filteredPracticeEntries.length} masks)</summary><div className="head-filtered-practice-options">';
const end='    </div></details>}\n    <div id="head-index-list"';
let filtered=restored;
for(const [from,to] of [[start,'{study&&filtersActive&&<>'],[end,'    </>}\n    <div id="head-index-list"']]){
  assert.equal(filtered.split(from).length-1,1);
  filtered=filtered.replace(from,to);
}
assert.equal(filtered,old,'original filtered-layout whole-component inverse still holds');
console.log(JSON.stringify({source:'b1c8248969db0df0ab77da5458c08b744bceac1a5105af435a9c6eafc6a5f142',review:'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a',oldReview:'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163',wholeViewerInverse:true,originalFilteredInverse:true,previousTestBodiesPreserved:2,mutationRefusals:3}));

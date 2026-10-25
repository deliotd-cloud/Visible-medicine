import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {stripLiveLearningLoader} from './learning-frame-loader-transition.mjs';
import {restoreRegionalQuerySource} from './regional-query-source-role.mjs';

const read=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');
const original=JSON.parse(read('./fixtures/nonhead-frame-migration/original.json'));
const digest=text=>createHash('sha256').update(text).digest('hex');
const expectedSha='4641b2f24b77d4ee71e1728f8bc507cfaf5fc806e2e90a728682e1ea511b3be7';
const begin="const page=compiled('app/atlas/3d/page.tsx',{";
const insertion=[
 "const {createAtlasDocumentAttempt}=compiled('components/atlas-runtime-state.ts');",
 "const {AtlasRuntimeFrame}=compiled('components/AtlasRuntimeFrame.tsx',{",
 "  'react':React,",
 "  './atlas-runtime-state':{createAtlasDocumentAttempt},",
 "  './atlas-runtime-frame.css':{},",
 "  'react/jsx-runtime':require('react/jsx-runtime'),",
 '});',begin,
].join('\n');
const seam="  '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel},";
const expansionImport="import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\n";
const expansionMap="  './atlas-runtime-expansion':atlasRuntimeExpansionModule,\n";
function stripExpansionLoader(candidate){
 for(const added of [expansionImport,expansionMap]){
  assert.equal(candidate.split(added).length,2,`Missing or duplicate real expansion seam: ${added.trim()}`);
  candidate=candidate.replace(added,'');
 }
 return candidate;
}
function verify(candidate){
 assert.equal(original.schema,'visible-medicine.original-test-text/1');
 assert.equal(original.path,'tests/atlas-nonhead-comparison-ui.test.mjs');
 assert.equal(original.sha256,expectedSha);assert.equal(digest(original.text),expectedSha);
 assert.equal(original.text.split(begin).length,2);assert.equal(original.text.split(seam).length,2);
 const expected=original.text.replace(begin,insertion).replace(seam,seam+"\n  '../../../components/AtlasRuntimeFrame':{AtlasRuntimeFrame},");
 assert.equal(stripLiveLearningLoader(restoreRegionalQuerySource('atlas-nonhead-comparison-ui.test.mjs',stripExpansionLoader(candidate))),expected,'Only real shared-component imports may be added; all original tests/assertions remain exact');
}

test('the non-head harness imports the actual shared frame and preserves every original assertion byte',()=>{
 verify(read('./atlas-nonhead-comparison-ui.test.mjs'));
});

test('the non-head migration refuses a missing, duplicated or substituted real expansion dependency',()=>{
 const current=read('./atlas-nonhead-comparison-ui.test.mjs');
 for(const changed of [
  current.replace(expansionImport,''),
  current+expansionMap,
  current.replace(expansionMap,"  './atlas-runtime-expansion':{},\n"),
 ])assert.throws(()=>verify(changed));
});

test('the non-head migration rejects replaced frame rendering and altered source/access assertions',()=>{
 const current=read('./atlas-nonhead-comparison-ui.test.mjs');
 for(const [before,after] of [
  ["compiled('components/AtlasRuntimeFrame.tsx'","compiled('components/FakeFrame.tsx'"],
  ["assert.equal(url.searchParams.has('patientId'),false)","assert.equal(url.searchParams.has('patientId'),true)"],
  ["assert.equal(bridgeCalls.length,0,","assert.equal(bridgeCalls.length,1,"],
 ]){
  assert(current.includes(before));assert.throws(()=>verify(current.replace(before,after)));
 }
});

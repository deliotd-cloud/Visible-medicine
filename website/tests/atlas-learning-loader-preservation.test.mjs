import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {stripLiveLearningLoader} from './learning-frame-loader-transition.mjs';
import {restoreExtraExpansionSource} from './extra-expansion-adoption-source-proof.mjs';
import {restoreRegionalQuerySource,restoreRegionalQueryMigrationSource} from './regional-query-source-role.mjs';

const read=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
const originalTest=read('./fixtures/live-learning-original-nonhead-test.mjs.raw');
const originalMigration=read('./fixtures/live-learning-original-nonhead-migration.mjs.raw');
const currentTest=()=>restoreRegionalQuerySource('atlas-nonhead-comparison-ui.test.mjs',restoreExtraExpansionSource('atlas-nonhead-comparison-ui.test.mjs',read('./atlas-nonhead-comparison-ui.test.mjs')));
const currentMigration=()=>restoreExtraExpansionSource('nonhead-frame-migration.test.mjs',restoreRegionalQueryMigrationSource(read('./nonhead-frame-migration.test.mjs')));
const migrationImport="import {stripLiveLearningLoader} from './learning-frame-loader-transition.mjs';\n";
const changedAssertion="assert.equal(stripLiveLearningLoader(candidate),expected,'Only real shared-component imports may be added; all original tests/assertions remain exact');";
const originalAssertion="assert.equal(candidate,expected,'Only real shared-component imports may be added; all original tests/assertions remain exact');";
function inverseMigration(candidate){
  assert.equal(candidate.split(migrationImport).length,2,'Exactly one declared migration loader import');
  assert.equal(candidate.split(changedAssertion).length,2,'Exactly one declared migration comparison seam');
  return candidate.replace(migrationImport,'').replace(changedAssertion,originalAssertion);
}

test('both canonical pre-learning test sources are frozen byte-for-byte',()=>{
  assert.equal(sha(originalTest),'27501835522944d6f7f6c61b59e833e95f597efbb4bd4dd5f4538430783e41c2');
  assert.equal(sha(originalMigration),'9f13900761b858801e9d82e02f7357c67883db3d1b364d50eb237f569864cc9f');
});

test('the real-component loader is the exact whole-source addition to the non-head test',()=>{
  assert.equal(stripLiveLearningLoader(currentTest()),originalTest);
});

test('the historical migration proof and all its mutation negatives survive exactly',()=>{
  assert.equal(inverseMigration(currentMigration()),originalMigration);
});

test('loader or original-assertion mutations fail the complete inverses',()=>{
  assert.throws(()=>stripLiveLearningLoader(currentTest().replace(
    "  './AtlasBodyLearning':learningModule,","  './AtlasBodyLearning':{},")));
  assert.notEqual(stripLiveLearningLoader(currentTest().replace(
    "assert.equal(url.searchParams.has('patientId'),false)",
    "assert.equal(url.searchParams.has('patientId'),true)")),originalTest);
  assert.notEqual(inverseMigration(currentMigration().replace(
    "assert(current.includes(before));assert.throws(()=>verify(current.replace(before,after)));",
    "assert(current.includes(before));")),originalMigration);
});

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {restoreExtraExpansionSource} from './extra-expansion-adoption-source-proof.mjs';
import {stripLiveLearningLoader} from './learning-frame-loader-transition.mjs';
import {
  restoreRegionalQuerySource,restoreRegionalQueryMigrationSource,restoreRegionalQueryLoaderPreservationSource,
  regionalNavigation,regionalPageDependencies,regionalQueryTest,
} from './regional-query-source-role.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
const name='atlas-nonhead-comparison-ui.test.mjs';
const originalTest=read('./fixtures/live-learning-original-nonhead-test.mjs.raw');
const originalMigration=read('./fixtures/live-learning-original-nonhead-migration.mjs.raw');
const project=text=>stripLiveLearningLoader(restoreRegionalQuerySource(name,restoreExtraExpansionSource(name,text)));

test('regional query additions preserve the complete older non-head and migration roots',()=>{
  assert.equal(sha(originalTest),'27501835522944d6f7f6c61b59e833e95f597efbb4bd4dd5f4538430783e41c2');
  assert.equal(sha(originalMigration),'9f13900761b858801e9d82e02f7357c67883db3d1b364d50eb237f569864cc9f');
  assert.equal(project(read('./'+name)),originalTest);
  const migration=restoreExtraExpansionSource('nonhead-frame-migration.test.mjs',restoreRegionalQueryMigrationSource(read('./nonhead-frame-migration.test.mjs')));
  assert.match(migration,/stripLiveLearningLoader\(candidate\)/);
  assert.equal(sha(restoreRegionalQueryLoaderPreservationSource(read('./atlas-learning-loader-preservation.test.mjs'))),
    '38ecf4e66ea0c91b6a8347be5c42ed676ec2a929f04cdd5dfc401abf5afd512b');
});

test('regional query inverse rejects missing, duplicated, reordered, substituted and partial additions',()=>{
  const current=read('./'+name);
  const cases=[
    current.replace(regionalNavigation,''),
    current+regionalNavigation,
    current.replace(regionalPageDependencies,''),
    current.replace(regionalPageDependencies,regionalPageDependencies.split('\n').reverse().join('\n')),
    current.replace(regionalPageDependencies,regionalPageDependencies.replace('{regionalTourEntrySuffix}','{}')),
    current.replace(regionalQueryTest,''),
    current+regionalQueryTest,
    current.replace(regionalQueryTest,regionalQueryTest.slice(0,-5)),
    current.replace(regionalQueryTest,regionalQueryTest.replace("assert.equal(url.searchParams.has('patientId'),false)","assert.equal(url.searchParams.has('patientId'),true)")),
    current.replace(regionalQueryTest,regionalQueryTest.replace("...['headTour','headStep','headRevision']","...['headTour','headStep']")),
    current.replace(regionalNavigation,'').replace(regionalPageDependencies,'')+regionalNavigation+regionalPageDependencies+regionalQueryTest,
  ];
  for(const changed of cases){
    assert.notEqual(changed,current,'Mutation must change the complete source');
    assert.throws(()=>assert.equal(project(changed),originalTest));
  }
  assert.throws(()=>restoreRegionalQuerySource('foreign-root.mjs',current));
});

test('migration and historical theorem reader reject tampering with their new roles',()=>{
  const migration=read('./nonhead-frame-migration.test.mjs');
  const migrationImport="import {restoreRegionalQuerySource} from './regional-query-source-role.mjs';\n";
  const loader=read('./atlas-learning-loader-preservation.test.mjs');
  const loaderImport="import {restoreRegionalQuerySource,restoreRegionalQueryMigrationSource} from './regional-query-source-role.mjs';\n";
  for(const changed of [migration.replace(migrationImport,''),migration+migrationImport,
    migration.replace("restoreRegionalQuerySource('atlas-nonhead-comparison-ui.test.mjs',stripExpansionLoader(candidate))","restoreRegionalQuerySource('foreign-root.mjs',stripExpansionLoader(candidate))")]){
    assert.notEqual(changed,migration);
    assert.throws(()=>restoreRegionalQueryMigrationSource(changed));
  }
  for(const changed of [loader.replace(loaderImport,''),loader+loaderImport,
    loader.replace("restoreRegionalQuerySource('atlas-nonhead-comparison-ui.test.mjs'","restoreRegionalQuerySource('foreign-root.mjs'")]){
    assert.notEqual(changed,loader);
    assert.throws(()=>restoreRegionalQueryLoaderPreservationSource(changed));
  }
});

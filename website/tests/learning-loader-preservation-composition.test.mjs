import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stripLiveLearningLoader} from './learning-frame-loader-transition.mjs';
import {restoreExtraExpansionSource,expansionImport,migrationRefusal} from './extra-expansion-adoption-source-proof.mjs';
import {restoreRegionalQuerySource,restoreRegionalQueryLoaderPreservationSource,regionalNavigation,regionalPageDependencies,regionalQueryTest} from './regional-query-source-role.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),sha=b=>createHash('sha256').update(b).digest('hex');

test('complete old learning-loader proof survives only the declared later-expansion reader seams',()=>{
 const old=read('./fixtures/learning-loader-preservation-before-expansion.test.mjs.raw');
 assert.equal(sha(old),'ae9552c5477878b564f6b8a30c78d153acdb3e293b6ea05beafab41441ab91dd');
 let current=restoreRegionalQueryLoaderPreservationSource(read('./atlas-learning-loader-preservation.test.mjs'));
 const once=(from,to)=>{assert.equal(current.split(from).length,2);current=current.replace(from,to);};
 once("import {restoreExtraExpansionSource} from './extra-expansion-adoption-source-proof.mjs';\n",'');
 once("const currentTest=()=>restoreExtraExpansionSource('atlas-nonhead-comparison-ui.test.mjs',read('./atlas-nonhead-comparison-ui.test.mjs'));","const currentTest=()=>read('./atlas-nonhead-comparison-ui.test.mjs');");
 once("const currentMigration=()=>restoreExtraExpansionSource('nonhead-frame-migration.test.mjs',read('./nonhead-frame-migration.test.mjs'));","const currentMigration=()=>read('./nonhead-frame-migration.test.mjs');");
 assert.equal(current,old,'All original assertions, readers, migration inverse and mutation refusals stay exact');
});

test('the composed source proof refuses missing loaders, foreign names and altered original access assertions',()=>{
 const name='atlas-nonhead-comparison-ui.test.mjs',current=read('./'+name),old=read('./fixtures/live-learning-original-nonhead-test.mjs.raw');
 const project=text=>stripLiveLearningLoader(restoreRegionalQuerySource(name,restoreExtraExpansionSource(name,text)));
 assert.equal(project(current),old);
 for(const mutate of [
  text=>text.replace(expansionImport,''),
  text=>text+expansionImport,
  text=>text.replace(regionalNavigation,''),
  text=>text+regionalNavigation,
  text=>text.replace(regionalPageDependencies,''),
  text=>text.replace(regionalQueryTest,''),
  text=>text.replace(regionalQueryTest,regionalQueryTest.replace("assert.equal(url.searchParams.has('patientId'),false)","assert.equal(url.searchParams.has('patientId'),true)")),
  text=>text.replace("  './AtlasBodyLearning':learningModule,","  './AtlasBodyLearning':{},"),
  text=>text.replace("assert.equal(url.searchParams.has('patientId'),false)","assert.equal(url.searchParams.has('patientId'),true)"),
  text=>text+'\n// unknown source alteration\n',
 ]){const changed=mutate(current);assert.notEqual(changed,current);assert.throws(()=>assert.equal(project(changed),old));}
 assert.throws(()=>restoreExtraExpansionSource('foreign-source.mjs',current));
 const migration=read('./nonhead-frame-migration.test.mjs');assert(migration.includes(migrationRefusal));
 assert.throws(()=>restoreExtraExpansionSource('nonhead-frame-migration.test.mjs',migration.replace(migrationRefusal,'')),/Missing or duplicate source seam/);
});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {restoreLiveLearningMigrationConsumer} from './live-learning-migration-consumer-inverse.mjs';
import {restoreStructureQueryHarness,restoreStudyTransportQueryHarness,restoreTransportMigrationQueryReader,restoreNineRootQueryReader,restoreNineRootAccessReader} from './page-ssr-query-role.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const replace=(source,added,prior='')=>{
  assert.equal(source.split(added).length,2,`Missing or duplicate seam: ${added.slice(0,100)}`);
  return source.replace(added,prior);
};
const source=name=>read(name);
const prior=name=>read(`preimages/${name}.raw`);
const importLine="import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\n";
const frameLine="    './atlas-runtime-expansion':atlasRuntimeExpansionModule,\n";
const structureLine="    if(id==='./atlas-runtime-expansion')return atlasRuntimeExpansionModule;\n";

test('two SSR roots have only the real expansion import and frame mapping added',()=>{
  for(const [name,map] of [
    ['structure-learning-ui.test.ts',structureLine],
    ['atlas-study-transport.test.ts',frameLine],
  ]){
    const now=source(name);
    const preQuery=name==='structure-learning-ui.test.ts'?restoreStructureQueryHarness(now):restoreStudyTransportQueryHarness(now);
    assert.equal(replace(replace(preQuery,importLine),map),prior(name));
    for(const changed of [now.replace(importLine,''),now+map,now.replace(map,map.replace('atlasRuntimeExpansionModule','{}'))]){
      assert.throws(()=>{
        const restored=name==='structure-learning-ui.test.ts'?restoreStructureQueryHarness(changed):restoreStudyTransportQueryHarness(changed);
        return replace(replace(restored,importLine),map);
      });
    }
  }
});

test('transport migration keeps its complete pinned old inverse and refuses expansion seam loss',()=>{
  const name='atlas-study-transport-migration.test.mjs';
  const now=restoreTransportMigrationQueryReader(source(name));
  const block='const expansionSeams=[\n  "import {atlasRuntimeExpansionModule} from \'./atlas-runtime-expansion-loader.mjs\';\\n",\n  "    \'./atlas-runtime-expansion\':atlasRuntimeExpansionModule,\\n",\n];\nconst expanded=()=>readFileSync(new URL(\'./atlas-study-transport.test.ts\',import.meta.url),\'utf8\');\n';
  const refusal='\ntest(\'transport migration refuses a missing, duplicated or substituted real expansion dependency\',()=>{\n  const source=expanded();\n  for(const changed of [\n    source.replace(expansionSeams[0],\'\'),\n    source+expansionSeams[1],\n    source.replace(expansionSeams[1],"    \'./atlas-runtime-expansion\':{},\\n"),\n  ])assert.throws(()=>stripConsumerLoader(changed,expansionSeams));\n});\n';
  const newCurrent='const current=()=>stripConsumerLoader(stripConsumerLoader(expanded(),expansionSeams),[';
  const oldCurrent='const current=()=>stripConsumerLoader(readFileSync(new URL(\'./atlas-study-transport.test.ts\',import.meta.url),\'utf8\'),[';
  assert.equal(replace(replace(replace(now,block),refusal),newCurrent,oldCurrent),prior(name));
  assert.match(now,/const oldSha='b1c4f68921147d58238c83060493bd1779f7d0b9c5033a610ae09bf258a14305'/);
  assert.match(now,/const newSha='6d870cbeef5f4a23480af267c1f62fcdddeb0a47caaa1913fe7a20aabc6795ed'/);
  assert.match(now,/const blockSha='567a0c0f7f0a500bc237d860c01c09d11e4841945ef022296c5372e55c50ff66'/);
});

test('all nine preservation definitions and historical hashes survive exact inverse',()=>{
  const name='live-learning-consumer-loader-preservation.test.mjs';
  let now=restoreLiveLearningMigrationConsumer(restoreNineRootAccessReader(restoreNineRootQueryReader(source(name))));
  const begin=now.indexOf('const expansionImport=');
  const end=now.indexOf('const definitions=',begin);
  assert(begin>=0&&end>begin);
  now=replace(now,now.slice(begin,end));
  now=replace(now,'seams:[expansionImport,expansionMap,importSeam,','seams:[importSeam,');
  now=replace(now,'seams:[expansionImport,expansionStructureMap,importSeam,','seams:[importSeam,');
  now=replace(now,'seams:[migrationExpansion,migrationRefusal,[migrationNewCurrent,migrationOldCurrent],"import {stripConsumerLoader}',
    'seams:["import {stripConsumerLoader}');
  assert.equal(now,prior(name));
  assert.equal((source(name).match(/hash:'[a-f0-9]{64}'/g)||[]).length,9);
  for(const changed of [source(name)+'\n// forged\n',source(name).replace('The original consumer-loader theorem','The altered consumer-loader theorem')]){
    assert.throws(()=>restoreLiveLearningMigrationConsumer(restoreNineRootAccessReader(restoreNineRootQueryReader(changed))));
  }
});

test('loader names the actual candidate module and exports its compiled implementation',()=>{
  const loader=read('atlas-runtime-expansion-loader.mjs');
  assert.match(loader,/components\/atlas-runtime-expansion\.ts/);
  assert.match(loader,/typeof module\.exports\.createAtlasRuntimeExpansion/);
  assert.match(loader,/export const atlasRuntimeExpansionModule=module\.exports/);
});

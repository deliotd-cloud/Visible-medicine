import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {stripConsumerLoader} from './live-learning-consumer-loader-transition.mjs';
import {restoreMigrationLaterRole} from './head-manual-migration-later-inverse.mjs';
import {restoreConsumerAccessLaterRole} from './live-learning-consumer-access-later-inverse.mjs';
import {restoreStudyTransportQueryHarness,restoreStructureQueryHarness,restoreTransportMigrationQueryReader,restoreBlankRecoveryKeyboard} from './page-ssr-query-role.mjs';

const sha=text=>createHash('sha256').update(text).digest('hex');
const importSeam="import {liveLearningConsumerModule} from './live-learning-consumer-loader-transition.mjs';\n";
const mapSeam="    './AtlasBodyLearning':liveLearningConsumerModule,\n";
const expansionImport="import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\n";
const expansionMap="    './atlas-runtime-expansion':atlasRuntimeExpansionModule,\n";
const expansionStructureMap="    if(id==='./atlas-runtime-expansion')return atlasRuntimeExpansionModule;\n";
const migrationExpansion="const expansionSeams=[\n  \"import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\\n\",\n  \"    './atlas-runtime-expansion':atlasRuntimeExpansionModule,\\n\",\n];\nconst expanded=()=>readFileSync(new URL('./atlas-study-transport.test.ts',import.meta.url),'utf8');\n";
const migrationOldCurrent="const current=()=>stripConsumerLoader(readFileSync(new URL('./atlas-study-transport.test.ts',import.meta.url),'utf8'),[";
const migrationNewCurrent="const current=()=>stripConsumerLoader(stripConsumerLoader(expanded(),expansionSeams),[";
const migrationRefusal="\ntest('transport migration refuses a missing, duplicated or substituted real expansion dependency',()=>{\n  const source=expanded();\n  for(const changed of [\n    source.replace(expansionSeams[0],''),\n    source+expansionSeams[1],\n    source.replace(expansionSeams[1],\"    './atlas-runtime-expansion':{},\\n\"),\n  ])assert.throws(()=>stripConsumerLoader(changed,expansionSeams));\n});\n";
const definitions={
  'atlas-study-transport.test.ts':{
    hash:'6d870cbeef5f4a23480af267c1f62fcdddeb0a47caaa1913fe7a20aabc6795ed',
    seams:[expansionImport,expansionMap,importSeam,
      ["    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:'test-reference-teaching'},\n"+mapSeam,"    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:'test-reference-teaching'},\n"],
      ["    './atlas-runtime-frame.css':{},\n"+mapSeam,"    './atlas-runtime-frame.css':{},\n"],
      ["return [element,...(element.type===liveLearningConsumerModule.AtlasBodyLearning?[]:typeof element.type==='function'?elements(element.type(element.props)):elements(element.props.children))];","return [element,...(typeof element.type==='function'?elements(element.type(element.props)):elements(element.props.children))];"],
    ],
  },
  'head-guided-model-commit.test.ts':{hash:'2b2c3f1d49fc47ffdb9fbf3433848f1b3c3e51f2ef1fc7694ba014141b143c96',seams:[importSeam,mapSeam]},
  'head-guided-model-playback.test.ts':{hash:'d15addc34da6fba395551041f4e53476dac374ffe4f726454a5fef974fa39911',seams:[importSeam,mapSeam]},
  'head-guided-model.test.ts':{hash:'f9cc198aec25c6fcb85fb71619c0e293285d0764a8e77f5d0ef12e73d0f6f6ca',seams:[importSeam,mapSeam]},
  'head-live-model.test.ts':{hash:'f2e007ef253318afc61e50d5942acb0cfdc5fcb856ec5cb801ef81f9d6ae623a',seams:[importSeam,"'./AtlasBodyLearning':liveLearningConsumerModule,"]},
  'head-model-blank-recovery.test.mjs':{hash:'f7b3919788a4d9177f7265b1813ca4e351e7b2e8872b4ba124911e612bc62a55',seams:[importSeam,mapSeam]},
  'structure-learning-ui.test.ts':{hash:'cf8a27b13d56341a99eb54871497f97c064345f436fc5f8906d31b3b719f9c8f',seams:[expansionImport,expansionStructureMap,importSeam,"    if(id==='./AtlasBodyLearning')return liveLearningConsumerModule;\n"]},
  'atlas-study-transport-migration.test.mjs':{
    hash:'f50448b909131fe128a1e46362a1c731afee12cd4cfab823543c9f309dec8526',
    seams:[migrationExpansion,migrationRefusal,[migrationNewCurrent,migrationOldCurrent],"import {stripConsumerLoader} from './live-learning-consumer-loader-transition.mjs';\n",
      ["const current=()=>stripConsumerLoader(readFileSync(new URL('./atlas-study-transport.test.ts',import.meta.url),'utf8'),[\n  \"import {liveLearningConsumerModule} from './live-learning-consumer-loader-transition.mjs';\\n\",\n  [\"    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:'test-reference-teaching'},\\n    './AtlasBodyLearning':liveLearningConsumerModule,\\n\",\"    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:'test-reference-teaching'},\\n\"],\n  [\"    './atlas-runtime-frame.css':{},\\n    './AtlasBodyLearning':liveLearningConsumerModule,\\n\",\"    './atlas-runtime-frame.css':{},\\n\"],\n  [\"return [element,...(element.type===liveLearningConsumerModule.AtlasBodyLearning?[]:typeof element.type==='function'?elements(element.type(element.props)):elements(element.props.children))];\",\"return [element,...(typeof element.type==='function'?elements(element.type(element.props)):elements(element.props.children))];\"],\n]);","const current=()=>readFileSync(new URL('./atlas-study-transport.test.ts',import.meta.url),'utf8');"],
    ],
  },
  'head-manual-recovery-migration.test.mjs':{hash:'d916732dd2c3bfc6629e830b078652a9af67e46fb7381ceaf4f75a055ab61beb',seams:[]},
};

test('all nine consumer roots preserve their canonical original bytes under exact additive inverses',()=>{
  for(const [name,{hash,seams}] of Object.entries(definitions)){
    const fixture=readFileSync(new URL(`./fixtures/live-learning-consumer-loader/${name}.raw`,import.meta.url),'utf8');
    assert.equal(sha(fixture),hash,`${name} pinned original hash`);
    const candidate=readFileSync(new URL(`./${name}`,import.meta.url),'utf8');
    const queryPrior=name==='head-model-blank-recovery.test.mjs'?restoreBlankRecoveryKeyboard(candidate):name==='atlas-study-transport.test.ts'?restoreStudyTransportQueryHarness(candidate)
      :name==='structure-learning-ui.test.ts'?restoreStructureQueryHarness(candidate)
      :name==='atlas-study-transport-migration.test.mjs'?restoreTransportMigrationQueryReader(candidate):candidate;
    const historical=name==='head-manual-recovery-migration.test.mjs'
      ?restoreMigrationLaterRole(name,Buffer.from(queryPrior),Buffer.from(fixture)).toString()
      :restoreConsumerAccessLaterRole(name,queryPrior);
    assert.equal(stripConsumerLoader(historical,seams),fixture,`${name} exact whole-source inverse`);
    if(name==='head-manual-recovery-migration.test.mjs'){
      assert.deepEqual(seams,[],'The original consumer-loader theorem has no migration seam');
      assert.throws(()=>restoreMigrationLaterRole(name,Buffer.from(candidate+'\n// forged\n'),Buffer.from(fixture)));
      assert.throws(()=>restoreMigrationLaterRole(name,Buffer.from(candidate),Buffer.from(fixture+' ')));
    }
  }
});

test('inverse rejects missing, duplicated, and changed declared seams',()=>{
  const source=readFileSync(new URL('./head-guided-model-commit.test.ts',import.meta.url),'utf8');
  for(const changed of [source.replace(mapSeam,''),source+mapSeam,source.replace(mapSeam,mapSeam.replace('AtlasBodyLearning','FakeLearning'))])
    assert.throws(()=>stripConsumerLoader(changed,[importSeam,mapSeam]));
});

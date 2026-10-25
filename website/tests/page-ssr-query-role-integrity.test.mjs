import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {
  restoreStructureQueryHarness,restoreStudyTransportQueryHarness,restoreTransportMigrationQueryReader,
  restoreNineRootQueryReader,restoreNineRootAccessReader,restoreAtlas3dQueryPage,
} from './page-ssr-query-role.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');

test('each later query and access role restores the exact preceding whole source',()=>{
  const structure=restoreStructureQueryHarness(read('./structure-learning-ui.test.ts'));
  assert.equal(sha(structure),'8dd6cd60031b2d10a9bf4a40e328cd66341ad9ca7d30c56af072e3db4fe6cb52');
  assert.equal(structure.replace("import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\n",'')
    .replace("    if(id==='./atlas-runtime-expansion')return atlasRuntimeExpansionModule;\n",''),
    read('./preimages/structure-learning-ui.test.ts.raw'));
  assert.equal(sha(restoreStudyTransportQueryHarness(read('./atlas-study-transport.test.ts'))),
    '9a512afaee67ce5e3c0faedb711d2e00f28e0531bb9e723fe28ffec57bc0f34c');
  assert.equal(sha(restoreTransportMigrationQueryReader(read('./atlas-study-transport-migration.test.mjs'))),
    '91ad3ef583626e68f2e3988e82222ba6378da6601b91310aef7e75e81dab24f8');
  const priorNine=restoreNineRootQueryReader(read('./live-learning-consumer-loader-preservation.test.mjs'));
  assert.equal(sha(priorNine),'e83550441cc458d026bdf700f597f2444224aa0146cfc753ef5a86ea6817a783');
  assert.equal(restoreNineRootAccessReader(priorNine),
    read('./fixtures/live-learning-access-before/live-learning-consumer-loader-preservation.test.mjs.raw'));
});

test('the page role restores the complete shared-frame page and refuses foreign role names',()=>{
  const row=JSON.parse(read('./fixtures/atlas-runtime-pages-before-recovery.json')).records
    .find(record=>record.path==='app/atlas/3d/page.tsx');
  assert(row);
  const before=Buffer.from(row.beforeBase64,'base64');
  assert.equal(sha(before),row.beforeSha256);
  const expected="import {AtlasRuntimeFrame} from '../../../components/AtlasRuntimeFrame';\n"
    +before.toString().replaceAll('\r\n','\n').replace('<iframe','<AtlasRuntimeFrame');
  const current=read('../app/atlas/3d/page.tsx').replaceAll('\r\n','\n');
  assert.equal(restoreAtlas3dQueryPage(current),expected);
  assert.throws(()=>restoreAtlas3dQueryPage(read('../app/atlas/spine-3d/page.tsx')));
});

test('complete-source roles reject altered current assertions, omitted dependencies and foreign additions',()=>{
  const roots=[
    ['structure-learning-ui.test.ts',restoreStructureQueryHarness,"tourEntry.exports","{}"],
    ['atlas-study-transport.test.ts',restoreStudyTransportQueryHarness,"regionalTourEntrySuffix:tourEntryExports.regionalTourEntrySuffix","regionalTourEntrySuffix:()=>''"],
    ['atlas-study-transport-migration.test.mjs',restoreTransportMigrationQueryReader,'restoreStudyTransportQueryHarness(expanded())','expanded()'],
    ['live-learning-consumer-loader-preservation.test.mjs',restoreNineRootQueryReader,'restoreStructureQueryHarness(candidate)','candidate'],
  ];
  for(const [name,restore,from,to] of roots){
    const current=read('./'+name),changed=current.replace(from,to);
    assert.notEqual(changed,current,name+' mutation must reach its named source');
    assert.throws(()=>restore(changed),name+' changed role must refuse');
    assert.throws(()=>restore(current+'\n// foreign source\n'),name+' appended text must refuse');
  }
  const current=read('./fixtures/live-learning-access-before/live-learning-consumer-loader-preservation.test.mjs.raw');
  assert.throws(()=>restoreNineRootAccessReader(current),'Access inverse requires its actual later source');
});

test('each complete page query seam refuses loss, duplication, substitution and reordering',()=>{
  const current=read('../app/atlas/3d/page.tsx').replaceAll('\r\n','\n');
  const seams=[
    "import {regionalTourEntrySuffix} from '../../../lib/regional-tour-entry-navigation';\n",
    "import {hasHeadLearningQuery} from '../../../lib/head-atlas-learning';\n",
    '  const tourSuffix=regionalTourEntrySuffix(params);\n',
    '  if(tourSuffix===null||(tourSuffix&&(studySuffix||hasHeadLearningQuery(params))))notFound();\n',
    "  if(!studySuffix&&!tourSuffix&&!region.href.startsWith('/atlas/3d'))redirect(region.href);\n",
    '  const source=`/atlas-runtime/head-neck/index.html?region=${region.id}${studySuffix}${tourSuffix}`;\n',
  ];
  assert.doesNotThrow(()=>restoreAtlas3dQueryPage(current));
  for(const seam of seams){
    assert.equal(current.split(seam).length,2,'Each actual query import, validation, redirect and URL is unique');
    for(const changed of [current.replace(seam,''),current+seam,current.replace(seam,seam+'// foreign seam\n'),
      current.replace(seam,'')+seam]){
      assert.notEqual(changed,current);assert.throws(()=>restoreAtlas3dQueryPage(changed));
    }
  }
  assert.throws(()=>restoreAtlas3dQueryPage(current.replace('studySuffix||hasHeadLearningQuery(params)','false')));
});

// Uses the actual named inverse; every older recovery assertion remains whole.
import {restoreBlankRecoveryKeyboard} from './page-ssr-query-role.mjs';
test('real keyboard dependency additions preserve the entire earlier recovery proof and reject tampering',()=>{
  const current=read('./head-model-blank-recovery.test.mjs'),original=read('./fixtures/live-learning-consumer-loader/head-model-blank-recovery.test.mjs.raw');
  let prior=restoreBlankRecoveryKeyboard(current);
  for(const seam of ["import {liveLearningConsumerModule} from './live-learning-consumer-loader-transition.mjs';\n","    './AtlasBodyLearning':liveLearningConsumerModule,\n"]){assert.equal(prior.split(seam).length,2);prior=prior.replace(seam,'');}
  assert.equal(prior,original);assert.equal(sha(original),'f7b3919788a4d9177f7265b1813ca4e351e7b2e8872b4ba124911e612bc62a55');
  for(const seam of ["import * as keyboard from '../lib/head-disclosure-keyboard.ts';\n","  '../lib/head-disclosure-keyboard.ts':keyboard,\n"])for(const changed of [current.replace(seam,''),current+seam,current.replace(seam,seam+'// foreign\n')])assert.throws(()=>restoreBlankRecoveryKeyboard(changed));
  const changed=current.replace("assert.equal(h.frame.key,afterClick,'retained callback cannot remount a second time');",'');
  assert.notEqual(changed,current);assert.throws(()=>restoreBlankRecoveryKeyboard(changed));
});

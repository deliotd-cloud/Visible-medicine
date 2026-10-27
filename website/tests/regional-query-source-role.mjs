import assert from 'node:assert/strict';
import {restoreJointNavigationLegacy} from './joint-navigation-legacy-adapter.mjs';

const oldNavigation="const {selectedBodyRegion}=compiled('lib/atlas-navigation.ts');\n";
export const regionalNavigation=`const {atlasBodyRegions,selectedBodyRegion}=compiled('lib/atlas-navigation.ts');
const {regionalTourEntrySuffix}=compiled('lib/regional-tour-entry-navigation.ts',{
  './atlas-navigation':{atlasBodyRegions},
});
const {hasHeadLearningQuery}=require('../lib/head-atlas-learning.ts');
`;
export const regionalPageDependencies=`  '../../../lib/regional-tour-entry-navigation':{regionalTourEntrySuffix},
  '../../../lib/head-atlas-learning':{hasHeadLearningQuery},
`;
export const regionalQueryTest=String.raw`
test('real query validators keep regional tours separate from study and head-learning handoffs',async()=>{
  const tour={regionalTour:'synthetic-tour',tourRevision:'synthetic-revision',tourSource:manifest.sourceCommit};
  const html=await render({region:'forearm',...tour,patientId:'private'});
  assert.equal(bridgeCalls.length,0);
  const frame=html.match(/<iframe\b[^>]*>/)?.[0];
  assert.ok(frame);
  const url=new URL(frame.match(/\bsrc="([^"]+)"/)[1].replaceAll('&amp;','&'),'https://atlas.test');
  assert.equal(url.pathname,'/atlas-runtime/head-neck/index.html');
  assert.equal(url.searchParams.get('region'),'forearm');
  for(const [key,value] of Object.entries(tour))assert.equal(url.searchParams.get(key),value);
  assert.equal(url.searchParams.has('patientId'),false);
  assert.equal(url.searchParams.has('study'),false);
  for(const params of [
    {region:'forearm',regionalTour:tour.regionalTour},
    {region:'forearm',...tour,regionalTour:[tour.regionalTour,tour.regionalTour]},
    {region:'forearm',...tour,tourRevision:'../invalid'},
    {region:'forearm',...tour,tourSource:'a'.repeat(39)},
    {region:'forearm',...tour,...sourceParams},
    ...['headTour','headStep','headRevision'].map(key=>({region:'forearm',...tour,[key]:'untrusted'})),
  ]){
    await assert.rejects(render(params),/not-found/,JSON.stringify(params));
    assert.equal(bridgeCalls.length,0);
  }
});
`;

function once(source,after,before=''){
  assert.equal(source.split(after).length,2,`Missing or duplicate regional source seam: ${after.slice(0,90)}`);
  return source.replace(after,before);
}

/** Recover the full pre-regional-query non-head test, preserving all earlier proofs. */
export function restoreRegionalQuerySource(name,source){
  assert.equal(name,'atlas-nonhead-comparison-ui.test.mjs','Only the declared non-head test root is admitted');
  assert.equal(typeof source,'string');
  source=restoreJointNavigationLegacy(name,source);
  assert(source.endsWith(regionalQueryTest),'The exact complete regional query test must be the final addition');
  const navigation=source.indexOf(regionalNavigation),dependencies=source.indexOf(regionalPageDependencies);
  assert(navigation>=0&&dependencies>navigation,'Regional imports must precede their real page dependencies');
  assert(source.indexOf(oldNavigation)<0,'Old and new navigation seams may not coexist');
  return once(once(once(source,regionalQueryTest),regionalPageDependencies),regionalNavigation,oldNavigation);
}

const migrationImport="import {restoreRegionalQuerySource} from './regional-query-source-role.mjs';\n";
const migrationBefore="assert.equal(stripLiveLearningLoader(stripExpansionLoader(candidate)),expected,'Only real shared-component imports may be added; all original tests/assertions remain exact');";
const migrationAfter="assert.equal(stripLiveLearningLoader(restoreRegionalQuerySource('atlas-nonhead-comparison-ui.test.mjs',stripExpansionLoader(candidate))),expected,'Only real shared-component imports may be added; all original tests/assertions remain exact');";
/** Recover the migration reader before its regional-query stage. */
export function restoreRegionalQueryMigrationSource(source){
  assert.equal(typeof source,'string');
  assert(source.indexOf(migrationImport)<source.indexOf(migrationAfter),'Migration import must precede its assertion');
  return once(once(source,migrationAfter,migrationBefore),migrationImport);
}

const loaderImport="import {restoreRegionalQuerySource,restoreRegionalQueryMigrationSource} from './regional-query-source-role.mjs';\n";
const loaderTestBefore="const currentTest=()=>restoreExtraExpansionSource('atlas-nonhead-comparison-ui.test.mjs',read('./atlas-nonhead-comparison-ui.test.mjs'));";
const loaderTestAfter="const currentTest=()=>restoreRegionalQuerySource('atlas-nonhead-comparison-ui.test.mjs',restoreExtraExpansionSource('atlas-nonhead-comparison-ui.test.mjs',read('./atlas-nonhead-comparison-ui.test.mjs')));";
const loaderMigrationBefore="const currentMigration=()=>restoreExtraExpansionSource('nonhead-frame-migration.test.mjs',read('./nonhead-frame-migration.test.mjs'));";
const loaderMigrationAfter="const currentMigration=()=>restoreExtraExpansionSource('nonhead-frame-migration.test.mjs',restoreRegionalQueryMigrationSource(read('./nonhead-frame-migration.test.mjs')));";
/** Recover the complete learning-loader theorem before its new reader stage. */
export function restoreRegionalQueryLoaderPreservationSource(source){
  assert.equal(typeof source,'string');
  const positions=[loaderImport,loaderTestAfter,loaderMigrationAfter].map(seam=>source.indexOf(seam));
  assert(positions[0]>=0&&positions[1]>positions[0]&&positions[2]>positions[1],'Regional theorem readers must remain ordered');
  return once(once(once(source,loaderMigrationAfter,loaderMigrationBefore),loaderTestAfter,loaderTestBefore),loaderImport);
}

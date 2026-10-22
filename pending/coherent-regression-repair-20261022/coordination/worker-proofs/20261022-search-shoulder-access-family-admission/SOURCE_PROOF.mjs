import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

// Pure source reads and byte inverses only. No website modules or validators load.
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261022-search-shoulder-access-family-admission';
const shared='F:/VisibleMedicine/staging/20261022-shared-nonregional-fixture-proposal/atlas-nonregional-release-fixture.ts';
const read=(base,path)=>readFileSync(join(base,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pinned={
  'tests/atlas-search-study-handoff.test.ts':'09bca4fb25b17d05ad86b758efd084eb5c36240d7f2d3d469fe3cd92a7180b39',
  'tests/atlas-shoulder-access.test.ts':'aa8323319f05d0e2d4366dff71092d08ebec398d8651565341aa97120ec648e1',
  'tests/current-atlas-delivery.mjs':'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5',
  'tests/fixtures/current-atlas-delivery.json':'db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f',
};
for(const [path,hash] of Object.entries(pinned))assert.equal(sha(read(website,path)),hash,`website source drift: ${path}`);
const search=read(website,'tests/atlas-search-study-handoff.test.ts');
assert.deepEqual(search,read(stage,'tests/preimages/atlas-search-study-handoff.test.ts.raw'));
assert.match(search.toString('utf8'),/currentNonregionalAtlasSources/);
assert.match(search.toString('utf8'),/assert\.deepEqual\(current\.sources\.filter\(\(s:\{module:string\}\)=>s\.module!=='head-neck'\),currentNonregionalAtlasSources\)/);
const sharedBytes=readFileSync(shared);
assert.equal(sha(sharedBytes),'bc4c211ad1738e4dc75ac4da64b2a650072d79eb8368b84cc4af8a5f637470e0');
assert.equal(sharedBytes.toString('utf8').split('sourceCommit:pin.runtimeSources[module]').length,2);

const original=read(stage,'tests/preimages/atlas-shoulder-access.test.ts.raw');
const proposal=read(stage,'tests/atlas-shoulder-access.test.ts');
assert.deepEqual(original,read(website,'tests/atlas-shoulder-access.test.ts'));
assert.equal(sha(proposal),'b7e7b1f131625cf0f8f95c6ab83b993ad0c25d54b6d89ace949e6ff7b0a3e308');
const inverse=[
  [" const runtimeRevision=historic?sourceRevision:validateCurrentAtlasDelivery().runtimeSources.shoulder;\n",''],
  [" assert.equal(learner.sourceCommit,runtimeRevision);assert.equal(review.revision,sourceRevision);assert.equal(viewer.sourceCommit,sourceRevision);\n",
   " assert.equal(learner.sourceCommit,sourceRevision);assert.equal(review.revision,sourceRevision);assert.equal(viewer.sourceCommit,sourceRevision);\n"],
  ["  const hash=historic?oldHash:sha(source(runtimeRevision,path));\n",
   "  const hash=historic?oldHash:sha(source(sourceRevision,path));\n"],
  ["  const reviewHash=historic?oldHash:sha(source(sourceRevision,path));\n",''],
  ["  assert.equal(imported?.sourceSha256,reviewHash);assert.equal(sha(readFileSync(root+'atlas-review/'+path)),imported.importedSha256);\n",
   "  assert.equal(imported?.sourceSha256,hash);assert.equal(sha(readFileSync(root+'atlas-review/'+path)),imported.importedSha256);\n"],
  ["  assert.equal(new Map(pins.display).get(path),reviewHash);\n",
   "  assert.equal(new Map(pins.display).get(path),hash);\n"],
];
let restored=proposal.toString('utf8');
for(const [added,prior] of inverse){
  assert.equal(restored.split(added).length,2,`nonunique inverse seam: ${added}`);
  restored=restored.replace(added,prior);
}
assert.deepEqual(Buffer.from(restored,'utf8'),original,'complete historical/current test source did not restore');
for(const bytes of [original,proposal])assert.equal(bytes.includes(13),false,'unexpected CRLF conversion');
assert.equal((original.toString('utf8').match(/^test\(/gm)||[]).length,2);
assert.equal((proposal.toString('utf8').match(/^test\(/gm)||[]).length,2);

const pin=JSON.parse(read(website,'tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
for(const path of [
  'public/atlas-runtime/shoulder/manifest.json',
  'public/atlas-runtime/shoulder/source-inputs.json',
  'atlas-review/manifest.json',
  'public/atlas-review-viewer/manifest.json',
])assert.equal(sha(read(website,path)),pin.documents[path],`pinned delivery document drift: ${path}`);
const runtime=JSON.parse(read(website,'public/atlas-runtime/shoulder/manifest.json'));
const inputs=JSON.parse(read(website,'public/atlas-runtime/shoulder/source-inputs.json'));
const review=JSON.parse(read(website,'atlas-review/manifest.json'));
const viewer=JSON.parse(read(website,'public/atlas-review-viewer/manifest.json'));
const display=new Map(JSON.parse(read(website,'atlas-review/content/review-revisions.json')).display);
assert.equal(runtime.sourceCommit,pin.runtimeSources.shoulder);
assert.equal(review.revision,pin.source);
assert.equal(viewer.sourceCommit,pin.source);
const committed=(revision,path)=>execFileSync('git',['--no-replace-objects','show',`${revision}:${path}`],{cwd:atlas,maxBuffer:32e6,windowsHide:true});
for(const path of ['app/anatomy-scene.tsx','lib/model-load-failure.ts']){
  const runtimeHash=sha(committed(pin.runtimeSources.shoulder,path));
  const reviewHash=sha(committed(pin.source,path));
  const runtimeRows=inputs.filter(row=>row.path===path);
  const reviewRows=review.files.filter(row=>row.path===path);
  assert.equal(runtimeRows.length,1);assert.equal(reviewRows.length,1);
  assert.equal(runtimeRows[0].sha256,runtimeHash,`runtime family source: ${path}`);
  assert.equal(reviewRows[0].sourceSha256,reviewHash,`Review current source: ${path}`);
  assert.equal(display.get(path),reviewHash,`Review display pin: ${path}`);
  assert.equal(sha(read(website,`atlas-review/${path}`)),reviewRows[0].importedSha256,`Review imported bytes: ${path}`);
}
process.stdout.write(JSON.stringify({status:'PASS_SOURCE_ONLY',searchOriginalSha256:sha(search),shoulderOriginalSha256:sha(original),shoulderProposalSha256:sha(proposal),sharedFixtureSha256:sha(sharedBytes),runtimeRevision:pin.runtimeSources.shoulder,reviewRevision:pin.source,registeredShoulderTests:2,wholeSourceInverseSeams:inverse.length})+'\n');

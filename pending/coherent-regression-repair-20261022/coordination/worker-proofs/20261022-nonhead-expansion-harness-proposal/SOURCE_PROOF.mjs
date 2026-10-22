import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

// Pure source-byte proof: no website module, test runner, renderer, or transpiler is loaded.
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const stage='F:/VisibleMedicine/staging/20261022-nonhead-expansion-harness-proposal';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pinned={
  'components/AtlasRuntimeFrame.tsx':'7d4d9d36f5f8b7a88477355ba76b3adb4e93d080cff9356dfe5725f3fc6c76d8',
  'components/atlas-runtime-expansion.ts':'bc93f073905072c8628624712a1758517471ac121483a291573e9f65fd28611b',
  'components/AtlasBodyLearning.tsx':'8512c42af12098b2833a901245ac08406f081c3edacbfabe2d6bc5d73b544d42',
  'tests/atlas-runtime-expansion-loader.mjs':'fbd8ce6e4644625496315a4647b08aa02ff62a5933629b26b0ad12e05874985c',
  'tests/learning-frame-loader-transition.mjs':'8960c131bdc559903a595c1ba7d15dccf4d031b0eb4bd9f9ecc784531ac04d31',
  'app/atlas/3d/page.tsx':'b3ac1b8724b30e147679dc0aa6a6ab5f381adf8212f88da2e8a8aced21efc442',
  'public/atlas-runtime/head-neck/manifest.json':'19a748c5db1b162fa6968b53bab79aa75c255de19420c145465aed60539ace5b',
};
for(const [name,expected] of Object.entries(pinned)){
  assert.equal(sha(readFileSync(join(website,name))),expected,`source drift: ${name}`);
}
const original=readFileSync(join(stage,'tests/preimages/atlas-nonhead-comparison-ui.test.mjs.raw'));
const candidate=readFileSync(join(stage,'tests/atlas-nonhead-comparison-ui.test.mjs'));
const live=readFileSync(join(website,'tests/atlas-nonhead-comparison-ui.test.mjs'));
assert.equal(sha(original),'bfefaa999afd7fffd55d4664ada902380bfbc4b539d7c89460df7afb8aa28fc2');
assert.deepEqual(live,original,'frozen source test differs from the staged raw preimage');
assert.equal(sha(candidate),'c5f978d63d09ffbfaee2b0ecdf3c12dc9224554c29a09310aa3bb7eb52b9ba6f');
const inserted=[
  "import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\n",
  "  './atlas-runtime-expansion':atlasRuntimeExpansionModule,\n",
];
let restored=candidate.toString('utf8');
for(const seam of inserted){
  assert.equal(restored.split(seam).length,2,`missing or duplicate seam: ${seam}`);
  restored=restored.replace(seam,'');
}
assert.deepEqual(Buffer.from(restored,'utf8'),original,'whole original source failed byte inverse');
for(const bytes of [original,candidate]){
  assert.equal(bytes.includes(13),false,'unexpected CR or CRLF conversion');
}
const frame=readFileSync(join(website,'components/AtlasRuntimeFrame.tsx'),'utf8');
assert.equal(frame.split("from './atlas-runtime-expansion'").length,2);
const loader=readFileSync(join(website,'tests/atlas-runtime-expansion-loader.mjs'),'utf8');
assert.match(loader,/components\/atlas-runtime-expansion\.ts/);
assert.match(loader,/typeof module\.exports\.createAtlasRuntimeExpansion/);
assert.match(loader,/export const atlasRuntimeExpansionModule=module\.exports/);
assert.equal((candidate.toString('utf8').match(/^test\(/gm)||[]).length,3);
const manifest=JSON.parse(readFileSync(join(website,'public/atlas-runtime/head-neck/manifest.json'),'utf8'));
assert.equal(manifest.sourceCommit,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
process.stdout.write(JSON.stringify({status:'PASS_SOURCE_ONLY',originalSha256:sha(original),proposalSha256:sha(candidate),originalBytes:original.length,proposalBytes:candidate.length,registeredTests:3,insertions:2,sourceInputs:pinned,sourceCommit:manifest.sourceCommit})+'\n');

// Create-only source proposal. Main runs this only after the future Website's
// actual Review binding, viewer and default pin have been completed.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const stage = 'F:/VisibleMedicine/staging/20261025-model-preflight-delivery-role-v2-proposal';
const website = 'F:/VisibleMedicine/staging/20261025-model-preflight-website/website';
const parent = 'F:/VisibleMedicine/staging/20261025-dental-ct-website/website';
const native = 'F:/VisibleMedicine/staging/20261025-contained-model-preflight-native/atlas';
const head = '665c53a4d21667d14f12cf2e81a200d5da3df3ac';
const tree = 'dfbba5b89ba5c496fb83cbda410a4426a68b7409';
const oldHead = '44ffcc39b13d1fe85827c79a3e6a1a29be5b4a14';
const oldTree = 'dbe75aee430bf171135b46e66e84bf5139557372';
const parentHash = '791926fad49169daca4f2f49f1afcd7af8bca4de35699e1ee2a20a46fb8b7988';
const successorHash = 'd873c8ce430f9b11aab234e406dbd6cf98a8a47403bc8e1021fe80059a2b7c96';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = p => readFileSync(p);
const json = p => JSON.parse(read(p));
const source = path.join(stage, 'files/tests/current-atlas-delivery.test.mjs');
const frozen = path.join(stage, 'files/tests/fixtures/current-atlas-delivery-before-model-preflight-665c.mjs.raw');
const prepared = path.join(stage, 'prepared');
assert(!existsSync(prepared), 'Existing prepared output must be preserved');
for (const root of [website, parent, native]) assert(lstatSync(root).isDirectory() &&
  !lstatSync(root).isSymbolicLink(), `Missing or linked root: ${root}`);
for (const [p, expected] of [
  ['F:/VisibleMedicine/staging/20261025-dental-ct-website/SOURCE_CANDIDATE.json',
    '6d2f25ceedbaad4cddaa900e7b4487644b51ce38f8df4263f4370532a632e1b9'],
  ['F:/VisibleMedicine/staging/20261025-contained-model-preflight-native/SOURCE_CANDIDATE.json',
    '967f97c1dd506591502556640124159d19f39fc6c7092cbf96aa7c54e38b381d'],
]) assert.equal(sha(read(p)), expected, `Source receipt changed: ${p}`);
const git = (...args) => execFileSync('git', ['-C', native, ...args], {
  encoding: 'utf8', windowsHide: true,
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_OPTIONAL_LOCKS: '0' },
}).trim();
assert.equal(git('rev-parse', 'HEAD'), head);
assert.equal(git('rev-parse', 'HEAD^{tree}'), tree);
assert.equal(git('status', '--porcelain', '--untracked-files=all'), '');
assert.equal(sha(read(path.join(parent, 'tests/current-atlas-delivery.test.mjs'))), parentHash);
assert.equal(sha(read(path.join(website, 'tests/current-atlas-delivery.test.mjs'))), parentHash,
  'Future Website test root changed before this source proposal');
assert.equal(sha(read(frozen)), parentHash, 'Frozen 43-case parent differs');
assert.equal(sha(read(source)), successorHash, 'Staged successor differs');
assert(!existsSync(path.join(website,
  'tests/fixtures/current-atlas-delivery-before-model-preflight-665c.mjs.raw')),
  'Future Website already has this role fixture');

const modules = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
const review = json(path.join(website, 'atlas-review/manifest.json'));
const inputs = json(path.join(website, 'atlas-review/integration-inputs.json'));
const viewer = json(path.join(website, 'public/atlas-review-viewer/manifest.json'));
const pin = json(path.join(website, 'tests/fixtures/current-atlas-delivery.json'));
assert.equal(review.revision, head);
assert.equal(review.files.length, 1610);
assert.equal(inputs.sourceCommit, head);
assert.equal(inputs.inputs.length, 1814);
const integration = sha(Buffer.from(JSON.stringify(inputs.inputs)));
assert.equal(inputs.sha256, integration);
assert.equal(viewer.sourceCommit, head);
assert.equal(viewer.websiteIntegrationSha256, integration);
assert.equal(viewer.mode, 'production');
assert.equal(viewer.personalRecordsIncluded, false);
assert.equal(viewer.files.length, 54);
assert.equal(viewer.packages.length, 24);
assert.equal(pin.source, head);
assert.equal(pin.sourceTree, tree);
assert.deepEqual(Object.keys(pin.runtimeSources).sort(), modules.slice().sort());
for (const name of modules) {
  assert.equal(pin.runtimeSources[name], head);
  const runtime = json(path.join(website, `public/atlas-runtime/${name}/manifest.json`));
  assert.equal(runtime.sourceCommit, head);
  assert.equal(runtime.patientDataIncluded, false);
}
assert.equal(pin.reviewIntegration, integration);
assert.equal(pin.reviewSourceFiles, 1610);
assert.equal(pin.viewerFiles, 54);
assert.equal(pin.viewerPackages, 24);
const expectedDocuments = [
  'atlas-review/manifest.json', 'atlas-review/integration-inputs.json',
  'public/atlas-review-viewer/manifest.json', 'lib/atlas-model-inventory.json',
  ...modules.flatMap(name => [`public/atlas-runtime/${name}/manifest.json`,
    `public/atlas-runtime/${name}/source-inputs.json`]),
];
assert.deepEqual(Object.keys(pin.documents).sort(), expectedDocuments.slice().sort());
for (const p of expectedDocuments) assert.equal(sha(read(path.join(website, p))),
  pin.documents[p], `Current pin document mismatch: ${p}`);
const modelInventory = json(path.join(website, 'lib/atlas-model-inventory.json'));
const oldInventory = json(path.join(parent, 'lib/atlas-model-inventory.json'));
const expectedInventory = structuredClone(oldInventory);
assert.equal(expectedInventory.sources.length, modules.length);
for (const row of expectedInventory.sources) {
 assert(modules.includes(row.module));
 row.sourceCommit = head;
 row.manifestSha256 = sha(read(path.join(website, 'public/atlas-runtime/'+row.module+'/manifest.json')));
}
assert.deepEqual(modelInventory, expectedInventory, 'Only actual source revision and module-manifest fingerprints may change; every model byte, path and policy field remains exact');

// The new whole-source witness must invert exactly to the frozen 43-case root.
const candidate = read(source).toString();
const marker = "\ntest('current 665c roles invert to the complete 44ff delivery source'";
assert.equal(candidate.split(marker).length, 2);
let inverse = candidate.slice(0, candidate.indexOf(marker));
const one = (from, to) => {
  assert.equal(inverse.split(from).length, 2, `Missing or duplicate source seam: ${from}`);
  inverse = inverse.replace(from, to);
};
one(`assert.equal(CURRENT_ATLAS_REVISION,'${head}');`,
  `assert.equal(CURRENT_ATLAS_REVISION,'${oldHead}');`);
one(`assert.equal(pin.sourceTree,'${tree}');`,
  `assert.equal(pin.sourceTree,'${oldTree}');`);
for (const name of ["'head-neck'", 'shoulder', "'lower-limb'", "'female-pelvis'"])
  one(`${name}:'${head}'`, `${name}:'${oldHead}'`);
one('assert.equal(sourceFiles,1610);assert.equal(inputs,1814);assert(artifacts>100);',
  'assert.equal(sourceFiles,1608);assert.equal(inputs,1812);assert(artifacts>100);');
one("const current=read('tests/fixtures/current-atlas-delivery-before-model-preflight-665c.mjs.raw').toString();",
  "const current=read('tests/current-atlas-delivery.test.mjs').toString();");
assert.equal(inverse, read(frozen).toString(), 'Complete 43-case parent source inverse failed');

mkdirSync(path.join(prepared, 'tests/fixtures'), { recursive: true });
writeFileSync(path.join(prepared, 'tests/current-atlas-delivery.test.mjs'), read(source), { flag: 'wx' });
writeFileSync(path.join(prepared,
  'tests/fixtures/current-atlas-delivery-before-model-preflight-665c.mjs.raw'),
  read(frozen), { flag: 'wx' });
const receipt = {
  schema: 'vm-model-preflight-current-role-prepared/1', source: head, tree,
  parentRootSha256: parentHash, successorSha256: successorHash,
  reviewSourceFiles: review.files.length, protectedIntegrationInputs: inputs.inputs.length,
  reviewIntegrationSha256: integration, viewerFiles: viewer.files.length,
  viewerPackages: viewer.packages.length, runtimeSources: pin.runtimeSources,
  completeSourceInversePassed: true, historicalAssertionsModified: false,
  installed: false, testsRun: false, clinicalApproval: false,
};
writeFileSync(path.join(prepared, 'RECEIPT.json'), JSON.stringify(receipt, null, 2) + '\n',
  { flag: 'wx' });
console.log(JSON.stringify({ prepared, source: head, parentCases: 43,
  successorCases: 44, installed: false, testsRun: false }));

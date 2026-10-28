// Run only after main has generated all four inventories with the stock Website
// generator. This prepares reviewable files inside this proposal directory;
// it never installs into the Website candidate or native Atlas.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const proposal = 'F:/VisibleMedicine/staging/20261028-quadriceps-coverage-proposal';
const atlas = 'F:/VisibleMedicine/staging/20261027-quadriceps-tour/atlas';
const nativeManifest = 'F:/VisibleMedicine/staging/20261027-quadriceps-tour/SOURCE_CANDIDATE.json';
const websiteParentManifest = 'F:/VisibleMedicine/staging/20261027-course-directory/SOURCE_CANDIDATE_V3.json';
const websitePreparation = 'F:/VisibleMedicine/staging/20261028-quadriceps-website/PREPARATION.json';
const revision = '44516d0ab85be6c6d6a3accec42b1e7372a0886b';
const tree = '751918d281359cef629b37288697e3a9beec4d3e';
const oldRevision = 'dc0f5d9648b73e4baf25f468e52963b1d503df68';
const hash = b => createHash('sha256').update(b).digest('hex');
const read = p => readFileSync(p);
const git = (...args) => execFileSync('git', args, {
  cwd: atlas, windowsHide: true, maxBuffer: 64e6,
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_OPTIONAL_LOCKS: '0' },
}).toString().trim();
const parseArgs = argv => {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    assert(['--website', '--coverage'].includes(argv[i]) && !Object.hasOwn(args, argv[i]) && argv[i + 1],
      'Supply exactly --website and --coverage');
    assert(path.isAbsolute(argv[i + 1]), 'Absolute Website and coverage paths required');
    args[argv[i]] = path.resolve(argv[i + 1]);
  }
  assert(Object.keys(args).length === 2 && path.isAbsolute(args['--website']) &&
    path.isAbsolute(args['--coverage']), 'Absolute Website and coverage paths required');
  return { website: args['--website'], coverage: args['--coverage'] };
};
const { website, coverage } = parseArgs(process.argv.slice(2));
const output = path.join(proposal, 'prepared');
assert(!existsSync(output), 'Keep prior prepared candidate; use a fresh proposal copy');
for (const root of [website, coverage, atlas]) assert(lstatSync(root).isDirectory() &&
  !lstatSync(root).isSymbolicLink(), `Linked or missing root: ${root}`);
assert.equal(git('rev-parse', 'HEAD'), revision);
assert.equal(git('rev-parse', 'HEAD^{tree}'), tree);
assert.equal(git('status', '--porcelain', '--untracked-files=all'), '', 'Native source is not clean');
for (const [p, expected] of [
  [nativeManifest, '642b0ac8e9cf0b99a56cf571110bafc2c3c0ccd521d9e86321082c687fa2ef3d'],
  [websiteParentManifest, '4764d6b96003443c3a81302aa4a50f2fbf5576832281e8472bd68b218eee44db'],
]) assert.equal(hash(read(p)), expected, `Source manifest changed: ${p}`);

const prep = JSON.parse(read(websitePreparation));
const parent = JSON.parse(read(websiteParentManifest));
assert.equal(prep.schema, 'vm-quadriceps-website-preparation/1');
assert.equal(path.resolve(website), path.resolve(prep.website), 'Website argument differs from sealed preparation');
assert.equal(path.resolve(coverage), path.resolve('F:/VisibleMedicine/staging/20261028-quadriceps-website/coverage-candidate'),
  'Coverage argument must be the stock candidate for this Website stage');
assert.equal(path.resolve(prep.atlas), path.resolve(atlas));
assert.equal(path.resolve(prep.native.path), path.resolve(nativeManifest));
assert.equal(prep.native.sha256, hash(read(nativeManifest)));
assert.equal(path.resolve(prep.parent.path), path.resolve(websiteParentManifest));
assert.equal(prep.parent.sha256, hash(read(websiteParentManifest)));
assert.equal(prep.atlasHead, revision);
assert.equal(prep.atlasTree, tree);
assert.equal(parent.atlasHead, oldRevision);
assert.equal(parent.atlasTree, 'c1ce83ff8d3858ea1b9c19baa5da8f9a6573d56e');
assert.equal(path.resolve(parent.website), path.resolve('F:/VisibleMedicine/staging/20261027-course-directory/website'));
const parentRows = new Map(parent.sourceRows.map(row => [row.path, row.sha256]));
assert.equal(parentRows.size, parent.sourceRows.length, 'Duplicate authenticated parent path');
for (const p of ['package.json', 'package-lock.json', 'LICENSES/THIRD_PARTY_NOTICES.md',
  'lib/atlas-delivery-access.ts', 'lib/clinical-review-access.ts',
  'lib/atlas-static-boundary.ts', 'lib/atlas-model-storage.ts']) {
  const expected = parentRows.get(p);
  assert.match(expected, /^[a-f0-9]{64}$/, `Missing parent licence/access source: ${p}`);
  assert.equal(hash(read(path.join(parent.website, p))), expected, `Parent licence/access changed: ${p}`);
  assert.equal(hash(read(path.join(website, p))), expected, `Website licence/access changed: ${p}`);
}
for (const [p, expected] of parentRows) {
  if (!/(?:license|licence|access|entitlement|permission)/i.test(p)) continue;
  assert.equal(hash(read(path.join(parent.website, p))), expected,
    `Parent licence/access receipt changed: ${p}`);
  assert.equal(hash(read(path.join(website, p))), expected,
    `Website licence/access source changed: ${p}`);
}
const expectedWebsiteCode = {
  'scripts/generate-anatomy-coverage.mjs': '5dee2a4cb7bc4e551244070b557559c2519c133f3b14e4ffe29652f0919dd764',
  'scripts/build-anatomy-coverage-index.mjs': 'd9166d2b6924cbfb6dfe2f688e1d53fc47ba3aa790be80604a18d4ff550d259a',
  'scripts/check-anatomy-coverage.mjs': 'f16810e24a41395d8e72e070ac4b8e027b075e7e78a1d58150cb1acbe165a06f',
  'lib/anatomy-coverage-view.ts': 'fd771a76245adbc2ac8b4b147a63899676a3485e2b02e2946452c2b510d9c7f3',
  'scripts/anatomy-coverage/root-producer.mjs': '0bfa81b430fd3070c5f6e4f54e60710c2162c24835fcf91f55115a8e861cabf8',
  'scripts/anatomy-coverage/nested-producer.mjs': '07c09a61897c616cc3839a4e7973f3016c34fcf66148bd268fe8f59c47acd0d8',
  'scripts/anatomy-coverage/independent-producer.mjs': 'cfd3301cda0d9733964e9a0cf4befab27e257d86d053e412f8178616be44de7c',
  'scripts/anatomy-coverage/reference-producer.mjs': 'b8289607394349646556ff9f82a6cbbe51893b91cc0a1d2dc41e45dfe4975be6',
  'scripts/anatomy-coverage/source-context.mjs': 'e0d87af042e7adcf67991b6dd4dde47606ee0fc399d1778486c15ad53377918e',
  'scripts/anatomy-coverage/build-root.mjs': 'abeb58e4c676c87fbf7cd28e9ff8cfa3cd706c6a2bc4c743104ec58d6f175973',
  'scripts/anatomy-coverage/build-nested.mjs': '79f490d5b51f987f478bf0a91f6c5f57ce613ed40e999dd770c2329d2904cc29',
  'scripts/anatomy-coverage/build-independent.mjs': '3aca680dc4d84fa47c2f864fd6dd74451dc7ee7a7200e44e2015be89c449f9fd',
  'scripts/verify-anatomy-coverage-view.mjs': 'c262a65a0102973089e266b818fb8d863dbae0bd976f39b10e406ccbf05c53b0',
};
for (const [p, expected] of Object.entries(expectedWebsiteCode))
  assert.equal(hash(read(path.join(website, p))), expected, `Coverage implementation changed: ${p}`);
for (const [p, expected] of Object.entries(expectedWebsiteCode))
  assert.equal(parentRows.get(p), expected, `Authenticated parent coverage code differs: ${p}`);
const oldIndexBytes = read(path.join(website, 'docs/anatomy-coverage/index.json'));
assert.equal(parentRows.get('docs/anatomy-coverage/index.json'), hash(oldIndexBytes),
  'Parent receipt does not authenticate old index');
assert.equal(hash(read(path.join(proposal, 'witness/index.json.raw'))), hash(oldIndexBytes),
  'Frozen old index witness differs');
assert.equal(hash(oldIndexBytes), '230f90d2cc7b11cd7b62221cce43a8a3a75d56d3e39c68d94fc062ff4fc4b567',
  'Coverage preimage changed');
const oldIndex = JSON.parse(oldIndexBytes);
assert.equal(oldIndex.sourceRevision, oldRevision);
const oldInputs = Object.entries(oldIndex.evidence.sourceInputs);
assert.equal(oldInputs.length, 171, 'Complete old input population');
const nativeReceipt = JSON.parse(read(nativeManifest));
assert.equal(path.resolve(nativeReceipt.atlas), path.resolve(atlas));
assert.equal(nativeReceipt.head, revision);
assert.equal(nativeReceipt.tree, tree);
assert.equal(nativeReceipt.parentHead, oldRevision);
const nativeRows = new Map(nativeReceipt.sourceRows.map(row => [row.path, row.sha256]));
assert.equal(nativeRows.size, nativeReceipt.sourceRows.length, 'Duplicate native source receipt path');
const changedInputs = [];
for (const [p, before] of oldInputs) {
  assert(!path.isAbsolute(p) && p.split('/').every(part => part && part !== '.' && part !== '..'),
    `Unsafe native coverage input: ${p}`);
  let target = atlas;
  for (const part of p.split('/')) {
    target = path.join(target, part);
    assert(!lstatSync(target).isSymbolicLink(), `Linked native coverage input: ${p}`);
  }
  const now = hash(read(target));
  assert.equal(nativeRows.get(p), now, `Native source receipt differs: ${p}`);
  const committed = hash(execFileSync('git', ['show', `${revision}:${p}`], {
    cwd: atlas, windowsHide: true, maxBuffer: 64e6,
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_OPTIONAL_LOCKS: '0' },
  }));
  assert.equal(committed, now, `Native committed bytes differ: ${p}`);
  if (now !== before) changedInputs.push({ path: p, before, now });
}
assert.deepEqual(changedInputs, [], 'All 171 coverage inputs remain byte-exact');
assert.equal(oldIndex.evidence.sourceInputs['package.json'],
  '61e15176f56bce6d6f783eff71417b48bb64db2173cf7becef33eefc98e2a0ce',
  'Unchanged package input differs from authenticated parent');

const generated = JSON.parse(read(path.join(coverage, 'candidate-manifest.json')));
assert.equal(generated.schema, 'vm-coverage-candidate-1');
assert.equal(generated.sourceRevision, revision);
assert.equal(generated.canonicalSnapshotsInstalled, false);
assert.equal(generated.clinicalApproval, false);
assert.equal(generated.patientRegistration, false);
const scopes = ['root', 'nested', 'independent', 'reference'];
assert.deepEqual(generated.sourceArtifacts.map(a => a.scope), scopes);
assert.deepEqual(generated.receipts.map(r => r.scope), scopes);
assert(generated.receipts.every(r => r.status === 0));
const producerPaths = ['scripts/generate-anatomy-coverage.mjs',
  'scripts/build-anatomy-coverage-index.mjs', ...[
    'source-context', 'build-root', 'build-nested', 'build-independent',
    'root-producer', 'nested-producer', 'independent-producer', 'reference-producer',
  ].map(n => `scripts/anatomy-coverage/${n}.mjs`)];
const producerInputs = producerPaths.map(p => ({ path: p, sha256: hash(read(path.join(website, p))) }));
assert.deepEqual(generated.producerInputs, producerInputs);
for (const receipt of generated.receipts) {
  assert.deepEqual(receipt.producerInputs, producerInputs);
  assert.equal(receipt.producerSha256, hash(read(path.join(website,
    `scripts/anatomy-coverage/${receipt.scope}-producer.mjs`))));
  assert.equal(receipt.logSha256, hash(read(path.join(coverage, `${receipt.scope}.log`))));
}
const artifacts = generated.sourceArtifacts.map(({ scope, path: target, sha256 }) => {
  assert.equal(target, `docs/anatomy-coverage/${scope}.json`);
  const bytes = read(path.join(coverage, `${scope}.json`));
  assert.equal(hash(bytes), sha256, `Changed generated artifact: ${scope}`);
  const data = JSON.parse(bytes);
  assert.equal(data.sourceRevision, revision, `Mixed source revision: ${scope}`);
  return { scope, path: target, sha256, bytes };
});
const { buildCoverageIndex } = await import(pathToFileURL(path.join(website,
  'scripts/build-anatomy-coverage-index.mjs')).href);
const rebuilt = buildCoverageIndex(artifacts);
const indexBytes = read(path.join(coverage, 'index.json'));
const index = JSON.parse(indexBytes);
assert.equal(index.sourceRevision, revision);
assert.equal(hash(indexBytes), generated.indexSha256);
assert.equal(indexBytes.toString(), JSON.stringify(rebuilt, null, 2) + '\n',
  'Index differs from stock complete four-scope builder');
assert.deepEqual(index.sourceArtifacts, generated.sourceArtifacts);
assert.equal(Object.keys(index.evidence.sourceInputs).length, generated.sourceInputs);
assert.equal(generated.sourceInputs, 171, 'Stock manifest must enumerate all old inputs');
assert.deepEqual(Object.keys(index.evidence.sourceInputs).sort(),
  Object.keys(oldIndex.evidence.sourceInputs).sort(), 'Coverage dependency set changed');
for (const [p, sha256] of Object.entries(index.evidence.sourceInputs)) {
  assert.equal(sha256, changedInputs.find(r=>r.path===p)?.now ?? oldIndex.evidence.sourceInputs[p],
    `Unexpected coverage source change: ${p}`);
}
for (const key of ['scopedCounts', 'documentedRootTargetGroups', 'assessment',
  'remainingScope', 'countingRules', 'referenceBacklog', 'independentWithheldSourceCatalogs'])
  assert.deepEqual(index[key], oldIndex[key], `Unexpected coverage semantic change: ${key}`);
for (const artifact of artifacts) {
  const before = JSON.parse(read(path.join(website, artifact.path)));
  const after = JSON.parse(artifact.bytes);
  const expected = structuredClone(before);
  expected.sourceRevision = revision;
  if (artifact.scope === 'reference') {
    expected.evidence.commitReadback.revision = revision;
  }
  assert.deepEqual(after, expected, `Unexpected ${artifact.scope} source-field change`);
}
for (const [p, expected] of Object.entries(index.evidence.sourceInputs)) {
  const parts = p.split('/');
  assert(parts.every(x => x && x !== '.' && x !== '..') && !path.isAbsolute(p));
  let current = atlas;
  for (const part of parts) {
    current = path.join(current, part);
    assert(!lstatSync(current).isSymbolicLink(), `Linked native input: ${p}`);
  }
  assert.equal(hash(read(current)), expected, `Working native input differs: ${p}`);
  assert.equal(hash(execFileSync('git', ['show', `${revision}:${p}`], {
    cwd: atlas, windowsHide: true, maxBuffer: 64e6,
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_OPTIONAL_LOCKS: '0' },
  })), expected, `Committed native input differs: ${p}`);
}
assert.equal(git('rev-parse', 'HEAD'), revision);
assert.equal(git('status', '--porcelain', '--untracked-files=all'), '');

const manifest = JSON.parse(read(path.join(website, 'atlas-review/manifest.json')));
assert.equal(manifest.revision, revision, 'Website import must already bind this native revision');
assert(Array.isArray(manifest.files));
const imported = new Map();
for (const row of manifest.files) {
  assert(typeof row.path === 'string' && !imported.has(row.path), 'Duplicate imported source path');
  imported.set(row.path, row);
}
let importedCount = 0, metadataOnly = 0;
const packageSha256 = index.evidence.sourceInputs['package.json'];
assert.match(packageSha256, /^[a-f0-9]{64}$/);
for (const [p, expected] of Object.entries(index.evidence.sourceInputs)) {
  const row = imported.get(p);
  if (row) { assert.equal(row.sourceSha256, expected, `Imported source mismatch: ${p}`); importedCount++; }
  else {
    assert((p === 'package.json' && expected === packageSha256) ||
      /^(?:LICENSES\/bodyparts3d-v4-index\/|docs\/|scripts\/|content\/(?:reference-male-inventory|source-inventory)\.json$)/.test(p),
    `Unrecognized metadata-only source: ${p}`);
    metadataOnly++;
  }
}
assert.equal(importedCount, 145, 'The unchanged Review projection expects 145 imported inputs');
assert.equal(metadataOnly, 26, 'The unchanged Review projection expects 26 metadata inputs');
const importedIdentity = Object.keys(index.evidence.sourceInputs).sort().flatMap(p => {
  const row = imported.get(p);
  return row ? [{ path: p, sourceSha256: row.sourceSha256,
    importedSha256: row.importedSha256 }] : [];
});
const snapshotDigest = hash(Buffer.from(JSON.stringify(index)));
const importedDigest = hash(Buffer.from(JSON.stringify(importedIdentity)));
const oldImported = new Map(JSON.parse(read(parent.website + '/atlas-review/manifest.json')).files.map(r=>[r.path,r]));
const expectedIdentity = Object.keys(oldIndex.evidence.sourceInputs).sort().flatMap(p=>{
  const row=oldImported.get(p);if(!row)return [];
  assert.equal(row.sourceSha256,oldIndex.evidence.sourceInputs[p], 'Authenticated old imported input: '+p);
  return [{path:p,sourceSha256:row.sourceSha256,importedSha256:row.importedSha256}];
});
assert.equal(expectedIdentity.length,145,'Authenticated imported coverage population changed');
assert.deepEqual(importedIdentity,expectedIdentity,'All imported coverage identities remain exact');
assert.equal(importedDigest,hash(Buffer.from(JSON.stringify(expectedIdentity))),
  'Imported identity differs from the authenticated 145-row projection');
assert.equal(importedDigest,'562dba863d14974e04a3a0776d740cfe8153a1d8c687416a90bc67fe4ee95774','Coverage import pin remains unchanged');
const oldView = read(path.join(website, 'lib/anatomy-coverage-view.ts')).toString();
assert.equal(oldView, read(path.join(proposal, 'witness/anatomy-coverage-view.ts.raw')).toString(),
  'Review projection differs from complete source-byte witness');
assert(oldView.includes(`coverageImportedRevision='562dba863d14974e04a3a0776d740cfe8153a1d8c687416a90bc67fe4ee95774'`),
  'Authenticated old Review refusal pin differs');
assert(oldView.includes(`coveragePackageSha256='${packageSha256}'`),
  'Unchanged package guard differs from authenticated parent');

const patchOnce = (source, oldText, newText) => {
  assert.notEqual(oldText, newText, 'Expected a changed seam');
  assert.equal(source.split(oldText).length, 2, `Missing or duplicate seam: ${oldText}`);
  const patched = source.replace(oldText, newText);
  assert.equal(patched.replace(newText, oldText), source, 'Non-invertible coverage seam');
  return patched;
};
const oldCheck = read(path.join(website, 'scripts/check-anatomy-coverage.mjs')).toString();
assert.equal(oldCheck, read(path.join(proposal, 'witness/check-anatomy-coverage.mjs.raw')).toString(),
  'Coverage validator differs from complete source-byte witness');
let newCheck = patchOnce(oldCheck, `coverageRevision='${oldRevision}'`,
  `coverageRevision='${revision}'`);
for (const artifact of artifacts) {
  const old = /(?<sha>[a-f0-9]{64})/.exec(
    oldCheck.match(new RegExp(`\\{scope:'${artifact.scope}',path:'docs/anatomy-coverage/${artifact.scope}\\.json',sha256:'[a-f0-9]{64}'\\}`))[0]);
  assert(old?.groups?.sha);
  newCheck = patchOnce(newCheck,
    `scope:'${artifact.scope}',path:'docs/anatomy-coverage/${artifact.scope}.json',sha256:'${old.groups.sha}'`,
    `scope:'${artifact.scope}',path:'docs/anatomy-coverage/${artifact.scope}.json',sha256:'${artifact.sha256}'`);
}
let newView = oldView;
for (const [name, value] of [
  ['COVERAGE_SOURCE_REVISION', revision],
  ['COVERAGE_SNAPSHOT_REVISION', snapshotDigest],
]) {
  const match = newView.match(new RegExp(`(?<![A-Za-z0-9_])${name}='([a-f0-9]+)'`));
  assert(match, `Missing view seam: ${name}`);
  newView = patchOnce(newView, `${name}='${match[1]}'`, `${name}='${value}'`);
}
assert.equal(newCheck.replace(`coverageRevision='${revision}'`, `coverageRevision='${oldRevision}'`)
  .replaceAll(/(scope:'(?:root|nested|independent|reference)',path:'docs\/anatomy-coverage\/(?:root|nested|independent|reference)\.json',sha256:')[a-f0-9]{64}(')/g,
    (_m, prefix, suffix) => {
      const oldLine = oldCheck.split('\n').find(line => line.includes(prefix));
      assert(oldLine);
      return prefix + oldLine.match(/sha256:'([a-f0-9]{64})'/)[1] + suffix;
    }), oldCheck, 'Checker guard logic changed');
let inverseView = newView;
for (const name of ['COVERAGE_SOURCE_REVISION', 'COVERAGE_SNAPSHOT_REVISION']) {
  const previous = oldView.match(new RegExp(`${name}='([a-f0-9]+)'`))[1];
  const current = inverseView.match(new RegExp(`${name}='([a-f0-9]+)'`))[1];
  inverseView = inverseView.replace(`${name}='${current}'`, `${name}='${previous}'`);
}
assert.equal(inverseView, oldView, 'Review projection guard logic changed');
mkdirSync(path.join(output, 'docs/anatomy-coverage'), { recursive: true });
mkdirSync(path.join(output, 'scripts'), { recursive: true });
mkdirSync(path.join(output, 'lib'), { recursive: true });
for (const artifact of artifacts)
  writeFileSync(path.join(output, artifact.path), artifact.bytes, { flag: 'wx' });
writeFileSync(path.join(output, 'docs/anatomy-coverage/index.json'), indexBytes, { flag: 'wx' });
writeFileSync(path.join(output, 'scripts/check-anatomy-coverage.mjs'), newCheck, { flag: 'wx' });
writeFileSync(path.join(output, 'scripts/build-anatomy-coverage-index.mjs'),
  read(path.join(website, 'scripts/build-anatomy-coverage-index.mjs')), { flag: 'wx' });
writeFileSync(path.join(output, 'lib/anatomy-coverage-view.ts'), newView, { flag: 'wx' });
const { checkCoverage } = await import(pathToFileURL(path.join(output,
  'scripts/check-anatomy-coverage.mjs')).href);
const validated = checkCoverage({ sourceRoot: atlas, websiteRoot: output });
assert.equal(JSON.stringify(validated, null, 2) + '\n', indexBytes.toString(),
  'Stock source validator differs from generated complete index');
const receipt = { schema: 'vm-quadriceps-coverage-seams/1', revision, tree,
  generatedManifestSha256: hash(read(path.join(coverage, 'candidate-manifest.json'))),
  nativeSourceInputs: Object.keys(index.evidence.sourceInputs).length,
  changedInputs, importedCount, metadataOnly, snapshotDigest, importedDigest, packageSha256,
  files: [
    ...artifacts.map(a => ({ path: a.path, sha256: a.sha256 })),
    { path: 'docs/anatomy-coverage/index.json', sha256: hash(indexBytes) },
    { path: 'scripts/check-anatomy-coverage.mjs', sha256: hash(Buffer.from(newCheck)) },
    { path: 'lib/anatomy-coverage-view.ts', sha256: hash(Buffer.from(newView)) },
  ],
  guardLogicUnchanged: true, installed: false, stockValidatorRun: true,
  clinicalApproval: false, anatomicalCompletenessProven: false,
};
writeFileSync(path.join(output, 'RECEIPT.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ revision, scopes: scopes.length, sourceInputs: receipt.nativeSourceInputs,
  importedCount, metadataOnly, prepared: output, installed: false }));

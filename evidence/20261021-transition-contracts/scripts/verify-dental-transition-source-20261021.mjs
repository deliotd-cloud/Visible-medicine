// Bounded source/renderer review only. Never executes the full resolver gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read, json, sha, runGit } from './source-only-backup-20261019.mjs';
const root = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const stage = 'F:/VisibleMedicine/staging/20261021-atlas-source-assembly';
const old = json('F:/VisibleMedicine/recovery/checkpoints/20261021-atlas-source-assembly-ready/checkpoint.json');
assert.equal(runGit(['-C', root, 'rev-parse', 'HEAD']).toString().trim(), old.source);
const newPaths = ['.gitattributes', 'scripts/verify-dental-mri-transition.mjs', 'content/body-renderer-revision.json'];
const alteredPaths = ['package.json', 'docs/DENTAL_MRI_EVIDENCE.md'];
for (const row of old.appliedPaths)
  if (!alteredPaths.includes(row.path)) assert.equal(sha(read(root + '/' + row.path)), row.finalSha256, row.path);
const previousPackage = json(stage + '/package-before-dental-transition.json.raw');
const currentPackage = json(root + '/package.json');
assert.equal(currentPackage.scripts['dental-mri-transition:test'], 'node scripts/verify-dental-mri-transition.mjs');
const inversePackage = structuredClone(currentPackage);
delete inversePackage.scripts['dental-mri-transition:test'];
assert.deepEqual(inversePackage, previousPackage, 'Only the separate heavy alias changes');
assert.equal(sha(read(stage + '/package-before-dental-transition.json.raw')),
  old.appliedPaths.find(row => row.path === 'package.json').finalSha256);
const attrBefore = read(stage + '/gitattributes-before-dental-transition.raw');
assert.deepEqual(attrBefore, runGit(['-C', root, 'show', old.source + ':.gitattributes']));
assert.equal(read(root + '/.gitattributes').toString().replace('content/dental-mri-pins.json -text\n', ''), attrBefore.toString());
const docBefore = read(stage + '/dental-evidence-before-transition-doc.md.raw');
assert.equal(sha(docBefore), old.appliedPaths.find(row => row.path === 'docs/DENTAL_MRI_EVIDENCE.md').finalSha256);
const docAfter = read(root + '/docs/DENTAL_MRI_EVIDENCE.md').toString();
assert(docAfter.startsWith(docBefore.toString()));
assert.equal(docAfter.slice(docBefore.toString().length), '\n`npm run dental-mri-transition:test` is the separate, memory-heavy full-resolver\n'
  + 'and Review-material gate for this transition and its actual introduction epoch.\n'
  + 'It must run in the normal sequential integration slot; the focused helper alias\n'
  + 'does not substitute for it. Adding or syntax-checking this gate is not a pass.\n'
  + 'Run the existing trusted display-pin and renderer generators before this gate;\n'
  + 'the real response parser must accept the regenerated current worksheet, not an\n'
  + 'unbound test payload. Imaging revisions remain unavailable (`null`): stale\n'
  + 'material and forged revision requests are rejected without implying an acquired\n'
  + 'series, a new approvable imaging revision or registration.\n');
const worker = read(stage + '/dental-transition-worker-original.mjs.raw').toString();
assert.equal(sha(Buffer.from(worker)), 'd55469badf6d98b539f8fd82e391d7ddf2df36e08da0036ca918faef8f153661');
const script = read(root + '/scripts/verify-dental-mri-transition.mjs').toString();
const additions = [
  "const liveCatalog = live.bodyDisplayCatalog(JSON.parse(liveBytes(catalogPath)));\n",
  "  const currentShown = liveCatalog.structures.filter(s => s.id === identity.id);\n  assert.deepEqual(currentShown, [identity], 'Current display selection changed identity');\n",
  "  assert.deepEqual(currentPacket.source.structure, s, 'Current Review source identity changed');\n",
  "  assert.deepEqual(await live.parseBodyReviewResponse(currentPacket, s.id), currentPacket,\n    'Current generated display pins do not match the new teaching');\n",
  "  assert.deepEqual(now.bodyApprovalProblems({ ...parsed, attested: true }, context, 'teaching'), [],\n    'No other approval problem may mask the missing-attestation refusal');\n",
];
let inverseScript = script;
for (const added of additions) {
  assert.equal(inverseScript.split(added).length, 2, 'Exactly one declared assertion insertion');
  inverseScript = inverseScript.replace(added, '');
}
inverseScript = inverseScript.replaceAll("live.bodyLesson(currentShown[0], 'mri')", "live.bodyLesson(shown[0], 'mri')")
  .replaceAll("live.bodyContent(currentShown[0], 'mri')", "live.bodyContent(shown[0], 'mri')")
  .replace("  assert.equal(previousContext.revisions.imaging, null);\n  const imaging = { ...decision, track: 'imaging', revisionHash: context.revisions.imaging,",
    "  const imaging = { ...decision, track: 'imaging', revisionHash: 'stale-imaging-revision',")
  .replace("  for (const stale of [\n    { ...imaging, materialHash: previousContext.materialHash },\n    { ...imaging, revisionHash: 'stale-imaging-revision' },\n  ]) {\n    assert.equal((await save(stale)).status, 409);\n    staleImaging++;\n  }",
    "  assert.equal((await save(imaging)).status, 409);\n  staleImaging++;")
  .replace('storageCalls], [140, 84, 56, 28, 56, 0]);', 'storageCalls], [140, 84, 28, 28, 56, 0]);');
assert.equal(inverseScript, worker, 'Whole worker body preserved outside declared strengthening');
const beforeRenderer = json(stage + '/renderer-before-dental-transition.json.raw');
assert.deepEqual(read(stage + '/renderer-before-dental-transition.json.raw'),
  runGit(['-C', root, 'show', old.source + ':content/body-renderer-revision.json']));
const renderer = json(root + '/content/body-renderer-revision.json');
const originalHashes = new Map(beforeRenderer.dependencies.map(row => [row.path, row.sha256]));
const rendererChanges = renderer.dependencies.filter(row => originalHashes.get(row.path) !== row.sha256);
assert.deepEqual(rendererChanges.map(row => row.path), [
  'app/body-content.ts', 'app/fitted-camera.tsx', 'app/regional-guided-learning.tsx',
  'content/dental-mri-pins.json', 'content/dental-mri.ts', 'lib/camera-keyboard.ts', 'lib/dental-mri.ts', 'package.json',
]);
assert.equal(renderer.dependencies.length, 1479);
assert.equal(beforeRenderer.dependencies.length, 1476);
assert.equal(renderer.sha256, sha(Buffer.from(JSON.stringify(renderer.dependencies))));
for (const row of renderer.dependencies)
  assert.equal(sha(Buffer.from(read(root + '/' + row.path).toString().replace(/\r\n/g, '\n'))), row.sha256, row.path);
assert.deepEqual(renderer.entrypoints, beforeRenderer.entrypoints);
assert.equal(renderer.schemaVersion, beforeRenderer.schemaVersion);
assert.equal(renderer.scope, beforeRenderer.scope);
const changedPaths = runGit(['-C', root, 'status', '--porcelain=v1', '-z', '--untracked-files=all'])
  .toString().split('\0').filter(Boolean).map(line => line.slice(3).replaceAll('\\', '/')).sort();
assert.deepEqual(changedPaths, [...old.appliedPaths.map(row => row.path), ...newPaths].sort());
assert.equal(changedPaths.length, 20);
const report = { at: new Date().toISOString(), source: old.source, sourcePaths: changedPaths.map(path => ({
  path, bytes: read(root + '/' + path).length, sha256: sha(read(root + '/' + path)),
})), workerOriginalSha256: sha(Buffer.from(worker)), finalGateSha256: sha(Buffer.from(script)),
  packageAliasOnly: true, wholeWorkerInverseVerified: true, renderer: { files: renderer.dependencies.length,
    sha256: renderer.sha256, exactChangedDependencies: rendererChanges },
  runtimeGateExecuted: false, currentGeneratedDisplayPinsRefreshed: false,
  fullBodyTransitionPass: false, sourceCommitted: false, canonicalInstalled: false,
  clinicalApproval: false, spatialRegistration: false,
  limits: 'Static source/inverse/1479renderer-input verification only. Existing trusted display-pin generation, full actual baseline/current/introduction-topic/Review/security gate, stock exports/build/Website/browser acceptance remain. Imaging revision remains null; no real review storage or acquisition is connected.' };
fs.writeFileSync(stage + '/DENTAL_TRANSITION_STATIC.json', JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ paths: changedPaths.length, rendererFiles: renderer.dependencies.length,
  wholeWorkerInverse: true, finalGateSha256: report.finalGateSha256, runtimePass: false }));

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.dirname(import.meta.filename);
const read = p => fs.readFileSync(p);
const json = p => JSON.parse(read(p));
const sha = b => createHash('sha256').update(b).digest('hex');
const prep = json(root + '/PREPARATION.json');
const git = args => execFileSync('git', args, { encoding: 'utf8', windowsHide: true }).trim();
assert.equal(git(['-C', prep.atlas, 'rev-parse', 'HEAD']), prep.source);
assert.equal(git(['-C', prep.atlas, 'status', '--porcelain']), '');
assert.equal(git(['-C', prep.website, 'rev-parse', 'HEAD']), 'b953ff3f5f1891599cb6e91cb91311d9d6006270');
for (const r of prep.reviewedProofs) assert.equal(sha(read(r.checkpoint)), r.sha256);
const mainEdited = new Set(['package.json', 'LICENSES/THIRD_PARTY_NOTICES.md', 'docs/DENTAL_MRI_EVIDENCE.md']);
const paths = prep.paths.map(r => {
  const file = root + '/' + r.lane + '/' + r.path;
  const base = (r.lane === 'atlas' ? prep.atlas : prep.website) + '/' + r.path;
  assert.equal(fs.existsSync(base) ? sha(read(base)) : null, r.beforeSha256, 'Before identity ' + r.lane + '/' + r.path);
  if (r.beforeSha256) assert.equal(sha(read(root + '/originals/' + r.lane + '/' + r.path + '.raw')), r.beforeSha256);
  if (r.lane !== 'atlas' || !mainEdited.has(r.path)) assert.equal(sha(read(file)), r.proposedSha256);
  return { ...r, finalSha256: sha(read(file)), bytes: read(file).length };
});
assert.equal(paths.length, 28);
assert.equal(new Set(paths.map(r => r.lane + '/' + r.path)).size, 28);
assert.equal(paths.filter(r => r.lane === 'atlas').length, 15);
assert.equal(paths.filter(r => r.lane === 'website-ui').length, 11);
assert.equal(paths.filter(r => r.lane === 'website-485-assurance').length, 2);
for (const excluded of prep.excludedPrototypeTests) assert(!paths.some(r => r.path === excluded));
const oldPackage = json(root + '/originals/atlas/package.json.raw');
const pkg = json(root + '/atlas/package.json');
const inverse = structuredClone(pkg);
assert.equal(pkg.scripts['dental-mri:test'], 'node --test scripts/test-dental-mri-native.mjs');
assert.equal(pkg.scripts['camera-keyboard:test'], oldPackage.scripts['camera-keyboard:test'].replace('scripts/test-camera-keyboard.mjs &&', 'scripts/test-camera-keyboard.mjs scripts/test-camera-keyboard-zoom.mjs &&'));
delete inverse.scripts['dental-mri:test'];
inverse.scripts['camera-keyboard:test'] = oldPackage.scripts['camera-keyboard:test'];
assert.deepEqual(inverse, oldPackage, 'Every other package field/dependency/script preserved');
const originalBody = read(root + '/originals/atlas/app/body-content.ts.raw').toString();
const body = read(root + '/atlas/app/body-content.ts').toString();
assert.equal(body.replace("import {dentalMriLesson} from '../lib/dental-mri';\n", '').replace('  const dentalMri=dentalMriLesson(s,tab);\n  if(dentalMri)return dentalMri;\n', ''), originalBody, 'Whole body dispatcher inverse');
const oldNotices = read(root + '/originals/atlas/LICENSES/THIRD_PARTY_NOTICES.md.raw');
const notices = read(root + '/atlas/LICENSES/THIRD_PARTY_NOTICES.md');
const marker = Buffer.from('## Tongue and soft-palate quick checks');
assert.deepEqual(notices.subarray(notices.indexOf(marker)), oldNotices.subarray(oldNotices.indexOf(marker)), 'Full previous notice body preserved');
assert(notices.toString().includes('No paper text, abstract, figure, table, patient image, mesh or research dataset'));
const context = root + '/native-dental-context';
const nativePrep = json(context + '/PREPARATION.json');
for (const r of nativePrep.copiedInputs) assert.equal(sha(read(context + '/' + r.path)), r.sha256);
for (const p of ['lib/dental-mri.ts', 'content/dental-mri.ts', 'content/dental-mri-pins.json', 'scripts/test-dental-mri-native.mjs', 'package.json']) assert.deepEqual(read(context + '/' + p), read(root + '/atlas/' + p));
const result = json(context + '/DENTAL_NATIVE_ALIAS.json');
assert.equal(result.code, 0); assert.equal(result.signal, null);
assert.equal(sha(read(result.log)), result.logSha256);
for (const end of ['tests 4', 'pass 4', 'fail 0', 'skipped 0']) assert(result.footer.some(l => l.endsWith(end)));
const manifest = {
  schema: 'visible-medicine.combined-staged-batch-seal/1', at: new Date().toISOString(),
  source: prep.source, preparationSha256: sha(read(root + '/PREPARATION.json')), paths,
  separateLanes: ['website-485-assurance', 'atlas', 'website-ui'],
  nativeGate: { cases: 4, actualPackageAliasPass: true, logSha256: result.logSha256, contextInputs: nativePrep.copiedInputs.length, contextBytes: nativePrep.copiedInputs.reduce((n, r) => n + r.bytes, 0) },
  bodyDispatcherInverse: true, packageOtherFieldsPreserved: true, earlierNoticesPreserved: true,
  sourceCommitted: false, fullResolverTransitionPass: false, newHipWrapperEndToEndPass: false,
  stockExportsGenerated: false, websiteImported: false, canonicalInstalled: false,
  newIntegratedBrowserAcceptance: false, fullSuitePass: false, clinicalApproval: false, spatialRegistration: false,
};
fs.writeFileSync(root + '/BATCH_MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ manifest: root + '/BATCH_MANIFEST.json', sha256: sha(read(root + '/BATCH_MANIFEST.json')), paths: paths.length, nativeCases: 4, installed: false }));

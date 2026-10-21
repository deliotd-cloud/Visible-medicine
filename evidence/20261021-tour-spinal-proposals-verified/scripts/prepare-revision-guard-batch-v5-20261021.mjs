import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read, json, sha } from './source-only-backup-20261019.mjs';
const oldRoot = 'F:/VisibleMedicine/staging/20261021-revision-guard-batch-v4';
const before = json(oldRoot + '/PREPARATION.json');
const tourRoot = 'F:/VisibleMedicine/staging/20261021-tour-epoch-native-proof';
const spinalRoot = 'F:/VisibleMedicine/staging/20261021-spinal-dental-native-proof';
const tours = json(tourRoot + '/PREPARATION.json'), spinal = json(spinalRoot + '/PREPARATION.json');
assert(spinal.originalGuardBodiesUnchanged && spinal.existingFrozenFixtureAttributesSufficient);
assert.equal(spinal.attributeChangeRequired, false);
const changes = [...before.changes,
  ...tours.contracts.map(row => ({ ...row, bytes: read(row.from).length })), ...spinal.changes];
assert.equal(new Set(changes.map(row => row.path)).size, 23);
assert.equal(changes.filter(row => !row.beforeSha256).length, 10);
assert(!changes.some(row => row.path === '.gitattributes'), 'No redundant attribute change');
for (const row of changes) {
  assert.equal(sha(read(row.from)), row.sha256, row.path);
  if (row.beforeSha256) assert.equal(sha(read(before.site + '/' + row.path)), row.beforeSha256, row.path);
  else assert(!fs.existsSync(before.site + '/' + row.path), row.path);
}
const receipts = [...before.receipts];
for (const [root, label, pass] of [[tourRoot, 'TOUR_CURRENT_HISTORY', 17], [spinalRoot, 'SPINAL_HISTORY_INVERSES', 3]]) {
  const file = root + '/' + label + '.json', receipt = json(file);
  assert.equal(receipt.code, 0); assert.equal(sha(read(receipt.log)), receipt.logSha256);
  for (const value of ['tests ' + pass, 'pass ' + pass, 'fail 0', 'cancelled 0', 'skipped 0', 'todo 0'])
    assert(receipt.footer.includes('ℹ ' + value));
  receipts.push({ file, sha256: sha(read(file)), label, footer: receipt.footer, logSha256: receipt.logSha256 });
}
const frozen = json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
assert.equal(frozen.length, 5107);
for (const row of frozen) assert.equal(sha(read(before.site + '/' + row.path)), row.sha256, row.path);
const bound = json(before.site + '/atlas-review/integration-inputs.json');
assert.equal(bound.sha256, before.review); assert.equal(bound.inputs.length, 1710);
for (const row of bound.inputs) assert.equal(sha(read(before.site + '/' + row.path)), row.sha256, row.path);
const stage = 'F:/VisibleMedicine/staging/20261021-revision-guard-batch-v5';
assert(!fs.existsSync(stage)); fs.mkdirSync(stage);
const prep = { ...before, at: new Date().toISOString(), stage, changes, receipts, supersedes: oldRoot,
  proposedSourceInputs: frozen.length + changes.filter(row => !row.beforeSha256).length,
  admissionReady: false,
  requiredVerification: [{ label: 'SPINAL_CURRENT_DENTAL', status: 'pending', receipt: null,
    reason: 'The exact current spinal teaching theorem across9936topics/1104worksheets, source and emitted delivery must execute once after the genuine full-suite terminal. Three pure preservation guards are not that proof.' },
  { label: 'COMPLETE_NATIVE_FAILURE_TRIAGE', status: 'pending', receipt: null,
    reason: 'Classify every failure from the genuine terminal receipt, not the current16-failure prefix.' }],
  scope: 'Twenty-three test-only paths, thirteen existing and ten new, projected5117inputs. Thirty-eight outer native registrations across eight successful separate runs plus the coverage wrapper\'s four historical children; not a whole-suite result. Three tour proofs preserve full old source via exact186-byte hint inverse. Three spinal guards preserve their complete original verifier bodies and six historical byte inverses; the costly current dental/spinal teaching theorem is still pending. No application, geometry, access or clinical data change. Exclude exploratory .gitattributes copy; frozen current raw-fixture policy suffices. Admission explicitly blocked pending full-suite terminal, complete triage and current theorem proof.' };
fs.writeFileSync(stage + '/PREPARATION.json', JSON.stringify(prep, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ stage, paths: changes.length, proposedInputs: prep.proposedSourceInputs,
  nativeBoundedRegistrations: 38, nativeRuns: 8, admissionReady: false, candidateChanged: false }));

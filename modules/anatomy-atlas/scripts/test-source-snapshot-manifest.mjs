import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSourceSnapshot, validateSnapshotPath, SnapshotValidationError } from './source-snapshot-manifest.mjs';

const sha = char => char.repeat(64);
const proof = id => ({ id, revision: 'reviewed-revision-1', sha256: sha('f') });
const base = () => {
  const proposed = [
    { path: 'package.json', sha256: sha('a'), bytes: 21, role: 'code' },
    { path: 'app/page.tsx', sha256: sha('b'), bytes: 72, role: 'code' },
    { path: 'public/models/admitted.glb', sha256: sha('c'), bytes: 103, role: 'model' },
    { path: 'LICENSE', sha256: sha('d'), bytes: 54, role: 'notice' },
  ];
  return {
    stage: { sourceType: 'canonical-atlas-working-tree', sourceCommit: '9b2003d75b9c27861befeaf253ce7d52cce497a6',
      filesystemEvidence: 'lstat+sha256', gitHistoryIncluded: false, isAdaptedExport: false },
    proposed,
    observed: proposed.map(({ path, sha256, bytes }) => ({ path, sha256, bytes, entryType: 'file', isSymbolicLink: false })),
    admissions: {
      code: proposed.filter(x => x.role === 'code').map(x => ({ ...x, admitted: true, proof: proof('reviewed-code-source') })),
      model: [{ ...proposed[2], admitted: true, proof: proof('separate-model-admission'), rights: {
        sourceId: 'source-record', licenseId: 'model-license-record', evidenceId: 'independent-rights-review',
        evidenceRevision: 'rights-review-revision-1', evidenceSha256: sha('e'), noticePath: 'LICENSE',
        commercialUse: true, redistribution: true, derivatives: true, independentlyReviewed: true } }],
      notice: [{ ...proposed[3], admitted: true, proof: proof('notice-review') }],
    },
    required: { code: ['package.json', 'app/page.tsx'], model: ['public/models/admitted.glb'], notice: ['LICENSE'] },
  };
};
const clone = value => structuredClone(value);
const addRecoveryGuard = x => {
  const row = { path: 'scripts/exclude-source-recovery.mjs', sha256: sha('9'), bytes: 31, role: 'code' };
  x.proposed.push(row);
  x.observed.push({ path: row.path, sha256: row.sha256, bytes: row.bytes, entryType: 'file', isSymbolicLink: false });
  x.admissions.code.push({ ...row, admitted: true, proof: proof('inspected-default-build-guard') });
  x.required.code.push(row.path);
};
const refusal = (name, change, code) => test(name, () => {
  const input = base();
  change(input);
  assert.throws(() => validateSourceSnapshot(input), error =>
    error instanceof SnapshotValidationError && error.code === code);
});

test('synthetic complete original-stage inventory with independent model rights passes', () => {
  assert.deepEqual(validateSourceSnapshot(base()), {
    sourceCommit: '9b2003d75b9c27861befeaf253ce7d52cce497a6',
    consistencyOnly: true, fileCount: 4, codeDeclarations: 2, modelDeclarations: 1, noticeDeclarations: 1,
  });
});
test('synthetic full inventory may include exact inspected source-ZIP preservation guard', () => {
  const input = base();
  addRecoveryGuard(input);
  assert.deepEqual(validateSourceSnapshot(input), {
    sourceCommit: input.stage.sourceCommit, consistencyOnly: true, fileCount: 5,
    codeDeclarations: 3, modelDeclarations: 1, noticeDeclarations: 1,
  });
});
test('consistency check leaves deeply frozen records unchanged and returns a frozen declaration summary', () => {
  const input = base(), before = JSON.stringify(input);
  const freeze = value => {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
  };
  freeze(input);
  const result = validateSourceSnapshot(input);
  assert(Object.isFrozen(result));
  assert.equal(result.consistencyOnly, true);
  assert.equal(JSON.stringify(input), before);
});
for (const path of ['app/conduit.ts', 'app/console.ts', 'app/com10.ts', 'app/lpt10.ts', 'config/environment.json'])
  test(`valid Windows look-alike ${path}`, () => assert.equal(validateSnapshotPath(path), path));

refusal('missing observed file', x => x.observed.pop(), 'INVENTORY_SET');
refusal('unlisted observed file', x => x.observed.push({ path: 'extra.json', sha256: sha('e'), bytes: 1, entryType: 'file', isSymbolicLink: false }), 'INVENTORY_SET');
refusal('duplicate proposed path', x => x.proposed.push(clone(x.proposed[0])), 'DUPLICATE_PATH');
refusal('case-colliding proposed path', x => x.proposed.push({ ...x.proposed[0], path: 'PACKAGE.json' }), 'CASE_COLLISION');
for (const path of ['/app/page.tsx', 'C:/app/page.tsx', 'app\\page.tsx', 'app/../page.tsx', 'app//page.tsx'])
  refusal(`unsafe path ${path}`, x => { x.proposed[1].path = path; }, 'UNSAFE_PATH');
for (const path of ['CON', 'app/CON.txt', 'app/prn.json', 'app/AUX.md', 'app/NUL',
  'app/COM1.ts', 'app/com9.txt', 'app/LPT1.json', 'app/lpt9.md',
  'app/name.', 'app/name.json ', 'app/ name.json', 'app/name .json',
  'app/bad\nname.json', 'app/bad\u007fname.json'])
  refusal(`Windows-unsafe alias ${JSON.stringify(path)}`, x => { x.proposed[1].path = path; }, 'UNSAFE_PATH');
for (const path of ['app/.env', 'app/.env.production', '.dev.vars', 'config/.dev.vars.local',
  'config/private-key.txt', 'config/secrets.json', 'certs/server.pem', 'certs/server.key',
  'id_rsa', '.npmrc'])
  refusal(`predictable secret path ${path}`, x => { x.proposed[1].path = path; }, 'FORBIDDEN_PATH');
for (const path of ['.git/config.json', '.local/key.json', 'private/data.json', 'content/candidate-mesh.json', 'public/models/recovery-source.json'])
  refusal(`forbidden path ${path}`, x => { x.proposed[1].path = path; }, 'FORBIDDEN_PATH');
for (const path of ['public/original-source.zip', 'private-scan.dcm', 'head.nii.gz', 'model.mrb'])
  refusal(`forbidden format ${path}`, x => { x.proposed[1].path = path; }, 'FORBIDDEN_FORMAT');
refusal('symlink observed entry', x => { x.observed[1].isSymbolicLink = true; }, 'NONREGULAR_FILE');
refusal('directory observed entry', x => { x.observed[1].entryType = 'directory'; }, 'NONREGULAR_FILE');
refusal('sha256 mismatch', x => { x.observed[1].sha256 = sha('e'); }, 'IDENTITY_MISMATCH');
refusal('byte mismatch', x => { x.observed[1].bytes++; }, 'IDENTITY_MISMATCH');
refusal('malformed hash', x => { x.proposed[0].sha256 = 'a'; }, 'INVALID_HASH');
refusal('unsafe byte count', x => { x.observed[0].bytes = -1; }, 'INVALID_BYTES');
refusal('binary mislabeled as code', x => { x.proposed[2].role = 'code'; }, 'ROLE_FORMAT');
for (const path of ['scripts/exclude-source-recovery-copy.mjs', 'other/exclude-source-recovery.mjs',
  'scripts/EXCLUDE-source-recovery.mjs', 'scripts/exclude-source-recovery.zip'])
  refusal(`recovery-guard look-alike stays refused: ${path}`, x => { x.proposed[1].path = path; }, 'FORBIDDEN_PATH');
refusal('exact recovery guard with wrong role', x => { addRecoveryGuard(x); x.proposed.at(-1).role = 'notice'; }, 'ROLE_FORMAT');
refusal('exact recovery guard still needs code admission', x => {
  addRecoveryGuard(x); x.admissions.code = x.admissions.code.filter(a => a.path !== 'scripts/exclude-source-recovery.mjs');
}, 'MISSING_ADMISSION');
refusal('exact recovery guard still needs matching hash', x => {
  addRecoveryGuard(x); x.observed.at(-1).sha256 = sha('8');
}, 'IDENTITY_MISMATCH');
refusal('binary lacks admission', x => { x.admissions.model = []; }, 'MISSING_ADMISSION');
refusal('binary has only inherited code/MIT licence claim', x => { x.admissions.model[0].rights = { licenseId: 'MIT' }; }, 'SCHEMA');
refusal('admitted boolean alone has no bound provenance', x => { delete x.admissions.model[0].proof; }, 'SCHEMA');
refusal('admission proof must have a hash', x => { x.admissions.model[0].proof.sha256 = ''; }, 'PROVENANCE_HASH');
refusal('rights declaration must have an evidence revision', x => { delete x.admissions.model[0].rights.evidenceRevision; }, 'SCHEMA');
refusal('rights declaration must have an evidence hash', x => { delete x.admissions.model[0].rights.evidenceSha256; }, 'PROVENANCE_HASH');
refusal('binary lacks independent commercial-use grant', x => { x.admissions.model[0].rights.commercialUse = false; }, 'MODEL_RIGHTS');
refusal('binary lacks redistribution grant', x => { x.admissions.model[0].rights.redistribution = false; }, 'MODEL_RIGHTS');
refusal('binary lacks derivatives grant', x => { x.admissions.model[0].rights.derivatives = false; }, 'MODEL_RIGHTS');
refusal('binary lacks independent rights review', x => { x.admissions.model[0].rights.independentlyReviewed = false; }, 'MODEL_RIGHTS');
refusal('model licence notice is not admitted', x => { x.admissions.model[0].rights.noticePath = 'LICENSES/absent.md'; }, 'MISSING_MODEL_NOTICE');
refusal('unadmitted model', x => { x.admissions.model[0].admitted = false; }, 'NOT_ADMITTED');
refusal('model identity differs from source inventory', x => { x.admissions.model[0].sha256 = sha('e'); }, 'IDENTITY_MISMATCH');
refusal('missing mandatory code', x => { x.required.code = []; }, 'MISSING_MANDATORY_CLASS');
refusal('missing mandatory model', x => { x.required.model = []; }, 'MISSING_MANDATORY_CLASS');
refusal('missing mandatory licence notice', x => { x.required.notice = []; }, 'MISSING_MANDATORY_CLASS');
refusal('required code omitted from proposal', x => { x.required.code.push('lib/required.ts'); }, 'MISSING_MANDATORY_PATH');
refusal('notice admission missing', x => { x.admissions.notice = []; }, 'MISSING_ADMISSION');
refusal('adapted website export is not an original stage', x => { x.stage.isAdaptedExport = true; }, 'ORIGINAL_STAGE');
refusal('Git ancestry included', x => { x.stage.gitHistoryIncluded = true; }, 'ORIGINAL_STAGE');
refusal('unverified capture method', x => { x.stage.filesystemEvidence = 'export-manifest'; }, 'ORIGINAL_STAGE');

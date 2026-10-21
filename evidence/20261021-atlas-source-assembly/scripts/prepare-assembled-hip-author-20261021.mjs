import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { json, read, sha, runGit } from './source-only-backup-20261019.mjs';
const root = 'F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const author = 'F:/VisibleMedicine/staging/20261021-atlas-combined-hip-author';
const evidence = 'F:/VisibleMedicine/staging/20261021-atlas-source-assembly';
const original = 'F:/VisibleMedicine/staging/20261020-inbox-material-source';
const commit = '6d7ff5c403bdaaf79a10a221a3f72e397d9b9b42';
assert(!fs.existsSync(author) && !fs.existsSync(evidence + '/HIP_AUTHOR.json'));
assert(json(evidence + '/DEPENDENCIES.json').originalUnchanged);
const originalTopology = runGit(['-C', original, 'worktree', 'list', '--porcelain', '-z']);
const originalRefs = runGit(['-C', original, 'show-ref']);
const before = runGit(['-C', root, 'status', '--porcelain=v1', '-z', '--untracked-files=all']);
execFileSync('git', ['-C', root, '-c', 'core.autocrlf=false', 'worktree', 'add', '--detach', author, commit], {
  windowsHide: true, maxBuffer: 8e6, stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1' },
});
fs.symlinkSync(root + '/node_modules', author + '/node_modules', 'junction');
assert.equal(runGit(['-C', author, 'rev-parse', 'HEAD']).toString().trim(), commit);
assert.equal(runGit(['-C', author, 'rev-parse', 'HEAD^{tree}']).toString().trim(), '213d2736c9f70c506ab64382398849690e01777e');
assert.equal(runGit(['-C', author, 'status', '--porcelain']).toString().trim(), '');
assert.equal(sha(read(author + '/scripts/test-hip-quick-check-history.mjs')), '9a4bb88915f40c80ca77b6b40a665813c7aa56adfe5b419d2f5f88c1a048dcd5');
assert.equal(fs.realpathSync(path.resolve(author, runGit(['-C', author, 'rev-parse', '--git-common-dir']).toString().trim())), fs.realpathSync(root + '/.git'));
assert.deepEqual(runGit(['-C', root, 'status', '--porcelain=v1', '-z', '--untracked-files=all']), before);
assert.deepEqual(runGit(['-C', original, 'worktree', 'list', '--porcelain', '-z']), originalTopology);
assert.deepEqual(runGit(['-C', original, 'show-ref']), originalRefs);
fs.writeFileSync(evidence + '/HIP_AUTHOR.json', JSON.stringify({ at: new Date().toISOString(), root: author, commit,
  tree: '213d2736c9f70c506ab64382398849690e01777e', scriptSha256: '9a4bb88915f40c80ca77b6b40a665813c7aa56adfe5b419d2f5f88c1a048dcd5',
  sameIndependentCloneRepository: true, authorClean: true, dependencies: fs.realpathSync(author + '/node_modules'),
  originalFrozenSourceRefsAndWorktreesUnchanged: true, sourceApplicationUnchanged: true,
  wholeWrapperExecuted: false, originalWitnessReexecuted: false, fullSuitePass: false,
  limits: 'Local same-clone historical test context, not historical test execution or source admission. No test script reconstructed, compiler bypass, package install, remote fetch or source data edit. Original485hip gate still required separately after the running Website terminal.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ evidence: evidence + '/HIP_AUTHOR.json', sha256: sha(read(evidence + '/HIP_AUTHOR.json')), authorClean: true, wholeWrapperExecuted: false }));

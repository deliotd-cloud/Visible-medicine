import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Immutable Website epochs read by the current history/transition test families.
// This is a bounded context check, not a claim that every historical blob is present.
export const requiredWebsiteRevisions = Object.freeze([
  'b953ff3f5f1891599cb6e91cb91311d9d6006270', // canonical Website baseline / HEAD
  'f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6', // current-history waves 2-4
  'c285a3871181565c35535ed65eb48d23fc13acd8', // current-history waves 2-3
  '047d488a84ae0f1b24d4da47f4b8ce42969f00b3', // current-history wave 4
  '6302b12afe5e915fbec2cae855fef5cfe790490b', // current-history wave 4
  '7c46160af0c7901b9eda48e9d770d6b86a5a16de', // Studio rate-limit route baseline
  '306a304ac43a9745ac89e618e351e051697eaac3', // glottic import wrapper epoch
]);

function localGit(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    windowsHide: true, maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function expectedIndexedModelPaths(inventory) {
  if (inventory?.schemaVersion !== 1 || !Array.isArray(inventory.models))
    throw new Error('Website test history preflight: invalid lib/atlas-model-inventory.json schema');
  const paths = new Set();
  for (const model of inventory.models) {
    if (!Array.isArray(model.paths) || !model.paths.length)
      throw new Error('Website test history preflight: model has no paths');
    for (const urlPath of model.paths) {
      if (typeof urlPath !== 'string' || !/^\/atlas-runtime\/[A-Za-z0-9/_-]+\.glb$/.test(urlPath) || urlPath.includes('//') || urlPath.includes('/../'))
        throw new Error(`Website test history preflight: invalid model path ${JSON.stringify(urlPath)}`);
      paths.add(`public${urlPath}`);
    }
  }
  if (!paths.size) throw new Error('Website test history preflight: empty model inventory');
  return [...paths].sort();
}

export function assertWebsiteTestHistory(root, { git = localGit, revisions = requiredWebsiteRevisions } = {}) {
  const inventory = JSON.parse(readFileSync(join(root, 'lib', 'atlas-model-inventory.json'), 'utf8'));
  const expected = expectedIndexedModelPaths(inventory);
  const missingRevisions = [];
  for (const revision of revisions) {
    if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error(`Website test history preflight: invalid revision ${revision}`);
    try { git(root, ['cat-file', '-e', `${revision}^{commit}`]); }
    catch { missingRevisions.push(revision); }
  }
  if (missingRevisions.length) throw new Error(
    `Website test history preflight: missing immutable Website commit(s): ${missingRevisions.join(', ')}. ` +
    'Restore the local Website test Git object context from the trusted source, then rerun; this runner does not fetch or repair history.');

  let staged;
  try { staged = git(root, ['ls-files', '--stage', '-z', '--', 'public/atlas-runtime']).toString('utf8'); }
  catch (error) { throw new Error(`Website test history preflight: cannot read local Git index (${error.message}). Restore the isolated test index locally before rerunning.`); }
  const indexed = new Set();
  for (const row of staged.split('\0')) {
    if (!row) continue;
    const match = /^[0-7]{6} [a-f0-9]{40,64} 0\t(.+)$/.exec(row);
    if (match) indexed.add(match[1]);
  }
  const missingPaths = expected.filter(path => !indexed.has(path));
  if (missingPaths.length) throw new Error(
    `Website test history preflight: ${missingPaths.length}/${expected.length} inventoried model path(s) absent from the local Git index; first: ${missingPaths.slice(0, 4).join(', ')}. ` +
    'Initialize the isolated test index from its trusted HEAD locally (git read-tree HEAD) before rerunning; this runner never changes the index or worktree.');
  return { checkedRevisions: revisions.length, indexedModelPaths: expected.length };
}

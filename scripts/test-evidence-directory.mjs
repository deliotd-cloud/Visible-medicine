import {existsSync, lstatSync, mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {dirname, isAbsolute, join, parse, relative, resolve, sep} from 'node:path';

function regularDirectoryChain(directory) {
  const parent = dirname(directory);
  if (parent !== directory) regularDirectoryChain(parent);
  if (!existsSync(directory)) mkdirSync(directory);
  const stat = lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Evidence directory must be a regular local directory: ' + directory);
}

/** Fresh local evidence only; never copies sources, moves data or overwrites a run. */
export function createTestEvidenceDirectory(project, group, {evidenceRoot, label} = {}) {
  const site = resolve(project);
  if (!/^[a-z][a-z0-9-]*$/.test(group) || label !== undefined && !/^[a-z][a-z0-9-]*$/.test(label))
    throw new Error('Expected a simple evidence group and optional role label');
  let root = join(site, '.local');
  if (evidenceRoot !== undefined) {
    if (typeof evidenceRoot !== 'string' || !isAbsolute(evidenceRoot) || /^[/\\]{2}/.test(evidenceRoot) ||
        resolve(evidenceRoot) !== evidenceRoot.replace(/[\\/]+$/, '').split(/[\\/]/).join(sep))
      throw new Error('VM_TEST_EVIDENCE_ROOT must be a fully qualified, normalized local directory');
    root = resolve(evidenceRoot);
    if (root === parse(root).root) throw new Error('Use a dedicated evidence directory, not a drive root');
    const within = relative(site, root);
    if (within === '' || !within.startsWith('..' + sep) && within !== '..' && !isAbsolute(within)) {
      if (within !== '.local' && !within.startsWith('.local' + sep))
        throw new Error('Evidence inside the project must stay under .local');
    }
  }
  regularDirectoryChain(root);
  const runs = join(root, group);
  regularDirectoryChain(runs);
  const output = join(runs, new Date().toISOString().replace(/[:.]/g, '-') + (label ? '-' + label : '') + '-' + randomUUID());
  mkdirSync(output); // Exclusive creation. Existing evidence is never cleared or reused.
  return output;
}

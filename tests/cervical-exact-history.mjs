// Fixed, Git-only exports absent from the broad historical profiles.
// No source override, working-tree fallback, or synthetic historical module.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve, relative, dirname, extname, isAbsolute } from 'node:path';
import { build } from '../../atlas/scripts/workspace-test-build.mjs';
import { createGitObjectReader } from '../../atlas/scripts/git-object-reader.mjs';

const atlas = 'F:/VisibleMedicine/atlas';
const entries = {
  specimen: "export {specimenReviewRows,specimenReviewMaterial} from './lib/specimen-review-material';",
  spine: "export {spineImagingLesson} from './lib/spine-imaging';",
};
function gitTree(commit) {
  const output = execFileSync('git', ['--no-replace-objects', 'ls-tree', '-r', '-z', '--full-tree', commit],
    { cwd: atlas, encoding: 'utf8', windowsHide: true, maxBuffer: 32e6 });
  const paths = new Map();
  for (const row of output.split('\0')) {
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(row);
    if (match) paths.set(match[3], match[2]);
  }
  return paths;
}
export async function exactCervicalHistory(commit, profile) {
  assert(/^[a-f0-9]{40}$/.test(commit));
  assert(Object.hasOwn(entries, profile));
  const actual = execFileSync('git', ['--no-replace-objects', 'rev-parse', `${commit}^{commit}`],
    { cwd: atlas, encoding: 'utf8', windowsHide: true }).trim();
  assert.equal(actual, commit);
  const paths = gitTree(commit);
  const expected = profile === 'specimen' ? 'lib/specimen-review-material.ts' : 'lib/spine-imaging.ts';
  assert(paths.has(expected), `${profile}: historical entry absent`);
  const reader = createGitObjectReader({ cwd: atlas });
  let compiled;
  try {
    compiled = await build({ stdin: { contents: entries[profile], resolveDir: atlas, loader: 'ts' },
      bundle: true, write: false, platform: 'node', format: 'esm',
      plugins: [{ name: 'cervical-exact-git-history', setup(api) {
        api.onResolve({ filter: /.*/ }, args => {
          if (relative(atlas, args.resolveDir || atlas).replaceAll('\\', '/').startsWith('node_modules/')) return;
          let target;
          if (args.path.startsWith('@/')) target = resolve(atlas, args.path.slice(2));
          else if (args.path.startsWith('.') || isAbsolute(args.path))
            target = resolve(args.resolveDir || atlas, args.path);
          else return; // Existing hermetic builder handles installed dependencies.
          const path = relative(atlas, target).replaceAll('\\', '/');
          assert(path !== '..' && !path.startsWith('../') && !isAbsolute(path));
          for (const suffix of ['', '.ts', '.tsx', '.mjs', '.js', '.json', '/index.ts', '/index.tsx'])
            if (paths.has(path + suffix))
              return { path: resolve(atlas, path + suffix), namespace: 'cervical-git-only' };
          throw new Error('Missing historical application module: ' + path);
        });
        api.onLoad({ filter: /.*/, namespace: 'cervical-git-only' }, async args => {
          const path = relative(atlas, args.path).replaceAll('\\', '/');
          assert(paths.has(path) && path !== '..' && !path.startsWith('../'));
          return { contents: (await reader.readBlob(paths.get(path))).toString('utf8'),
            loader: { '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' }[extname(path)] || 'js',
            resolveDir: dirname(args.path) };
        });
      } }] });
  } finally { await reader.close(); }
  return import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

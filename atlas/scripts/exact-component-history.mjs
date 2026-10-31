// Test-only whole-application component replay from one exact Git commit.
// Local imports never read the current checkout; packages remain external to CJS.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname, extname, isAbsolute, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-component-test-build.mjs';
import {createGitObjectReader} from './git-object-reader.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const gitOptions = {
  cwd: root, encoding: 'utf8', windowsHide: true,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'}, maxBuffer: 16e6,
};
const suffixes = ['', '.ts', '.tsx', '.mjs', '.js', '.json', '/index.ts', '/index.tsx'];

export async function buildExactComponentHistory(commit, entry) {
  assert(/^[a-f0-9]{40}$/.test(commit), 'Full lowercase historical commit required');
  assert(typeof entry === 'string' && entry.length > 0, 'Historical component entry required');
  assert.equal(execFileSync('git', ['rev-parse', `${commit}^{commit}`], gitOptions).trim(), commit);

  const objects = new Map();
  for (const item of execFileSync('git', ['ls-tree', '-r', '-z', '--full-tree', commit], gitOptions).split('\0')) {
    if (!item) continue;
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(item);
    if (match) objects.set(match[3], match[2]); // Symlinks and submodules are never followed.
  }
  const reader = createGitObjectReader({cwd: root});
  const loaded = new Map();
  let result;
  try {
    result = await build({
      stdin: {contents: entry, resolveDir: root, loader: 'tsx'},
      bundle: true, write: false, platform: 'node', format: 'cjs',
      plugins: [{name: 'exact-component-git-replay', setup(api) {
        api.onResolve({filter: /.*/}, args => {
          const local = args.kind === 'entry-point' || args.path.startsWith('@/') ||
            args.path.startsWith('.') || isAbsolute(args.path);
          if (!local) return; // Installed packages stay external in the CJS bundle.
          const target = args.path.startsWith('@/')
            ? resolve(root, args.path.slice(2))
            : resolve(args.resolveDir || (args.importer ? dirname(args.importer) : root), args.path);
          const path = relative(root, target).replaceAll('\\', '/');
          assert(path !== '..' && !path.startsWith('../') && !isAbsolute(path),
            `Historical import outside checkout: ${args.path}`);
          for (const suffix of suffixes) {
            if (objects.has(path + suffix))
              return {path: resolve(root, path + suffix), namespace: 'component-test'};
          }
          throw Error(`Missing historical application module: ${path}`);
        });
        api.onLoad({filter: /.*/, namespace: 'component-test'}, async args => {
          const path = relative(root, args.path).replaceAll('\\', '/');
          assert(path !== '..' && !path.startsWith('../') && !isAbsolute(path),
            'Historical module outside checkout');
          const oid = objects.get(path);
          assert(oid, `Missing historical Git blob: ${path}`);
          const contents = await reader.readBlob(oid);
          loaded.set(path, oid);
          return {
            contents: contents.toString('utf8'),
            loader: ({'.ts': 'ts', '.tsx': 'tsx', '.json': 'json', '.css': 'empty'})[extname(path)] || 'js',
            resolveDir: dirname(args.path),
          };
        });
      }}],
    });
  } finally {
    await reader.close();
  }
  assert.equal(result.outputFiles.length, 1, 'One historical component bundle required');
  return {
    ...result,
    history: {commit, sourceObjects: Object.fromEntries([...loaded].sort(([a], [b]) => a.localeCompare(b)))},
  };
}

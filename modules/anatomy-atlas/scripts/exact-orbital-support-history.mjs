// Test-only replay of actual Git application blobs. No working-tree app fallback.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { createGitObjectReader } from './git-object-reader.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const gitOptions = { cwd: root, encoding: 'utf8', maxBuffer: 16e6,
  windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } };

export async function exactOrbitalSupportHistory(commit) {
  assert.match(commit, /^[a-f0-9]{40}$/);
  assert.equal(execFileSync('git', ['rev-parse', `${commit}^{commit}`], gitOptions).trim(), commit);
  const paths = new Map();
  for (const entry of execFileSync('git', ['ls-tree', '-r', '-z', '--full-tree', commit], gitOptions).split('\0')) {
    if (!entry) continue;
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(entry);
    if (match) paths.set(match[3], match[2]);
  }
  const reader = createGitObjectReader({ cwd: root });
  const resolveSource = () => ({ name: 'exact-orbital-support-git-source', setup(api) {
    api.onResolve({ filter: /.*/ }, args => {
      // Dependencies stay with the existing hermetic package builder. Every
      // application module below still resolves only to this exact Git tree.
      if (relative(root, args.resolveDir || root).replaceAll('\\', '/').startsWith('node_modules/')) return;
      if (!args.path.startsWith('.') && !args.path.startsWith('@/') && !isAbsolute(args.path)) return;
      const target = args.path.startsWith('@/') ? resolve(root, args.path.slice(2)) :
        resolve(args.resolveDir || root, args.path);
      const path = relative(root, target).replaceAll('\\', '/');
      assert(path !== '..' && !path.startsWith('../') && !isAbsolute(path),
        'Historical import outside Atlas checkout');
      for (const suffix of ['', '.ts', '.tsx', '.mjs', '.js', '.json', '/index.ts', '/index.tsx'])
        if (paths.has(path + suffix))
          return { path: resolve(root, path + suffix), namespace: 'exact-orbital-git' };
      throw Error('Historical application module missing: ' + path);
    });
    api.onLoad({ filter: /.*/, namespace: 'exact-orbital-git' }, async args => {
      const path = relative(root, args.path).replaceAll('\\', '/');
      assert(paths.has(path), 'Unlisted historical application module');
      const contents = await reader.readBlob(paths.get(path));
      return { contents: contents.toString('utf8'),
        loader: ({ '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' })[extname(path)] || 'js',
        resolveDir: dirname(args.path) };
    });
  } });
  try {
    const helperBundle = await build({ stdin: { contents:
      "export {orbitalSupportMriLesson} from './lib/orbital-support-mri.ts';export {orbitalSupportMriFacts,orbitalSupportMriLimitations,orbitalSupportMriReferences} from './content/orbital-support-mri.ts';export {parseBodyReviewResponse} from './lib/body-review-response.ts';",
      resolveDir: root, loader: 'ts' }, bundle: true, write: false,
      platform: 'node', format: 'esm', plugins: [resolveSource()] });
    const helper = await import('data:text/javascript;base64,' +
      Buffer.from(helperBundle.outputFiles[0].text).toString('base64'));
    const componentBundle = await componentBuild({ stdin: { contents:
      "export {teachingHeading} from './lib/teaching-heading.ts';export {SourceDisplayNotes} from './app/source-display-notes.tsx';",
      resolveDir: root, loader: 'tsx' }, bundle: true, write: false,
      platform: 'node', format: 'cjs', plugins: [resolveSource()] });
    const require = createRequire(import.meta.url);
    const scope = { exports: {} };
    runInNewContext(componentBundle.outputFiles[0].text,
      { module: scope, exports: scope.exports, require });
    const bodyExplorerPath = 'app/body-explorer.tsx';
    assert(paths.has(bodyExplorerPath));
    const bodyExplorerSource = (await reader.readBlob(paths.get(bodyExplorerPath))).toString('utf8');
    return { helper, components: scope.exports, bodyExplorerSource };
  } finally { await reader.close(); }
}

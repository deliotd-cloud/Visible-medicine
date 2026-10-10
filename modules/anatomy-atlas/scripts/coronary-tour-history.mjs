import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, relative } from 'node:path';

export const coronaryTourBaseline = 'd3d7ef2b22ed5bfe872aa6fa4b54fb69d8747cda';
const frozenPaths = new Set([
  'lib/regional-tours.ts',
  'content/body-renderer-revision.json',
  'content/body-review-display-pins.json',
]);
/** Exact completed epoch for prior milestone assertions. Current tour is tested separately.
 * Pin transitive teaching too: old display hashes cannot validate current lessons.
 */
export function preCoronaryTourPlugin() {
  const contents = new Map([...frozenPaths].map(path => [path,
    execFileSync('git', ['show', `${coronaryTourBaseline}:${path}`], {
      encoding: 'utf8', windowsHide: true, maxBuffer: 32_000_000,
    }),
  ]));
  assert.equal(contents.size, 3);
  return {
    name: 'exact-pre-coronary-tour-epoch',
    setup(api) {
      api.onLoad({ filter: /.*/ }, args => {
        const path = relative(process.cwd(), args.path).replaceAll('\\', '/');
        if (!contents.has(path)) {
          if (!/^(?:app|lib|content|public\/models)\/.+\.(?:ts|tsx|json)$/.test(path) || path.split('/').includes('..')) return;
          contents.set(path, execFileSync('git', ['show', `${coronaryTourBaseline}:${path}`], {
            encoding: 'utf8', windowsHide: true, maxBuffer: 32_000_000,
          }));
        }
        return { contents: contents.get(path), loader: path.endsWith('.json') ? 'json' : path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: dirname(args.path) };
      });
    },
  };
}

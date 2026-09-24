// Offline reconstruction from the two immutable source trees.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';
import { contentRoot } from './content-contract-tools.mjs';

const root = fileURLToPath(contentRoot);
const baselineCommit = '3584fc178a408b42caf430b9084e55198a0d18c6';
const transitionCommit = 'a0b5bac61bd53e9c5732f867846768b5084b175b';

export function wholeBodyTeachingSnapshot(api, catalog) {
  const display = api.bodyDisplayCatalog(catalog);
  return {
    body: display.structures.map(structure => ({
      id: structure.id,
      sections: Object.fromEntries(
        api.contentTabs.map(topic => [topic, api.bodyLesson(structure, topic)]),
      ),
    })),
    shoulder: api.structures,
    recipes: api.dissectionProfiles,
  };
}

export function assertExactHistoricalSnapshot(api, catalog, expectedHash, label) {
  const actual = createHash('sha256')
    .update(JSON.stringify(wholeBodyTeachingSnapshot(api, catalog)))
    .digest('hex');
  assert.equal(actual, expectedHash, label);
}

async function historicalApi(commit) {
  const compiled = await build({
    stdin: {
      contents: "export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    plugins: [{
      name: 'exact-clinical-reference-history',
      setup(builder) {
        builder.onLoad({ filter: /.*/, namespace: 'workspace-test' }, args => {
          const path = relative(root, args.path).replaceAll('\\', '/');
          if (path.startsWith('node_modules/')) return;
          assert(!path.startsWith('../'));
          return {
            contents: execFileSync('git', ['show', commit + ':' + path], {
              cwd: root,
              encoding: 'utf8',
              maxBuffer: 16e6,
            }),
            loader: { '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' }[extname(path)] || 'js',
            resolveDir: dirname(args.path),
          };
        });
      },
    }],
  });
  return import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

export async function exactClinicalReferenceHistory(catalog) {
  const [before, after] = await Promise.all([
    historicalApi(baselineCommit),
    historicalApi(transitionCommit),
  ]);
  assert.deepEqual(
    after.bodyDisplayCatalog(catalog),
    before.bodyDisplayCatalog(catalog),
    'Historical source catalog changed during the clinical-reference transition',
  );
  return { before, after, baselineCommit, transitionCommit };
}

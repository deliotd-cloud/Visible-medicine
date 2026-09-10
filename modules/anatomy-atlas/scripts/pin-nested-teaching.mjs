import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import { nestedConcepts } from '../content/nested-teaching.ts';
const require = createRequire(import.meta.url);
const compiled = await build({
  stdin: {
    contents:
      "export { bodyDisplayCatalog } from './lib/body-display-catalog'; export { nestedStudyTargets } from './lib/nested-anatomy';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: scope,
  exports: scope.exports,
  require,
});
const catalog = scope.exports.bodyDisplayCatalog(
  JSON.parse(
    await readFile('public/models/bodyparts3d/full-body/catalog.json'),
  ),
);
const targets = scope.exports.nestedStudyTargets(catalog);
const bindings = targets.map((target) => {
  const matches = nestedConcepts.filter(
    (c) =>
      c.study === target.study && c.fmaIds.includes(target.structure.fmaId),
  );
  if (matches.length !== 1)
    throw Error('Expected one explicit lesson for ' + target.structureId);
  return {
    conceptId: matches[0].id,
    study: target.study,
    sourceHash: target.sourceHash,
    parentId: target.parentId,
    parentHash: target.parentHash,
    structure: target.structure,
  };
});
const parents = [...new Set(targets.map((t) => t.parentId))].map((id) =>
  catalog.structures.find((s) => s.id === id),
);
const result = {
  schemaVersion: 1,
  purpose:
    'Draft teaching bindings only; not clinical approval or imaging registration',
  parents,
  bindings,
};
const path = 'content/nested-teaching-bindings.v1.json';
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if ((await readFile(path, 'utf8')) !== text)
    throw Error(
      'Nested teaching source bindings changed; explicit editorial review and repinning required',
    );
} else {
  // Never overwrite existing pins automatically. A source change needs deliberate review.
  const existing = await readFile(path, 'utf8').catch((e) => {
    if (e.code !== 'ENOENT') throw e;
    return null;
  });
  if (existing !== null && existing !== text)
    throw Error(
      'Existing teaching pins differ; do not migrate them automatically',
    );
  await writeFile(path, text);
}
console.log(
  `Verified ${bindings.length} source-bound nested representations and ${parents.length} parents for ${nestedConcepts.length} teaching concepts; no approvals created.`,
);

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const encode = (value) => JSON.stringify(value, null, 2) + '\n';

/** Offline comparison only. Never substitutes old revisions into the runtime,
 * exports or private review store. The complete current document and every
 * referenced display-source byte are checked before reconstructing history. */
export async function reviewDocumentBeforeSearch(
  revisions,
  manifest,
  structures,
) {
  assert.equal(
    hash(encode(revisions)),
    '409ffb44fabf97ae06ab89601ea9aa3a87e9c6aee6bd7045b5e2329178c77d50',
    'Exact search-display review transition',
  );
  for (const [path, expected] of revisions.display) {
    const source = await readFile(
      new URL('../' + path, import.meta.url),
      'utf8',
    );
    assert.equal(
      hash(source.replace(/\r\n/g, '\n')),
      expected,
      'Stale display fingerprint: ' + path,
    );
  }
  const previous = structuredClone(revisions);
  const replaced = {
    'app/atlas-workspace.tsx':
      'f0f6939077c79c88e5a32e7a92d152c87ae19b712bbdbb43deed7d01b1eea2f3',
    'lib/atlas-navigation.ts':
      '07e841a0a276d349a48ba1f11cec87e39d34bb6cc154d730b9c23003d70df16c',
  };
  previous.display = previous.display
    .filter(([path]) => path !== 'lib/anatomy-search.ts')
    .map(([path, fingerprint]) => [path, replaced[path] ?? fingerprint]);
  assert.equal(revisions.display.length - previous.display.length, 1);
  assert.equal(previous.modelHash, manifest.sha256);
  for (const s of structures) {
    previous.revisions[s.id].geometry = hash(
      JSON.stringify({
        model: manifest.sha256,
        manifest,
        display: previous.display,
        identity: { id: s.id, name: s.name, latinName: s.latinName },
      }),
    );
    assert.notEqual(
      previous.revisions[s.id].geometry,
      revisions.revisions[s.id].geometry,
    );
  }
  assert.equal(
    hash(encode(previous)),
    'abc8f9410e00b41282e149d2bb6020d96ad6367aed769888519940c4c24118a0',
    'Original review document preserved; no repinned baseline or approval migration',
  );
  return previous;
}

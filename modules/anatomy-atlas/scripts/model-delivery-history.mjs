// Offline evidence comparison only. Never migrates approvals or runtime revisions.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const encode = (value) => JSON.stringify(value, null, 2) + '\n';

export async function reviewDocumentBeforeModelDelivery(revisions, manifest, structures) {
  assert.equal(hash(encode(revisions)),
    '5365d114752b157338dc9ebcf9e58dabe56be2d4d35296e717845bce939dfd05',
    'Exact deferent-duct search display transition');
  for (const [path, expected] of revisions.display) {
    const source = await readFile(new URL('../' + path, import.meta.url), 'utf8');
    assert.equal(hash(source.replace(/\r\n/g, '\n')), expected,
      'Stale current display fingerprint: ' + path);
  }
  // Reconstruct only the exact pre-duct-search document for offline comparison.
  // All current source bytes were checked above. Runtime approvals are untouched.
  const current = revisions;
  revisions = structuredClone(current);
  revisions.display = revisions.display.map(([path, fingerprint]) => [path,
    path === 'lib/anatomy-search.ts'
      ? '7c9c095c03827e820fbaee012bb7daf9ccb4b29eae0400b254af2b50840f4893'
      : fingerprint,
  ]);
  for (const s of structures) {
    revisions.revisions[s.id].geometry = hash(JSON.stringify({
      model: manifest.sha256, manifest, display: revisions.display,
      identity: { id: s.id, name: s.name, latinName: s.latinName },
    }));
    assert.notEqual(revisions.revisions[s.id].geometry, current.revisions[s.id].geometry);
  }
  assert.equal(hash(encode(revisions)),
    'eed891c943c781fc0e7415fe47fefc14cfc9eecc12eaf19864e23d51dafe85f7',
    'Exact prior source 0b3c1fd review document; no approval migration');
  const previous = structuredClone(revisions);
  assert.deepEqual(previous.display.slice(0, 2).map(([path]) => path), [
    'scripts/glb-lossless-codec.mjs', 'scripts/compress-model-delivery.mjs',
  ]);
  previous.display = previous.display.slice(2).map(([path, fingerprint]) => [path,
    path === 'app/anatomy-scene.tsx'
      ? 'bd107984bb34033ccf6a18797de4a41c63e83b66c3db8e258a2960954345f45e'
      : fingerprint,
  ]);
  for (const s of structures) {
    previous.revisions[s.id].geometry = hash(JSON.stringify({
      model: manifest.sha256, manifest, display: previous.display,
      identity: { id: s.id, name: s.name, latinName: s.latinName },
    }));
    assert.notEqual(previous.revisions[s.id].geometry, revisions.revisions[s.id].geometry);
  }
  // Exact document from source 0621e5ce17bcc489dde76b0a4d6bed07305b4143.
  // Unchanged teaching, imaging and canonical mesh evidence are covered by this hash.
  assert.equal(hash(encode(previous)),
    '333fc59956b21e4a8198a90be8764774d81ca1c170d4b9b36636e180e8357c15',
    'Exact pre-delivery review document; no approval migration');
  return previous;
}

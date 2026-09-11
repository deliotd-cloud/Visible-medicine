// Offline evidence comparison only. Never migrates approvals or runtime revisions.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const encode = (value) => JSON.stringify(value, null, 2) + '\n';

export async function reviewDocumentBeforeModelDelivery(revisions, manifest, structures) {
  assert.equal(hash(encode(revisions)),
    'eed891c943c781fc0e7415fe47fefc14cfc9eecc12eaf19864e23d51dafe85f7',
    'Exact lossless-delivery display transition');
  for (const [path, expected] of revisions.display) {
    const source = await readFile(new URL('../' + path, import.meta.url), 'utf8');
    assert.equal(hash(source.replace(/\r\n/g, '\n')), expected,
      'Stale current display fingerprint: ' + path);
  }
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

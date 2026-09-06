import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { structures, quizQuestions } from '../app/anatomy-data.ts';

const root = new URL('../', import.meta.url);
const hash = (value) => createHash('sha256').update(value).digest('hex');
// Git may check out text as CRLF on Windows. Line endings are not a display revision.
const canonicalText = (value) => value.replace(/\r\n/g, '\n');
const model = await readFile(
  new URL('public/models/bodyparts3d/shoulder-right.glb', root),
);
const manifest = JSON.parse(
  await readFile(
    new URL('public/models/bodyparts3d/manifest.json', root),
    'utf8',
  ),
);
if (hash(model) !== manifest.sha256)
  throw new Error('Shoulder mesh hash differs from its provenance manifest.');
const displayPaths = [
  'app/anatomy-scene.tsx',
  'app/anatomy-tissue.tsx',
  'app/fitted-camera.tsx',
  'app/shoulder-explorer.tsx',
  'app/globals.css',
  'lib/explode-layout.mjs',
  'lib/inspection-state.ts',
  'lib/anatomy-practice.ts',
  'lib/inspection-geometry.ts',
  'app/inspection-controls.tsx',
  'app/inspection.css',
  'lib/study-camera.ts',
  'lib/study-views.ts',
  'app/study-views.tsx',
  'app/study-views.css',
  'lib/anatomy-coordinates.ts',
  'lib/anatomy-link-registry.ts',
  'lib/imaging-sync.ts',
  'app/imaging-link.tsx',
  'app/imaging-link.css',
];
const display = await Promise.all(
  displayPaths.map(async (path) => [
    path,
    hash(canonicalText(await readFile(new URL(path, root), 'utf8'))),
  ]),
);
const revisions = Object.fromEntries(
  structures.map((s) => [
    s.id,
    {
      geometry: hash(
        JSON.stringify({
          model: manifest.sha256,
          manifest,
          display,
          identity: { id: s.id, name: s.name, latinName: s.latinName },
        }),
      ),
      teaching: hash(JSON.stringify({ structure: s, quizQuestions })),
      imaging: null,
    },
  ]),
);
const output =
  JSON.stringify(
    { schemaVersion: 1, modelHash: manifest.sha256, display, revisions },
    null,
    2,
  ) + '\n';
const target = new URL('content/review-revisions.json', root);
if (process.argv.includes('--check')) {
  if (canonicalText(await readFile(target, 'utf8')) !== output)
    throw new Error(
      'Review fingerprints are stale. Run npm run reviews:revisions.',
    );
} else await writeFile(target, output);
console.log(
  'Review fingerprints verified for all nine shoulder structures; imaging remains absent.',
);

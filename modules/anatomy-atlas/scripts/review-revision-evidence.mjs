// Offline evidence generation shared by the fingerprint writer and history tests.
// Never reads, writes or migrates private review decisions.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const hash = (value) => createHash('sha256').update(value).digest('hex');
export const reviewDisplayPaths = [
  'scripts/glb-lossless-codec.mjs',
  'scripts/compress-model-delivery.mjs',
  'app/anatomy-scene.tsx',
  'app/scene-label-layer.tsx',
  'app/scene-label-layer.css',
  'lib/screen-label-layout.ts',
  'lib/label-depth.ts',
  'app/anatomy-canvas.tsx',
  'lib/anatomy-root-session.ts',
  'app/scene-recovery.tsx',
  'app/scene-recovery.css',
  'lib/renderer-health.ts',
  'app/anatomy-tissue.tsx',
  'app/fitted-camera.tsx',
  'app/shoulder-explorer.tsx',
  'app/shoulder-workspace.css',
  'app/atlas-workspace.tsx',
  'app/workspace-session.ts',
  'app/atlas-workspace.css',
  'app/atlas-panel.css',
  'lib/atlas-panel-layout.ts',
  'lib/atlas-note-navigation.ts',
  'app/anatomy-control-rail.tsx',
  'app/body-explorer.css',
  'lib/atlas-navigation.ts',
  'lib/anatomy-search.ts',
  'app/globals.css',
  'lib/explode-layout.mjs',
  'lib/body-arrangement.ts',
  'lib/shoulder-arrangement.ts',
  'app/explode-style-select.tsx',
  'app/explode-style-select.css',
  'lib/inspection-state.ts',
  'lib/selection-visibility.ts',
  'app/selection-visibility-notice.tsx',
  'app/selection-visibility.css',
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

export function reviewDocumentForDisplay(
  manifest,
  structures,
  quizQuestions,
  display,
) {
  return {
    schemaVersion: 1,
    modelHash: manifest.sha256,
    display,
    revisions: Object.fromEntries(
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
    ),
  };
}

export async function currentReviewDocument(
  manifest,
  structures,
  quizQuestions,
) {
  const model = await readFile(
    new URL('public/models/bodyparts3d/shoulder-right.glb', root),
  );
  assert.equal(
    hash(model),
    manifest.sha256,
    'Shoulder mesh differs from its provenance manifest',
  );
  const display = await Promise.all(
    reviewDisplayPaths.map(async (path) => [
      path,
      hash(
        (await readFile(new URL(path, root), 'utf8')).replace(/\r\n/g, '\n'),
      ),
    ]),
  );
  return reviewDocumentForDisplay(manifest, structures, quizQuestions, display);
}

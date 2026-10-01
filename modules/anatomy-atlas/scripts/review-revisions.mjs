import { readFile, writeFile } from 'node:fs/promises';
import { structures, quizQuestions } from '../app/anatomy-data.ts';
import { currentReviewDocument } from './review-revision-evidence.mjs';
import { checkBodyReviewDisplayPins } from './generate-body-review-display-pins.mjs';
// Existing production-build gate: reject stale display pins without rewriting
// decisions or changing the renderer's package/lockfile revision domain.
await checkBodyReviewDisplayPins();
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(
  await readFile(
    new URL('public/models/bodyparts3d/manifest.json', root),
    'utf8',
  ),
);
const output =
  JSON.stringify(
    await currentReviewDocument(manifest, structures, quizQuestions),
    null,
    2,
  ) + '\n';
const target = new URL('content/review-revisions.json', root);
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')).replace(/\r\n/g, '\n') !== output)
    throw new Error(
      'Review fingerprints are stale. Run npm run reviews:revisions.',
    );
} else await writeFile(target, output);
console.log(
  'Review fingerprints verified for all nine shoulder structures; imaging remains absent.',
);

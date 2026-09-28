import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

// Includes the eafd71c quiz batch and the body-panel answer-evidence repair.
const reviewRevision = 'e1ad6b0c2aa62cb0f719ef666d559ec0bc8c9eed';
const learnerRevision = 'e1ad6b0c2aa62cb0f719ef666d559ec0bc8c9eed';
const identities = [
  ['right-medial-plantar-artery', 'right', 'FMA43929', 'Posterior tibial artery', ['FJ2164']],
  ['left-medial-plantar-artery', 'left', 'FMA43930', 'Posterior tibial artery', ['FJ2082']],
  ['right-plantar-arch', 'right', 'FMA43943', 'Lateral plantar artery with a deep plantar contribution', ['FJ2169']],
  ['left-plantar-arch', 'left', 'FMA43944', 'Lateral plantar artery with a deep plantar contribution', ['FJ2085']],
  ['right-deep-plantar-artery', 'right', 'FMA69514', 'Dorsalis pedis artery', ['FJ2136']],
  ['left-deep-plantar-artery', 'left', 'FMA69515', 'Dorsalis pedis artery', ['FJ2068']],
  ['dorsal-venous-arch-of-right-foot', 'right', 'FMA44881', 'Great saphenous and small saphenous veins', ['FJ2061', 'FJ2062']],
  ['dorsal-venous-arch-of-left-foot', 'left', 'FMA44882', 'Great saphenous and small saphenous veins', ['FJ2059', 'FJ2060']],
] as const;

test('eight source-pinned foot vascular drafts expose answer evidence in the actual review panel', async () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const viewer = JSON.parse(readFileSync('public/atlas-review-viewer/manifest.json', 'utf8'));
  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  assert.equal(review.revision, reviewRevision);
  assert.equal(viewer.sourceCommit, reviewRevision);
  assert.equal(viewer.websiteIntegrationSha256, review.websiteIntegrationSha256);
  assert.equal(learner.sourceCommit, learnerRevision);
  for (const path of ['content/foot-vascular-quiz.ts', 'content/foot-vascular-quiz-pins.json', 'lib/foot-vascular-quiz.ts']) {
    assert(review.files.some((file: { path: string }) => file.path === path), path);
  }
  const bundled = await build({
    stdin: { contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { BodyReviewDetails } from './atlas-review/app/review/body/review-dashboard';
      export { bodyReviewMaterial, bodyReviewSummaries } from './atlas-review/lib/body-review-material';
      export { clinicalReviewEntries } from './atlas-review/lib/clinical-review-index';
      export { default as pins } from './atlas-review/content/foot-vascular-quiz-pins.json';
      export function render(material) { return renderToStaticMarkup(React.createElement(BodyReviewDetails, { material })); }
    `, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic',
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(process.cwd() + '/package.json');" },
    plugins: [{ name: 'review-test-next-link', setup(b) {
      b.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: "import React from 'react'; export default function Link({children,...props}) { return React.createElement('a',props,children); }",
        resolveDir: process.cwd(),
      }));
    } }],
  });
  const api = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64')).catch(error => {
    // Data-URL stacks contain the entire bundle; preserve the useful error only.
    error.stack = error.message;
    throw error;
  });
  const escaped = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  assert.equal(api.pins.entries.length, 8);
  const materialHashes = new Set<string>();
  for (const [slug, side, fmaId, expectedAnswer, sourceFiles] of identities) {
    const id = `vm:anatomy:body:foot:${side}:vessel:${slug}`;
    const pin = api.pins.entries.find((entry: any) => entry.identity.id === id);
    assert(pin, id);
    const material = await api.bodyReviewMaterial(id);
    assert(material, id);
    assert.deepEqual(material.source.structure, pin.identity, 'full source identity remains pinned');
    assert.equal(material.source.structure.fmaId, fmaId);
    assert.equal(material.source.structure.laterality, side);
    assert.deepEqual(material.source.structure.sources.map((source: any) => source.file), sourceFiles);
    assert.equal(material.source.structure.validation.anatomicalReview, false);
    assert.equal(material.approval, false);
    assert.equal(material.status, 'worksheet-not-submitted');
    assert.deepEqual(material.reviewerNotes, { reviewer: '', qualification: '', date: '', evidence: [], corrections: [] });
    materialHashes.add(material.materialHash);
    const quiz = material.topics.find((topic: any) => topic.tab === 'quiz');
    assert.equal(quiz.readiness, 'draft');
    assert.equal(quiz.bullets.length, 4);
    assert.equal(new Set(quiz.bullets).size, 4);
    assert(quiz.bullets.every((choice: unknown) => typeof choice === 'string' && choice.trim().length > 0));
    assert.equal(quiz.correctAnswer, expectedAnswer);
    assert.equal(quiz.bullets.filter((choice: string) => choice === quiz.correctAnswer).length, 1);
    assert(quiz.body.trim().endsWith('?'));
    assert(quiz.explanation.trim().length > 30);
    assert.match(quiz.note, /Radiologist review pending/);
    assert.match(quiz.note, /Atlas, imaging-case and lecture access remain independent/);
    const reference = `https://anatomy.ttuhscep.edu/anatomytables/${slug.startsWith('dorsal-venous') ? 'veins' : 'arteries'}_lowerlimb.html`;
    assert.deepEqual(quiz.citations, [reference]);
    const entry = api.clinicalReviewEntries.filter((row: any) => row.scope === 'body' && row.id === id);
    assert.equal(entry.length, 1);
    assert.equal(new URL(entry[0].href, 'https://review.test').searchParams.get('structure'), id);
    const html = api.render(material);
    for (const text of [quiz.body, ...quiz.bullets, quiz.correctAnswer, quiz.explanation, quiz.note, fmaId, id, material.materialHash, material.source.bundle.sha256]) {
      assert(html.includes(escaped(text)), `${fmaId}: review renders ${text}`);
    }
    assert(html.includes('Draft answer key:'));
    assert(html.includes('Draft explanation:'));
    assert(html.includes(`href="${reference}"`));
    for (const source of material.source.structure.sources) {
      assert(html.includes(source.file));
      assert(html.includes(source.sha256));
    }
    const modelHref = html.match(/href="([^"]+)"[^>]*>Open this model<\/a>/)?.[1];
    assert(modelHref, `${fmaId}: source-specific model link`);
    const model = new URL(modelHref.replace(/&amp;/g, '&'), 'https://review.test');
    assert.equal(model.pathname, '/workspace/atlas-review/model');
    const original = new URL(material.atlasLink, 'https://review.test');
    for (const [key, value] of original.searchParams) assert.equal(model.searchParams.get(key), value);
    assert.equal(model.searchParams.get('structure'), id);
    assert.match(model.searchParams.get('source')!, /^[a-f0-9]{64}$/);
    assert(html.includes('not clinical approval'));
    assert(html.includes('not an approval or signature'));
  }
  assert.equal(materialHashes.size, 8, 'each laterality/source retains distinct review material');
  let unkeyed: any = null;
  for (const summary of api.bodyReviewSummaries) {
    const candidate = await api.bodyReviewMaterial(summary.id);
    const quiz = candidate.topics.find((topic: any) => topic.tab === 'quiz');
    if (quiz.readiness === 'generated-identification' && !quiz.correctAnswer && !quiz.explanation) {
      unkeyed = candidate;
      break;
    }
  }
  assert(unkeyed, 'a real legacy unkeyed identification note remains available');
  const legacyHtml = api.render(unkeyed);
  assert(!legacyHtml.includes('Draft answer key:'));
  assert(!legacyHtml.includes('Draft explanation:'));
  assert.equal(unkeyed.approval, false);
});

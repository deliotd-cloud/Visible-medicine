import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

test('seven thoracic quick checks reach learner and review with exact identities and answer evidence', async () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const learner = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  assert.equal(review.revision, 'edca765b64dbdc58a75aa80610f42646bdb10511');
  assert.equal(learner.sourceCommit, review.revision);
  assert.equal(learner.patientDataIncluded, false);
  assert.equal(learner.clinicalApproved, false);
  const inputs = JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json', 'utf8'));
  for (const path of ['content/thoracic-quiz.ts', 'content/thoracic-quiz-pins.json', 'lib/thoracic-quiz.ts']) {
    const file = review.files.find((f: any) => f.path === path);
    assert(file, path);
    assert.equal(inputs.find((f: any) => f.path === path)?.sha256, file.sourceSha256);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/' + path)).digest('hex'), file.importedSha256);
  }
  const result = await build({
    stdin: { contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { BodyReviewDetails } from './atlas-review/app/review/body/review-dashboard';
      export { bodyReviewMaterial } from './atlas-review/lib/body-review-material';
      export { default as pins } from './atlas-review/content/thoracic-quiz-pins.json';
      export function render(material) { return renderToStaticMarkup(React.createElement(BodyReviewDetails, { material })); }
    `, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic',
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(process.cwd() + '/package.json');" },
    plugins: [{ name: 'review-link', setup(b) {
      b.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: "import React from 'react'; export default function Link({children,...props}) { return React.createElement('a',props,children); }",
        resolveDir: process.cwd(),
      }));
    } }],
  });
  const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')).catch(error => { error.stack = error.message; throw error; });
  const answers: Record<string, string> = {
    FMA7309: 'Superior and middle', FMA7310: 'Superior lobe', FMA7394: 'Esophagus',
    FMA7395: 'Wider, shorter, more vertical', FMA7396: 'Trachea',
    FMA50872: 'Anterior', FMA50873: 'Superior',
  };
  assert.equal(api.pins.entries.length, 7);
  const seen = new Set<string>();
  for (const pin of api.pins.entries) {
    const material = await api.bodyReviewMaterial(pin.identity.id);
    assert(material);
    assert.deepEqual(material.source.structure, pin.identity);
    assert.equal(material.approval, false);
    assert.equal(material.status, 'worksheet-not-submitted');
    const quiz = material.topics.find((topic: any) => topic.tab === 'quiz');
    assert.equal(quiz.readiness, 'draft');
    assert.equal(quiz.correctAnswer, answers[pin.identity.fmaId]);
    assert.equal(quiz.bullets.length, 4);
    assert.equal(new Set(quiz.bullets).size, 4);
    assert.equal(quiz.bullets.filter((choice: string) => choice === quiz.correctAnswer).length, 1);
    assert(quiz.explanation.length > 30);
    assert.match(quiz.note, /Radiologist review pending/);
    const html = api.render(material);
    for (const text of [quiz.body, quiz.correctAnswer, quiz.explanation, 'Draft answer key:', 'Draft explanation:']) assert(html.includes(text), text);
    for (const citation of quiz.citations) assert(html.includes(citation));
    seen.add(pin.identity.fmaId);
  }
  assert.deepEqual([...seen].sort(), Object.keys(answers).sort());
});

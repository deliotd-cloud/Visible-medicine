import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

test('fourteen Circle of Willis imaging drafts reach exact-source review, not approval', async () => {
  const manifest = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const viewer = JSON.parse(readFileSync('public/atlas-review-viewer/manifest.json', 'utf8'));
  assert.equal(manifest.revision, 'b3995e784dfab02686e03a995e6e1e4e0ae150d9');
  assert.equal(viewer.sourceCommit, manifest.revision);
  assert.equal(viewer.websiteIntegrationSha256, manifest.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded, false);
  const modelPage = readFileSync('app/workspace/atlas-review/model/page.tsx', 'utf8');
  assert(modelPage.includes('Review-linked model'));
  assert(!/Exact review source · \d/.test(modelPage), 'No stale hard-coded import date');
  const sha = (text: string) => createHash('sha256').update(text).digest('hex');
  const pins = JSON.parse(readFileSync('atlas-review/content/circle-willis-imaging-pins.json', 'utf8'));
  assert.equal(sha(JSON.stringify(pins)), 'b5e35e27b271b5b9e3932872f168735428416882918c12554a9ff03c06f87f7e');
  assert.deepEqual(pins.entries.map((entry: any) => entry.identity.fmaId),
    ['FMA50169', 'FMA50029', 'FMA50030', 'FMA50584', 'FMA50585', 'FMA50085', 'FMA50086']);
  assert.deepEqual(pins.entries.map((entry: any) => entry.identity.laterality),
    ['midline', 'right', 'left', 'right', 'left', 'right', 'left']);
  const bundled = await build({
    stdin: { contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { BodyReviewDetails } from './atlas-review/app/review/body/review-dashboard';
      export { bodyReviewMaterial } from './atlas-review/lib/body-review-material';
      export { clinicalReviewEntries } from './atlas-review/lib/clinical-review-index';
      export function render(material) { return renderToStaticMarkup(React.createElement(BodyReviewDetails, { material })); }
    `, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic',
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(process.cwd() + '/package.json');" },
    plugins: [{ name: 'review-test-link', setup(b) {
      b.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: "import React from 'react'; export default function Link({children,...props}) { return React.createElement('a',props,children); }",
        resolveDir: process.cwd(),
      }));
    } }],
  });
  const api = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64')).catch(error => {
    error.stack = error.message; throw error;
  });
  const escaped = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  let placements = 0;
  const materialHashes = new Set<string>();
  for (const { identity } of pins.entries) {
    const material = await api.bodyReviewMaterial(identity.id);
    assert(material);
    assert.deepEqual(material.source.structure, identity);
    assert.equal(material.source.bundle.sha256, pins.bundles[0].sha256);
    assert.equal(material.approval, false);
    assert.equal(material.status, 'worksheet-not-submitted');
    assert.deepEqual(material.reviewerNotes, { reviewer: '', qualification: '', date: '', evidence: [], corrections: [] });
    materialHashes.add(material.materialHash);
    const entry = api.clinicalReviewEntries.filter((row: any) => row.scope === 'body' && row.id === identity.id);
    assert.equal(entry.length, 1);
    assert.equal(new URL(entry[0].href, 'https://review.test').searchParams.get('structure'), identity.id);
    const html = api.render(material);
    for (const tab of ['ct', 'mri']) {
      const topic = material.topics.find((item: any) => item.tab === tab);
      assert.equal(topic.readiness, 'draft');
      assert.match(topic.title, tab === 'ct' ? /CT angiographic orientation/ : /MR angiographic orientation/);
      assert.match(topic.note, /revision-bound radiologist review/);
      assert.match(topic.note, /No patient images, registration or clinical approval/);
      assert.match(topic.note, /Atlas, imaging-case and paid-lecture access remain independent/);
      assert(topic.citations.includes('https://www.radiologyinfo.org/en/info/' + (tab === 'ct' ? 'angioct' : 'angiomr')));
      assert(topic.citations.some((url: string) => url.startsWith('https://nba.uth.tmc.edu/neuroanatomy/')));
      for (const text of [topic.body, ...topic.bullets, topic.note, ...topic.citations, identity.fmaId, material.materialHash]) {
        assert(html.includes(escaped(text)), `${identity.fmaId}/${tab}: review evidence not rendered`);
      }
      placements++;
    }
  }
  assert.equal(placements, 14);
  assert.equal(materialHashes.size, 7);
  assert.equal(await api.bodyReviewMaterial('vm:anatomy:body:head-neck:left:vessel:invented-circle-willis-artery'), null);
});

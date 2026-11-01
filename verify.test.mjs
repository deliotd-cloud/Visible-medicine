import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
const own = 'G:/VisibleMedicine-temp/proposals/20261101-hepatic-learner-checks';
const hash = b => createHash('sha256').update(b).digest('hex');
const read = name => JSON.parse(fs.readFileSync(`${own}/evidence/${name}.json`));
const before = read('before'), after = read('after');
const selected = html => [...html.matchAll(/<button[^>]*aria-selected="true"[^>]*>(.*?)<\/button>/g)].map(m => m[1].replace(/<[^>]*>/g, ''));
const targets = after.rendered.filter(r => r.conceptId !== 'hepatic-venous-tributary');
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');

test('evidence uses the unchanged actual component and exact saved source overlay', () => {
  assert.equal(targets.length, 4);
  assert.equal(after.rendered.length, 5);
  for (const packet of [before, after]) {
    assert.equal(packet.rendererSha256, hash(fs.readFileSync(`${own}/render.mjs`)));
    assert.equal(packet.packageLockSha256, hash(fs.readFileSync('G:/VisibleMedicine-temp/staging/20261101-regional-teaching-types/atlas/package-lock.json')));
    assert.equal(packet.sourceMode, 'actual-component-and-installed-React-SSR');
    assert.equal(packet.browserRendering, false);
    assert.equal(packet.stylesEvaluated, false);
    assert.equal(packet.fullTypes, false);
    for (const input of packet.inputs) assert.equal(hash(fs.readFileSync(input.location)), input.sha256, input.path);
  }
  const prior = new Map(before.inputs.map(row => [row.path, row]));
  assert.deepEqual(after.inputs.filter(row => !prior.has(row.path) || prior.get(row.path).sha256 !== row.sha256).map(row => row.path),
    ['content/hepatic-teaching.ts','content/hepatic-vascular-xray.ts','content/nested-teaching.ts']);
  assert.equal(before.inputs.find(r => r.path === 'app/nested-teaching.tsx').sha256,
    after.inputs.find(r => r.path === 'app/nested-teaching.tsx').sha256);
});

test('four X-ray entries open the intended draft panel with its complete teaching and source', () => {
  for (const row of targets) {
    const old = before.rendered.find(r => r.id === row.id);
    assert.equal(old.lesson.readiness, 'pending');
    assert.deepEqual(selected(old.html), ['Anatomy','Overview']);
    assert.equal(row.lesson.readiness, 'draft');
    assert.match(row.html, /^<details class="nested-teaching" open="">/);
    assert.deepEqual(selected(row.html), ['Imaging','X-ray']);
    assert.ok(row.html.includes(`<p>${escape(row.lesson.body)}</p>`), row.id);
    assert.ok(row.html.includes(`<p class="nested-teaching-status">${escape(row.lesson.note)}</p>`));
    assert.equal(row.lesson.citations.length, 1);
    const url = row.conceptId === 'hepatic-arterial' ? 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8415139/' : 'https://pubs.rsna.org/radiology/doi/10.1148/rg.220020';
    assert.deepEqual(row.lesson.citations, [url]);
    assert.ok(row.html.includes(`<a href="${url}" target="_blank" rel="noreferrer">`));
    assert.ok(row.html.includes('specialist review pending'));
  }
});

test('ordinary entry stays collapsed and does not switch to X-ray', () => {
  for (const row of after.rendered) {
    assert.match(row.ordinary, /^<details class="nested-teaching">/);
    assert.deepEqual(selected(row.ordinary), ['Anatomy','Overview']);
    assert.equal(row.ordinary, before.rendered.find(r => r.id === row.id).ordinary);
  }
});

test('forged source identities render no alternative teaching or review action', () => {
  for (const packet of [before, after]) for (const row of packet.rendered) {
    assert.equal(row.forged, '<div class="nested-teaching-unavailable"><p>Teaching is unavailable for this source binding. No alternative structure has been substituted.</p></div>');
  }
});

test('the explicit learner context hides the author review link without hiding teaching', () => {
  for (const row of after.rendered) {
    assert.equal(row.privateHidden.includes('/review/nested?'), false);
    assert.equal(row.privateHidden.includes('Review this structure'), false);
    if (row.lesson.readiness === 'draft') assert.ok(row.privateHidden.includes(escape(row.lesson.body)));
  }
});

test('the unsupported hepatic tributary retains all prior rendered output and pending status', () => {
  const row = after.rendered.find(r => r.conceptId === 'hepatic-venous-tributary');
  assert.deepEqual(row, before.rendered.find(r => r.id === row.id));
  assert.equal(row.lesson.readiness, 'pending');
});

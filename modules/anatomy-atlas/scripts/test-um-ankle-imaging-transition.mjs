import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { build } from './workspace-test-build.mjs';

// Immutable pre-addition authoring transition; never substitute a mutable
// working-tree fixture. No model bytes, patient images or approvals are added.
const baselineRevision = '9cea1892eaf33f9ee0655e4ecc03e50037844536';
const root = fileURLToPath(new URL('../', import.meta.url));
const path = 'content/um-limb-teaching-bindings.v1.json';
const baseline = JSON.parse(execFileSync('git', ['-C', root, 'show', `${baselineRevision}:${path}`], { encoding: 'utf8' }));
const current = JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const additions = new Map([
  ['tibialis-anterior', ['ultrasound', 'mri']],
  ['extensor-hallucis-longus', ['ultrasound']],
  ['extensor-digitorum-longus', ['ultrasound']],
  ['tibialis-posterior', ['ultrasound']],
  ['flexor-digitorum-longus', ['ultrasound']],
  ['flexor-hallucis-longus', ['ultrasound']],
]);
const clone = value => structuredClone(value);
const bundle = await build({
  stdin: { contents: "export * from './lib/um-limb-teaching.ts'; export * from './lib/um-limb-navigation.ts'; export * from './lib/specimen-links.ts'; export { limbDefinitions } from './lib/um-limb-studies.ts';", loader: 'ts', resolveDir: root },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

test('Exactly seven new ankle imaging topics; all 67 complete source bindings and prior teaching unchanged', () => {
  assert.equal(baseline.bindings.length, 67);
  assert.equal(current.bindings.length, 67);
  assert.equal(new Set(current.bindings.map(p => p.surface.id)).size, 67);
  const normalized = clone(current);
  let added = 0;
  for (let index = 0; index < current.bindings.length; index++) {
    const before = baseline.bindings[index], after = current.bindings[index];
    assert.deepEqual(after.surface, before.surface, `${before.surface.slug}: complete source surface unchanged`);
    assert.equal(after.bundleSha256, before.bundleSha256, `${before.surface.slug}: bundle hash unchanged`);
    for (const topic of additions.get(before.surface.slug) ?? []) {
      assert.equal(Object.hasOwn(before.lesson.extended.topics, topic), false, `${before.surface.slug}/${topic}: absent at baseline`);
      const note = after.lesson.extended.topics[topic];
      assert(note, `${before.surface.slug}/${topic}: generated pin contains addition`);
      assert.equal(note.readiness, 'draft');
      assert(note.body.trim().length > 50);
      assert(note.references.length > 0);
      delete normalized.bindings[index].lesson.extended.topics[topic];
      added++;
    }
  }
  assert.equal(added, 7);
  // Includes modelLimit, selfCheck, references, all previous topics, anatomy,
  // function, registry metadata and binding order, without an exclusion list.
  assert.deepEqual(normalized, baseline, 'Removing only allowed additions yields the exact prior registry');
});

test('Production resolver binds all 67 original surfaces and rejects forged surfaces/bundles', () => {
  const whole = api.limbDefinitions.whole;
  assert.equal(whole.surfaces.length, 67);
  for (const pin of current.bindings) {
    const surface = whole.surfaces.find(s => s.id === pin.surface.id);
    assert.deepEqual(surface, pin.surface);
    assert.deepEqual(api.specimenTeachingFor(whole, surface), pin.lesson);
    for (const alter of [s => { s.sources[0].sha256 = '0'.repeat(64); }, s => { s.bounds.min[0] += 1; }, s => { s.name += ' forged'; }]) {
      const forged = clone(surface);
      alter(forged);
      assert.equal(api.specimenTeachingFor(whole, forged), null, `${surface.slug}: forged selection rejected`);
      const forgedDefinition = { ...whole, surfaces: whole.surfaces.map(s => s.id === forged.id ? forged : s) };
      assert.equal(api.specimenTeachingFor(forgedDefinition, forged), null, `${surface.slug}: forged definition rejected`);
      assert.deepEqual(api.availableSpecimenTopics(forgedDefinition, forged.id), []);
    }
    const forgedBundle = clone(whole);
    forgedBundle.catalog.bundles.find(b => b.id === surface.bundle).sha256 = '0'.repeat(64);
    assert.equal(api.specimenTeachingFor(forgedBundle, surface), null, `${surface.slug}: forged bundle rejected`);
  }
});

test('Actual topic availability and source-bound links offer all seven additions and reject unsupported CT', () => {
  let wholeAdditions = 0;
  for (const [scope, definition] of Object.entries(api.limbDefinitions)) {
    for (const [slug, topics] of additions) {
      const selected = definition.surfaces.find(s => s.slug === slug);
      if (!selected) continue;
      const available = api.availableSpecimenTopics(definition, selected.id);
      assert.equal(available.includes('ct'), false, `${scope}/${slug}: no invented CT topic`);
      assert.equal(api.makeSpecimenLink(definition, { selectedId: selected.id, view: 'anterior', topic: 'ct' }), null);
      for (const topic of topics) {
        assert(available.includes(topic), `${scope}/${slug}/${topic}: actual availability`);
        const href = api.makeSpecimenLink(definition, { selectedId: selected.id, view: 'anterior', topic });
        assert(href, `${scope}/${slug}/${topic}: actual link offered`);
        const params = Object.fromEntries(new URL(href, 'https://atlas.example').searchParams);
        const result = api.resolveSpecimenLink(api.parseSpecimenLink(params));
        assert.equal(result.status, 'ready');
        assert.equal(result.topic, topic);
        assert.equal(result.selectedId, selected.id);
        assert.deepEqual(api.resolveSpecimenLink(api.parseSpecimenLink({ ...params, specimenTopic: 'ct' })), { status: 'rejected', reason: 'topic-unavailable' });
        if (scope === 'whole') wholeAdditions++;
      }
    }
  }
  assert.equal(wholeAdditions, 7, 'All seven additions actually link in the complete source scope');
});

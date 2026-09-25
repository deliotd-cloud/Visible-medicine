import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { contentContext } from './content-contract-tools.mjs';
import { beforeLacrimalDrainageImaging } from './lacrimal-drainage-imaging-history.mjs';
import pins from '../content/lacrimal-drainage-imaging-pins.json' with { type: 'json' };
import transition from '../content/lacrimal-drainage-imaging.transition.json' with { type: 'json' };

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const { api, catalog } = await contentContext();
const display = api.bodyDisplayCatalog(catalog);
const before = beforeLacrimalDrainageImaging(api);
const topics = ['ct', 'mri'];
const pinned = new Set(pins.entries.flatMap(entry => topics.map(topic => entry.identity.id + '|' + topic)));
const snapshot = source => ({
  body: display.structures.map(structure => ({
    id: structure.id,
    sections: Object.fromEntries(api.contentTabs.map(topic => [topic, source.bodyLesson(structure, topic)])),
  })),
  shoulder: source.structures,
  recipes: source.dissectionProfiles,
});

test('actual current catalog rolls back exactly twelve source-bound CT/MRI lessons', () => {
  assert.equal(pins.entries.length, 6);
  assert.equal(pinned.size, 12);
  assert.equal(display.structures.length * api.contentTabs.length - pinned.size, 9924);
  const expected = snapshot(api);
  for (const [i, entry] of pins.entries.entries()) {
    assert.deepEqual(display.structures.find(s => s.id === entry.identity.id), entry.identity);
    assert.equal(transition.entries[i].id, entry.identity.id);
    for (const topic of topics) {
      assert.equal(hash(api.bodyLesson(entry.identity, topic)), transition.entries[i].sections[topic]);
      assert.equal(entry.previous[topic].readiness, 'pending');
      expected.body.find(s => s.id === entry.identity.id).sections[topic] = entry.previous[topic];
      const restored = before.bodyLesson(structuredClone(entry.identity), topic);
      assert.deepEqual(restored, entry.previous[topic]);
      const { readiness: _readiness, ...content } = entry.previous[topic];
      assert.deepEqual(before.bodyContent(structuredClone(entry.identity), topic), content);
    }
  }
  assert.deepEqual(snapshot(before), expected);
  assert.equal(before.structures, api.structures);
  assert.equal(before.dissectionProfiles, api.dissectionProfiles);
  assert.equal(before.bodyDisplayCatalog, api.bodyDisplayCatalog);
  assert.deepEqual(before.bodyDisplayCatalog(catalog), display);
  assert.equal(before.contentTabs, api.contentTabs);
  assert.equal(beforeLacrimalDrainageImaging(before), before);
});

test('unrelated calls pass through and restored lessons are detached copies', () => {
  const entry = pins.entries[0];
  const foreign = structuredClone(entry.identity);
  foreign.name += ' foreign';
  const unrelated = { id: 'vm:test:unrelated' };
  const foreignLesson = { readiness: 'draft', body: 'foreign source' };
  const unrelatedLesson = { readiness: 'draft', body: 'unrelated topic' };
  const tracking = {
    ...api,
    bodyLesson(structure, topic) {
      if (structure === foreign && topic === 'ct') return foreignLesson;
      if (structure === unrelated && topic === 'anatomy') return unrelatedLesson;
      return api.bodyLesson(structure, topic);
    },
    bodyContent(structure, topic) {
      if (structure === foreign && topic === 'ct') return foreignLesson;
      if (structure === unrelated && topic === 'anatomy') return unrelatedLesson;
      return api.bodyContent(structure, topic);
    },
  };
  const historical = beforeLacrimalDrainageImaging(tracking);
  assert.equal(historical.bodyLesson(foreign, 'ct'), foreignLesson);
  assert.equal(historical.bodyLesson(unrelated, 'anatomy'), unrelatedLesson);
  assert.deepEqual(historical.bodyLesson(entry.identity, 'anatomy'), api.bodyLesson(entry.identity, 'anatomy'));
  const copy = historical.bodyLesson(entry.identity, 'ct');
  assert.notEqual(copy, entry.previous.ct);
  copy.body = 'mutated copy';
  assert.deepEqual(historical.bodyLesson(entry.identity, 'ct'), entry.previous.ct);
});

test('all-prior state is accepted; mixed and unrecorded lesson states are rejected', () => {
  const priorApi = {
    ...api,
    bodyLesson(structure, topic) {
      const entry = pins.entries.find(e => e.identity.id === structure.id);
      return entry && topics.includes(topic) ? structuredClone(entry.previous[topic]) : api.bodyLesson(structure, topic);
    },
  };
  assert.equal(beforeLacrimalDrainageImaging(priorApi), priorApi);
  const target = pins.entries[0];
  const change = replacement => ({
    ...api,
    bodyLesson(structure, topic) {
      return structure.id === target.identity.id && topic === 'ct'
        ? replacement
        : api.bodyLesson(structure, topic);
    },
  });
  assert.throws(() => beforeLacrimalDrainageImaging(change(target.previous.ct)), /Mixed lacrimal drainage imaging history/);
  const current = api.bodyLesson(target.identity, 'ct');
  assert.throws(() => beforeLacrimalDrainageImaging(change({ ...current, body: current.body + ' foreign' })), /Unrecorded lacrimal drainage imaging teaching/);
  assert.throws(() => beforeLacrimalDrainageImaging(change({ ...current, note: current.note + ' foreign' })), /Unrecorded lacrimal drainage imaging teaching/);
});

test('profiles-only API is untouched', () => {
  const profilesOnly = { dissectionProfiles: api.dissectionProfiles };
  assert.equal(beforeLacrimalDrainageImaging(profilesOnly), profilesOnly);
});

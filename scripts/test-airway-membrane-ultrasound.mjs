import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {airwayMembraneUltrasoundLesson as lesson} from '../lib/airway-membrane-ultrasound.ts';
const pins = JSON.parse(fs.readFileSync(new URL('../content/airway-membrane-ultrasound-pins.json', import.meta.url)));
const snapshot = JSON.parse(fs.readFileSync(new URL('../content/regional-teaching/head-neck.json', import.meta.url)));

test('three exact membrane selections receive sourced drafts with their own identity', () => {
  assert.deepEqual(pins.entries.map(e => e.identity.fmaId).sort(), ['FMA55133', 'FMA55134', 'FMA55237']);
  for (const e of pins.entries) {
    assert.equal(e.previous.readiness, 'pending');
    const shown = lesson(e.identity, 'ultrasound');
    assert.equal(shown.readiness, 'draft');
    assert(shown.title.startsWith(e.identity.name + ' ·'));
    assert.equal(e.identity.validation.anatomicalReview, false);
    assert(shown.citations.every(url => new URL(url).protocol === 'https:'));
    assert.match(shown.note, /radiologist review/);
    assert.match(shown.bullets.join(' '), e.family === 'thyrohyoid' ? /does not validate their separate/ : /does not establish an independently visible/);
  }
});

test('changed source hashes, side, geometry, licence or approval cannot inherit these drafts', () => {
  for (const e of pins.entries) for (const mutate of [
    s => s.id += '-different', s => s.fmaId = 'FMA0', s => s.laterality = 'unspecified',
    s => s.sources[0].sha256 = '0'.repeat(64), s => s.sources.push({...s.sources[0]}),
    s => s.bounds.min[0] += 0.01, s => s.validation.anatomicalReview = true,
    s => s.provenance.license = 'unknown', s => s.name += ' changed',
  ]) {
    const changed = structuredClone(e.identity); mutate(changed);
    assert.equal(lesson(changed, 'ultrasound'), undefined);
  }
});

test('other structures and modalities stay outside the addition', () => {
  for (const e of snapshot.entries) {
    const s = JSON.parse(e.identity);
    for (const tab of Object.keys(e.lessons)) {
      if (tab !== 'ultrasound' || !pins.entries.some(p => p.identity.id === s.id))
        assert.equal(lesson(s, tab), undefined);
    }
  }
});

test('current generated lessons match the selected source; returned arrays cannot mutate the shared content', () => {
  for (const e of pins.entries) {
    const row = snapshot.entries.find(r => JSON.parse(r.identity).id === e.identity.id);
    assert.deepEqual(JSON.parse(row.identity), e.identity);
    assert.deepEqual(row.lessons.ultrasound, lesson(e.identity, 'ultrasound'));
    const original = lesson(e.identity, 'ultrasound');
    const mutated = lesson(e.identity, 'ultrasound');
    mutated.bullets.push('foreign'); mutated.citations.push('foreign');
    assert.deepEqual(lesson(e.identity, 'ultrasound'), original);
    const reorder = v => Array.isArray(v) ? v.map(reorder) : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).reverse().map(([k,x]) => [k,reorder(x)])) : v;
    assert.deepEqual(lesson(reorder(e.identity), 'ultrasound'), original);
  }
});

// Offline editorial projection only. Never maps assets or clinical approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import pins from '../content/laryngeal-framework-imaging-pins.json' with { type: 'json' };
import transition from '../content/laryngeal-framework-imaging-transition.json' with { type: 'json' };
import { beforeOrbitalNerveMri } from './orbital-nerve-mri-history.mjs';

export const frameworkHash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeLaryngealFrameworkImaging(api) {
  api = beforeOrbitalNerveMri(api);
  if (typeof api.bodyLesson !== 'function') return api;
  assert.equal(frameworkHash(pins), '51d9e4cbc5d585ff437e5ebc340c622030c9b2a736d94984fd40fed96868e3bf');
  assert.equal(frameworkHash(transition), '769ebae746862e728e74f5cba82e3d4ccf5df3a6c0efd416de89c550876c7587');
  assert.equal(transition.pinsHash, frameworkHash(pins));
  assert.equal(transition.parentCommit, pins.parentCommit);
  const records = new Map(transition.entries.map(e => [e.id + '|' + e.tab, e]));
  assert.equal(records.size, 8);assert.equal(transition.entries.length, 8);
  const previous = new Map();let old = 0, current = 0;
  for (const e of pins.entries) for (const tab of e.topics) {
    const key = e.identity.id + '|' + tab, record = records.get(key);
    assert(record);assert.equal(record.previousHash, frameworkHash(e.previous[tab]));
    const now = api.bodyLesson(e.identity, tab);
    if (isDeepStrictEqual(now, e.previous[tab])) old++;
    else { assert.equal(frameworkHash(now), record.currentHash, 'Unrecorded laryngeal framework teaching');current++; }
    previous.set(key, { identity: e.identity, lesson: e.previous[tab] });
  }
  assert(old === 8 || current === 8, 'Mixed laryngeal framework history');
  if (old === 8) return api;
  const bodyLesson = (structure, tab) => {
    const e = previous.get(structure.id + '|' + tab);
    return e && isDeepStrictEqual(structure, e.identity) ? structuredClone(e.lesson) : api.bodyLesson(structure, tab);
  };
  return { ...api, bodyLesson, bodyContent(s, t) { const { readiness: _readiness, ...shown } = bodyLesson(s, t);return shown; } };
}

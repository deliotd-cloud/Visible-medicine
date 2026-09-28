// Offline reconstruction only. Never imported by runtime or approval storage.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import transition from '../content/shoulder-soft-tissue-xray-transition.json' with { type: 'json' };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(createHash('sha256').update(JSON.stringify(transition, null, 2) + '\n').digest('hex'),
  '865cefa685e1cf32fab92d46c204c1b979028939343353a71a055dae9d43822a');
export function shoulderBeforeSoftTissueXray(structures) {
  if (!structures) return structures;
  const result = structuredClone(structures);
  let previous = 0, current = 0;
  for (const entry of transition.entries) {
    const structure = result.find(s => s.id === entry.id);
    assert(structure, 'Missing shoulder structure in history');
    const actual = hash(structure.sections.xray);
    if (actual === hash(entry.previous)) previous++;
    else { assert.equal(actual, entry.currentHash, 'Unrecorded shoulder X-ray edit'); current++; }
    structure.sections.xray = structuredClone(entry.previous);
  }
  assert(previous === 6 || current === 6, 'Mixed shoulder X-ray history');
  return result;
}

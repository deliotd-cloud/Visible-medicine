import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { sceneLabelIds, sceneLabelAnchors } from '../lib/scene-labels.ts';
import { closeUpLabelAnchor } from '../lib/close-up-labels.ts';

const items = Array.from({ length: 1042 }, (_, i) => ({
  id: `structure-${i}`,
}));
const ids = sceneLabelIds(
  items[500].id,
  items.map((s) => s.id),
  items.map((s) => s.id),
  false,
);
let calls = 0;
const resolve = (item) => {
  calls++;
  return item.id;
};
assert.equal(sceneLabelAnchors(false, ids, items, resolve).size, 0);
assert.equal(
  calls,
  0,
  'No geometry work when labels are disabled or exam mode suppresses them',
);
assert.equal(sceneLabelAnchors(true, [], items, resolve).size, 0);
assert.equal(calls, 0);
const anchors = sceneLabelAnchors(true, ids, items, resolve);
assert.equal(
  calls,
  8,
  'Only eight requested surfaces, not all 1,042, are resolved',
);
assert.deepEqual([...anchors.keys()].sort(), [...ids].sort());
assert.equal(anchors.get(items[500].id), items[500].id);
calls = 0;
const focused = sceneLabelIds(
  items[500].id,
  ids,
  items.map((s) => s.id),
  true,
);
assert.equal(sceneLabelAnchors(true, focused, items, resolve).size, 1);
assert.equal(calls, 1);
calls = 0;
sceneLabelAnchors(true, ['absent', items[0].id, items[0].id], items, resolve);
assert.equal(
  calls,
  1,
  'Missing IDs and repeated requests do not scan other surfaces',
);
const geometry = new BufferGeometry();
geometry.setAttribute(
  'position',
  new Float32BufferAttribute([0, 0, 0, 1, 1, 1, 3, 3, 3], 3),
);
const original = [5, 5, 5],
  bounds = { min: [-1, -1, -1], max: [2, 2, 2] };
const expected = closeUpLabelAnchor(geometry, original, bounds);
const actual = sceneLabelAnchors(true, [items[0].id], items, () =>
  closeUpLabelAnchor(geometry, original, bounds),
);
assert.deepEqual(
  actual.get(items[0].id),
  expected,
  'The original source-vertex anchor algorithm is unchanged',
);
assert.deepEqual(
  sceneLabelAnchors(true, [items[0].id], items, () =>
    closeUpLabelAnchor(geometry, original),
  ).get(items[0].id),
  original,
);
assert.equal(
  sceneLabelAnchors(true, [items[0].id], items, () => null).get(items[0].id),
  null,
);
geometry.dispose();
const source = await readFile('app/body-scene.tsx', 'utf8');
assert.match(source, /sceneLabelAnchors\(\s*props.labels && !props.exam/);
assert.match(
  source,
  /closeUpLabelAnchor\(geometry, structure.anchor, props.cameraBounds\)/,
);
console.log(
  'Label work: 1,042 candidates -> 8 resolver calls (focus: 1; hidden/exam: 0). Original source-vertex anchors, missing IDs and null geometry preserved. Operation counts, not browser timing.',
);

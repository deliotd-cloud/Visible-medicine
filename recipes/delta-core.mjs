import assert from 'node:assert/strict';

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const hashPattern = /^[0-9a-f]{64}$/;

function checkTeachingRows(rows, label) {
  assert.ok(Array.isArray(rows) && rows.length > 0, `${label} must be a nonempty array`);
  const keys = new Set();
  for (const [index, row] of rows.entries()) {
    assert.ok(row && typeof row === 'object' && !Array.isArray(row), `${label}[${index}] must be an object`);
    assert.equal(typeof row.region, 'string', `${label}[${index}].region must be a string`);
    assert.ok(typeof row.identity === 'string' && row.identity.length > 0,
      `${label}[${index}].identity must be a nonempty string`);
    assert.equal(typeof row.topic, 'string', `${label}[${index}].topic must be a string`);
    assert.ok(own(row, 'lesson'), `${label}[${index}].lesson is required`);
    const key = JSON.stringify([row.region, row.identity, row.topic]);
    assert.ok(!keys.has(key), `${label} has a duplicate region/identity/topic at row ${index}`);
    keys.add(key);
  }
}

export function verifyTeachingDelta(expectedRows, actualRows) {
  checkTeachingRows(expectedRows, 'expectedRows');
  checkTeachingRows(actualRows, 'actualRows');
  assert.deepStrictEqual(actualRows, expectedRows, 'teaching rows differ');
  return { lessons: expectedRows.length };
}

function checkPin(pin, label) {
  assert.ok(pin && typeof pin === 'object' && !Array.isArray(pin), `${label} must be an object`);
  assert.deepStrictEqual(Object.keys(pin).sort(), ['sha256', 'structureId'], `${label} has unexpected fields`);
  assert.ok(typeof pin.structureId === 'string' && pin.structureId.length > 0,
    `${label}.structureId must be a nonempty string`);
  assert.ok(typeof pin.sha256 === 'string' && hashPattern.test(pin.sha256),
    `${label}.sha256 must be lowercase 64-character hex`);
}

function checkReport(report, label) {
  assert.ok(report && typeof report === 'object' && !Array.isArray(report), `${label} must be an object`);
  for (const field of ['schema', 'scope', 'algorithm', 'evidenceFields', 'pins']) {
    assert.ok(own(report, field), `${label}.${field} is required`);
  }
  assert.ok(Array.isArray(report.pins) && report.pins.length > 0, `${label}.pins must be nonempty`);
  const ids = new Set();
  report.pins.forEach((pin, index) => {
    checkPin(pin, `${label}.pins[${index}]`);
    assert.ok(!ids.has(pin.structureId), `${label} has duplicate structureId ${pin.structureId}`);
    ids.add(pin.structureId);
  });
}

function metadata(report) {
  const { pins, ...rest } = report;
  return rest;
}

export function verifyDisplayPinDelta({ baseline, actual, changedStructureIds, exactChangedPins = [] }) {
  checkReport(baseline, 'baseline');
  checkReport(actual, 'actual');
  assert.deepStrictEqual(metadata(actual), metadata(baseline), 'display pin metadata differs');
  assert.equal(actual.pins.length, baseline.pins.length, 'display pin count differs');
  assert.deepStrictEqual(actual.pins.map(pin => pin.structureId), baseline.pins.map(pin => pin.structureId),
    'display pin IDs or order differ');

  assert.ok(Array.isArray(changedStructureIds), 'changedStructureIds must be an array');
  const changed = new Set();
  const known = new Set(baseline.pins.map(pin => pin.structureId));
  for (const id of changedStructureIds) {
    assert.ok(typeof id === 'string' && known.has(id), `changed structureId is absent: ${id}`);
    assert.ok(!changed.has(id), `duplicate changed structureId: ${id}`);
    changed.add(id);
  }
  assert.ok(Array.isArray(exactChangedPins), 'exactChangedPins must be an array');
  const exact = new Set();
  for (const [index, pin] of exactChangedPins.entries()) {
    checkPin(pin, `exactChangedPins[${index}]`);
    assert.ok(changed.has(pin.structureId), `exact pin is outside changed IDs: ${pin.structureId}`);
    assert.ok(!exact.has(pin.structureId), `duplicate exact pin: ${pin.structureId}`);
    exact.add(pin.structureId);
    const actualPin = actual.pins.find(candidate => candidate.structureId === pin.structureId);
    assert.equal(actualPin.sha256, pin.sha256, `exact pin differs: ${pin.structureId}`);
  }
  for (let index = 0; index < baseline.pins.length; index++) {
    const before = baseline.pins[index];
    const after = actual.pins[index];
    assert.equal(after.sha256 !== before.sha256, changed.has(before.structureId),
      `unexpected or stale pin change: ${before.structureId}`);
  }
  return {
    worksheets: baseline.pins.length,
    changed: changed.size,
    unchanged: baseline.pins.length - changed.size,
    exactChangedPins: exact.size,
  };
}

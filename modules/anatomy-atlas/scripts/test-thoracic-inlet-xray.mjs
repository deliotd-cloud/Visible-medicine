import assert from 'node:assert/strict';
import pins from '../content/thoracic-branch-imaging-pins.json' with {type:'json'};
import {thoracicInletXrayLesson} from '../lib/thoracic-inlet-xray.ts';
import {thoracicInletXrayTopics, thoracicInletXrayReferences} from '../content/thoracic-inlet-xray.ts';

const expected = new Map([
  ['FMA3953', ['right', 'right-subclavian-artery', 'Right subclavian artery']],
  ['FMA4694', ['left', 'left-subclavian-artery', 'Left subclavian artery']],
  ['FMA4755', ['right', 'right-subclavian-vein', 'Right subclavian vein']],
  ['FMA4763', ['left', 'left-subclavian-vein', 'Left subclavian vein']],
  ['FMA4751', ['right', 'right-brachiocephalic-vein', 'Right brachiocephalic vein']],
  ['FMA4761', ['left', 'left-brachiocephalic-vein', 'Left brachiocephalic vein']],
]);
assert.deepEqual(Object.keys(thoracicInletXrayTopics).sort(), [...expected.keys()].sort());
const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
const objects = (value, path = []) => value === null || typeof value !== 'object'
  ? [] : [path, ...Object.entries(value).flatMap(([key, child]) => objects(child, [...path, key]))];
let selected = 0, rejected = 0, unaffected = 0;
for (const {identity} of pins.entries) {
  const match = expected.get(identity.fmaId);
  if (!match) {assert.equal(thoracicInletXrayLesson(identity, 'xray'), undefined); unaffected++; continue;}
  selected++;
  assert.equal(identity.id, `vm:anatomy:body:thorax:${match[0]}:vessel:${match[1]}`);
  assert.equal(identity.name, match[2]);
  assert.equal(identity.sourceName, match[2].toLowerCase());
  assert.equal(identity.laterality, match[0]);
  assert.equal(identity.bundle, 'thorax-vessels-recovery');
  const lesson = thoracicInletXrayLesson(identity, 'xray');
  assert.equal(lesson.readiness, 'draft');
  assert(lesson.title.startsWith(`${identity.name} ·`));
  if (identity.fmaId === 'FMA3953') {
    assert.match(lesson.body, /right vascular pedicle border.*SVC/);
    assert.match(lesson.body, /Do not mirror.*right subclavian artery/);
  } else if (identity.fmaId === 'FMA4694') {
    assert.match(lesson.body, /left vascular pedicle border.*left subclavian artery origin/);
  } else {
    assert.match(lesson.body, /internal jugular and subclavian.*brachiocephalic.*SVC.*right mediastinum/);
    assert.match(lesson.bullets[0], /silhouette is not the vessel wall or proof of safe placement/);
    assert.match(lesson.bullets[0], match[0] === 'left' ? /left-sided.*may.*shallower.*right-sided SVC/ : /may pass below the clavicle.*curve toward the SVC/);
  }
  assert.deepEqual(lesson.citations, [...thoracicInletXrayTopics[identity.fmaId].references]);
  assert.match(lesson.note, /review pending.*source revision/);
  assert.match(lesson.note, /sign-off.*revision and scope/);
  assert.match(lesson.note, /Case, Atlas and paid-lecture access remain independent/);
  assert(lesson.bullets.some(text => /Reassemble to 0%/.test(text)));
  assert(lesson.bullets.some(text => /not a radiograph.*no patient measurement.*registration/.test(text)));
  for (const tab of ['anatomy', 'ct', 'mri', 'ultrasound', 'pathology', 'function', 'clinical', 'quiz', 'foreign']) {
    assert.equal(thoracicInletXrayLesson(identity, tab), undefined); unaffected++;
  }
  const saved = structuredClone(lesson);
  lesson.bullets.push('foreign'); lesson.citations.push('foreign');
  assert.deepEqual(thoracicInletXrayLesson(identity, 'xray'), saved);
  for (const path of leaves(identity)) {
    const changed = structuredClone(identity); let cursor = changed;
    for (const key of path.slice(0, -1)) cursor = cursor[key];
    const key = path.at(-1), value = cursor[key];
    cursor[key] = typeof value === 'number' ? value + .01 : typeof value === 'boolean' ? !value : `${value}-foreign`;
    assert.equal(thoracicInletXrayLesson(changed, 'xray'), undefined); rejected++;
  }
  for (const path of objects(identity)) {
    const changed = structuredClone(identity); let cursor = changed;
    for (const key of path) cursor = cursor[key];
    if (Array.isArray(cursor)) cursor.push('foreign'); else cursor.foreign = true;
    assert.equal(thoracicInletXrayLesson(changed, 'xray'), undefined); rejected++;
  }
}
assert.equal(selected, 6);
const sourceWords = {};
for (const url of Object.values(thoracicInletXrayReferences)) {
  const texts = new Set();
  for (const topic of Object.values(thoracicInletXrayTopics)) if (topic.references.includes(url)) {
    texts.add(topic.body); texts.add(topic.cue);
  }
  const count = [...texts].join(' ').split(/\s+/).filter(Boolean).length;
  assert(count <= 140, `${url}: ${count} source-derived words exceeds cap`);
  sourceWords[url] = count;
}
console.log(JSON.stringify({selected, rejected, unaffected, sourceWords, clinicalApproval: false}));

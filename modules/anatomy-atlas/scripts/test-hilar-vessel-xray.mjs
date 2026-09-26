import assert from 'node:assert/strict';
import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import {hilarVesselXrayLesson} from '../lib/hilar-vessel-xray.ts';
import {hilarVesselXrayTopics, hilarVesselXrayReferences, hilarVesselXrayVascularCue} from '../content/hilar-vessel-xray.ts';

// Independent, exact named-source expectations; runtime topic keys cannot define coverage.
const expected = new Map([
  ['FMA50872', ['right', 'right-pulmonary-artery']],
  ['FMA50873', ['left', 'left-pulmonary-artery']],
  ['FMA49914', ['right', 'right-superior-pulmonary-vein']],
  ['FMA49916', ['left', 'left-superior-pulmonary-vein']],
  ['FMA49911', ['right', 'right-inferior-pulmonary-vein']],
  ['FMA49913', ['left', 'left-inferior-pulmonary-vein']],
]);
assert.deepEqual(Object.keys(hilarVesselXrayTopics).sort(), [...expected.keys()].sort());
const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
let selected = 0, rejected = 0, unaffected = 0;
for (const {identity} of pins.entries) {
  const match = expected.get(identity.fmaId);
  if (!match) {assert.equal(hilarVesselXrayLesson(identity, 'xray'), undefined); unaffected++; continue;}
  selected++;
  assert.equal(identity.id, `vm:anatomy:body:thorax:${match[0]}:vessel:${match[1]}`);
  assert.equal(identity.laterality, match[0]);
  assert.equal(identity.bundle, 'thorax-vessels-recovery');
  const lesson = hilarVesselXrayLesson(identity, 'xray');
  assert.equal(lesson.readiness, 'draft');
  assert(lesson.title.startsWith(`${identity.name} ·`));
  if (identity.fmaId === 'FMA50872') {
    assert.match(lesson.body, /right pulmonary artery.*in front of the right main bronchus/);
    assert(lesson.citations.includes(hilarVesselXrayReferences.hilarAnatomy));
  } else if (identity.fmaId === 'FMA50873') {
    assert.match(lesson.body, /left pulmonary artery.*over the left main bronchus/);
    assert.match(lesson.body, /commonly/);
    assert(lesson.citations.includes(hilarVesselXrayReferences.hilarAnatomy));
  } else {
    assert.match(lesson.body, /horizontal.*left atrium/);
    assert.match(lesson.body, /lower-lobe arteries.*vertically/);
    assert(lesson.bullets.some(text => /do not establish.*separately traceable.*drainage territory/.test(text)));
  }
  assert(lesson.citations.includes(hilarVesselXrayReferences.hilarVessels));
  assert.match(lesson.note, /review pending.*source revision/);
  assert.match(lesson.note, /sign-off.*revision and scope/);
  assert.match(lesson.note, /Case, Atlas and paid-lecture access remain independent/);
  assert(lesson.bullets.some(text => /Reassemble to 0%/.test(text)));
  assert(lesson.bullets.some(text => /not a radiograph.*no patient measurement.*registration/.test(text)));
  for (const tab of ['anatomy', 'ct', 'mri', 'ultrasound', 'pathology', 'function', 'clinical', 'quiz', 'foreign']) {
    assert.equal(hilarVesselXrayLesson(identity, tab), undefined); unaffected++;
  }
  const saved = structuredClone(lesson);
  lesson.bullets.push('foreign'); lesson.citations.push('foreign');
  assert.deepEqual(hilarVesselXrayLesson(identity, 'xray'), saved);
  for (const path of leaves(identity)) {
    const changed = structuredClone(identity); let cursor = changed;
    for (const key of path.slice(0, -1)) cursor = cursor[key];
    const key = path.at(-1), value = cursor[key];
    cursor[key] = typeof value === 'number' ? value + .01 : typeof value === 'boolean' ? !value : `${value}-foreign`;
    assert.equal(hilarVesselXrayLesson(changed, 'xray'), undefined); rejected++;
  }
  const extra = structuredClone(identity); extra.foreign = true;
  assert.equal(hilarVesselXrayLesson(extra, 'xray'), undefined); rejected++;
}
assert.equal(selected, 6);
// Conservatively count whole unique body/cue strings, even unsourced model limitations.
const sourceWords = {};
for (const url of Object.values(hilarVesselXrayReferences)) {
  const texts = new Set(url === hilarVesselXrayReferences.hilarVessels ? [hilarVesselXrayVascularCue] : []);
  for (const topic of Object.values(hilarVesselXrayTopics)) if (topic.references.includes(url)) {
    texts.add(topic.body); texts.add(topic.cue);
  }
  const count = [...texts].join(' ').split(/\s+/).filter(Boolean).length;
  assert(count <= 140, `${url}: ${count} source-derived words exceeds cap`);
  sourceWords[url] = count;
}
console.log(JSON.stringify({selected, rejected, unaffected, sourceWords, clinicalApproval: false}));

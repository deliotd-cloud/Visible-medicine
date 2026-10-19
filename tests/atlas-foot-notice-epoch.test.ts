import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { preFootNotice, preFootNoticeBytes, preFootWebsiteEpoch,
  sourceFootNoticeBytes, withoutFootNotice } from './atlas-foot-notice-history.ts';
import { withoutMidfootNotice } from './atlas-foot-ultrasound-notice-history.ts';
import { withoutShoulderGirdleArterialNotice } from './atlas-shoulder-girdle-ultrasound-notice-history.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const exactBytes = (actual: Buffer, expected: Buffer, label: string) => {
  assert.equal(actual.length, expected.length, `${label}: byte length`);
  assert.equal(sha(actual), sha(expected), `${label}: SHA-256`);
  assert.deepEqual(actual, expected, label);
};
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const saved = (path: string) => execFileSync('git', ['show', `${preFootWebsiteEpoch}:${path}`], {
  maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const notice = 'LICENSES/THIRD_PARTY_NOTICES.md';
const footEpochRevision = 'c5c99ba11e6533d306587e71f5fc2854d882fbd6';
const currentSourceRevision = CURRENT_ATLAS_REVISION;
const priorSourceRevision = 'a1cb14f05b3070b8553e85e3596f634b2bf36a5d';
const atlasSource = currentAtlasDeliveryRoot();
const sourceAt = (revision: string) => execFileSync('git', ['show', `${revision}:${notice}`], {
  cwd: atlasSource, maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const currentSourceNoticeBytes = sourceAt(currentSourceRevision);
const footEpochNoticeBytes = sourceAt(footEpochRevision);
const priorSourceNoticeBytes = sourceAt(priorSourceRevision);
const title = Buffer.from('# Third-party notices\n\n');
const toeHeading = Buffer.from('## Toe-phalanx ultrasound teaching (4 October 2026)\n');
const nextHeading = Buffer.from('## Deep-brain teaching (3 October 2026)\n');
const toeSectionSha256 = '93999b558889cd65f4edf95b7903b90b35a3a6a5a403a8abdb253e02feaf7e78';
const footAppendix = sourceFootNoticeBytes.toString().replaceAll('\r', '').slice(preFootNotice.length);
function assertCurrentFootSection(bytes: Buffer): void {
  const text = bytes.toString().replaceAll('\r', '');
  assert.equal(text.indexOf(footAppendix), text.lastIndexOf(footAppendix), 'Duplicate foot appendix');
  assert(text.includes(footAppendix), 'Original complete foot appendix missing');
  assert.equal(sha(Buffer.from(footAppendix)), 'd8b0616fa0f847300666bd698efe385464e961d54e35ac0b389487bcc230cb5f');
}

function withoutToeNotice(bytes: Buffer): Buffer {
  assert.deepEqual(bytes.subarray(0, title.length), title, 'Source notice title changed');
  const start = bytes.indexOf(toeHeading);
  assert.equal(start, title.length, 'Toe notice missing or moved');
  assert.equal(bytes.indexOf(toeHeading, start + toeHeading.length), -1, 'Duplicate toe notice');
  const end = bytes.indexOf(nextHeading, start + toeHeading.length);
  assert(end > start, 'Toe notice boundary missing');
  assert.equal(sha(bytes.subarray(start, end)), toeSectionSha256, 'Toe notice changed');
  const recovered = Buffer.concat([bytes.subarray(0, start), bytes.subarray(end)]);
  exactBytes(recovered, priorSourceNoticeBytes, 'Complete pre-toe notice changed');
  return recovered;
}

test('foot notice is one exact terminal appendix to the complete pre-foot epoch', () => {
  const foot = sourceFootNoticeBytes.toString();
  assert.equal(withoutFootNotice(foot), preFootNotice);
  assert.match(foot, /No figures, article prose, scans, ultrasound frames, tables, PDFs, meshes or\s+datasets are imported/);
  assert.match(foot, /No new dependency, font, texture, model, paid service or mandatory licence fee/);
  const appendix = foot.replaceAll('\r', '').slice(preFootNotice.length);
  assert.throws(() => withoutFootNotice(foot + appendix), /Duplicate foot notice/);
  assert.throws(() => withoutFootNotice(foot.replace('Eight original drafts', 'Nine original drafts')), /Altered or incomplete foot appendix/);
  assert.throws(() => withoutFootNotice(foot.slice(0, -20)), /Altered or incomplete foot appendix/);
  assert.throws(() => withoutFootNotice('x' + foot), /Altered or moved preceding notice/);
  const historical = footEpochNoticeBytes;
  exactBytes(readFileSync('atlas-review/' + notice), currentSourceNoticeBytes, 'Review imports exact committed current Atlas notice bytes');
  assertCurrentFootSection(currentSourceNoticeBytes);
  const liveNotice = currentSourceNoticeBytes.toString().replaceAll('\r', '');
  assert.throws(() => assertCurrentFootSection(Buffer.from(liveNotice.replace(footAppendix, footAppendix.replace('Eight original drafts', 'Nine original drafts')))), /Original complete foot appendix missing/);
  assert.throws(() => assertCurrentFootSection(Buffer.from(liveNotice + footAppendix)), /Duplicate foot appendix/);
  const postShoulder = withoutShoulderGirdleArterialNotice(historical);
  const toeCurrent = withoutMidfootNotice(postShoulder);
  const prior = withoutToeNotice(toeCurrent);
  exactBytes(prior.subarray(0, sourceFootNoticeBytes.length), sourceFootNoticeBytes, 'Complete foot epoch retained after toe section');
  assert.match(prior.subarray(sourceFootNoticeBytes.length).toString(), /^\n## Hand-bone ultrasound surface orientation — 4 October 2026\n/);
  const changed = Buffer.from(toeCurrent);
  changed[title.length + toeHeading.length + 10] ^= 1;
  assert.throws(() => withoutToeNotice(changed), /Toe notice changed/);
  const toeSection = toeCurrent.subarray(title.length, toeCurrent.indexOf(nextHeading, title.length));
  assert.throws(() => withoutToeNotice(Buffer.concat([title, toeSection, toeSection, toeCurrent.subarray(title.length + toeSection.length)])), /Duplicate toe notice/);
  assert.throws(() => withoutToeNotice(Buffer.concat([title, toeCurrent.subarray(title.length + toeSection.length), toeSection])), /Toe notice missing or moved/);

  const shoulderHeading = Buffer.from('## Shoulder-girdle arterial ultrasound teaching (4 October 2026)\n');
  const shoulderSection = historical.subarray(title.length, historical.indexOf(Buffer.from('## Midfoot ultrasound and hallux-note follow-up (4 October 2026)\n'), title.length));
  assert.deepEqual(shoulderSection.subarray(0, shoulderHeading.length), shoulderHeading);
  const changedShoulder = Buffer.from(historical);
  changedShoulder[title.length + shoulderHeading.length + 10] ^= 1;
  assert.throws(() => withoutShoulderGirdleArterialNotice(changedShoulder), /Shoulder-girdle notice changed/);
  assert.throws(() => withoutShoulderGirdleArterialNotice(postShoulder), /Shoulder-girdle notice missing or moved/);
  assert.throws(() => withoutShoulderGirdleArterialNotice(Buffer.concat([title, shoulderSection, shoulderSection, historical.subarray(title.length + shoulderSection.length)])), /Duplicate shoulder-girdle notice/);
  assert.throws(() => withoutShoulderGirdleArterialNotice(Buffer.concat([title, historical.subarray(title.length + shoulderSection.length), shoulderSection])), /Shoulder-girdle notice missing or moved/);

  const midfootHeading = Buffer.from('## Midfoot ultrasound and hallux-note follow-up (4 October 2026)\n');
  const midfootSection = postShoulder.subarray(title.length, postShoulder.indexOf(toeHeading, title.length));
  assert.deepEqual(midfootSection.subarray(0, midfootHeading.length), midfootHeading);
  const altered = Buffer.from(postShoulder);
  altered[title.length + midfootHeading.length + 10] ^= 1;
  assert.throws(() => withoutMidfootNotice(altered), /Midfoot notice changed/);
  assert.throws(() => withoutMidfootNotice(toeCurrent), /Midfoot notice missing or moved/);
  assert.throws(() => withoutMidfootNotice(Buffer.concat([title, midfootSection, midfootSection, postShoulder.subarray(title.length + midfootSection.length)])), /Duplicate midfoot notice/);
  assert.throws(() => withoutMidfootNotice(Buffer.concat([title, postShoulder.subarray(title.length + midfootSection.length), midfootSection])), /Midfoot notice missing or moved/);
  assert.match(midfootSection.toString(), /Savaşan et al\. \(2026\), declaring CC BY\s+with its exact version not independently established/);
  assert.match(midfootSection.toString(), /factual\s+reading only, not an asset\/adaptation grant/);
});

test('four runtimes and protected Review ship source-bound notices with intact dependency notices', () => {
  const review = json('atlas-review/manifest.json');
  assert.equal(review.revision, currentSourceRevision);
  const importedNotice = review.files.find((file: { path: string }) => file.path === notice);
  assert(importedNotice);
  assert.equal(importedNotice.sourceSha256, sha(currentSourceNoticeBytes));
  assert.equal(importedNotice.importedSha256, sha(readFileSync('atlas-review/' + notice)));

  for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
    const base = `public/atlas-runtime/${name}/`;
    const manifest = json(base + 'manifest.json');
    assert.equal(manifest.sourceCommit, currentSourceRevision);
    assert.equal(manifest.patientDataIncluded, false);
    assert.equal(manifest.clinicalApproved, false);
    const delivered = readFileSync(base + notice);
    exactBytes(delivered, currentSourceNoticeBytes, `${name}: exact source notice`);
    assertCurrentFootSection(delivered);
    const entry = manifest.files.find((file: { path: string }) => file.path === notice);
    assert(entry);
    assert.equal(delivered.length, entry.bytes);
    assert.equal(sha(delivered), entry.sha256);
    for (const path of ['bundled-dependencies.json', 'BUNDLED_NOTICES.txt'])
      exactBytes(readFileSync(base + path), saved(base + path), `${name}: dependency notice unchanged`);
    const prior = jsonFromSaved(base + 'manifest.json');
    const models: { path: string; bytes: number; sha256: string }[] =
      manifest.files.filter((file: { path: string }) => file.path.startsWith('models/'));
    assert.deepEqual(models,
      prior.files.filter((file: { path: string }) => file.path.startsWith('models/')), `${name}: model assets unchanged`);
    for (const model of models) {
      const bytes = readFileSync(base + model.path);
      assert.equal(bytes.length, model.bytes, `${name}: ${model.path} model size`);
      assert.equal(sha(bytes), model.sha256, `${name}: ${model.path} model bytes`);
    }
  }

  const viewerBase = 'public/atlas-review-viewer/';
  const viewer = json(viewerBase + 'manifest.json');
  assert.equal(viewer.sourceCommit, currentSourceRevision);
  assert.equal(viewer.personalRecordsIncluded, false);
  const viewerNotice = readFileSync(viewerBase + 'THIRD_PARTY_NOTICES.txt');
  const priorViewerNotice = saved(viewerBase + 'THIRD_PARTY_NOTICES.txt');
  const priorPrefix = Buffer.from(`# Clinical Review third-party notices\n\nAtlas source: 88cea927d48729769b96ad8fe680b0872b7e6687\n\n`);
  const currentPrefix = Buffer.from(`# Clinical Review third-party notices\n\nAtlas source: ${currentSourceRevision}\n\n`);
  assert.deepEqual(priorViewerNotice.subarray(0, priorPrefix.length), priorPrefix);
  exactBytes(priorViewerNotice.subarray(priorPrefix.length, priorPrefix.length + preFootNoticeBytes.length), preFootNoticeBytes, 'Original protected pre-foot notice');
  const oldDependencyTail = priorViewerNotice.subarray(priorPrefix.length + preFootNoticeBytes.length);
  exactBytes(viewerNotice, Buffer.concat([currentPrefix, currentSourceNoticeBytes, oldDependencyTail]), 'Current protected notice and dependency suffix');
  const entry = viewer.files.find((file: { path: string }) => file.path === 'THIRD_PARTY_NOTICES.txt');
  assert(entry);
  assert.equal(sha(viewerNotice), entry.sha256);
});

function jsonFromSaved(path: string) { return JSON.parse(saved(path).toString()); }

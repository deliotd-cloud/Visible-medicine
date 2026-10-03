import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { footSourceRevision, preFootNotice, preFootNoticeBytes, preFootWebsiteEpoch,
  sourceFootNoticeBytes, withoutFootNotice } from './atlas-foot-notice-history.ts';

const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const saved = (path: string) => execFileSync('git', ['show', `${preFootWebsiteEpoch}:${path}`], {
  maxBuffer: 32e6, windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const notice = 'LICENSES/THIRD_PARTY_NOTICES.md';

test('foot notice is one exact terminal appendix to the complete pre-foot epoch', () => {
  const current = readFileSync('atlas-review/' + notice);
  assert.deepEqual(current, sourceFootNoticeBytes, 'Review imports exact committed Atlas notice bytes');
  assert.equal(withoutFootNotice(current.toString()), preFootNotice);
  assert.match(current.toString(), /No figures, article prose, scans, ultrasound frames, tables, PDFs, meshes or\s+datasets are imported/);
  assert.match(current.toString(), /No new dependency, font, texture, model, paid service or mandatory licence fee/);
  const appendix = current.toString().replaceAll('\r', '').slice(preFootNotice.length);
  assert.throws(() => withoutFootNotice(current.toString() + appendix), /Duplicate foot notice/);
  assert.throws(() => withoutFootNotice(current.toString().replace('Eight original drafts', 'Nine original drafts')), /Altered or incomplete foot appendix/);
  assert.throws(() => withoutFootNotice(current.toString().slice(0, -20)), /Altered or incomplete foot appendix/);
  assert.throws(() => withoutFootNotice('x' + current.toString()), /Altered or moved preceding notice/);
});

test('four runtimes and protected Review ship source-bound notices with intact dependency notices', () => {
  const review = json('atlas-review/manifest.json');
  assert.equal(review.revision, footSourceRevision);
  const importedNotice = review.files.find((file: { path: string }) => file.path === notice);
  assert(importedNotice);
  assert.equal(importedNotice.sourceSha256, sha(sourceFootNoticeBytes));
  assert.equal(importedNotice.importedSha256, sha(readFileSync('atlas-review/' + notice)));

  for (const name of ['head-neck', 'shoulder', 'female-pelvis', 'lower-limb']) {
    const base = `public/atlas-runtime/${name}/`;
    const manifest = json(base + 'manifest.json');
    assert.equal(manifest.sourceCommit, footSourceRevision);
    assert.equal(manifest.patientDataIncluded, false);
    assert.equal(manifest.clinicalApproved, false);
    const delivered = readFileSync(base + notice);
    assert.deepEqual(delivered, sourceFootNoticeBytes, `${name}: exact source notice`);
    assert.equal(withoutFootNotice(delivered.toString()), preFootNotice);
    const entry = manifest.files.find((file: { path: string }) => file.path === notice);
    assert(entry);
    assert.equal(delivered.length, entry.bytes);
    assert.equal(sha(delivered), entry.sha256);
    for (const path of ['bundled-dependencies.json', 'BUNDLED_NOTICES.txt'])
      assert.deepEqual(readFileSync(base + path), saved(base + path), `${name}: dependency notice unchanged`);
    const prior = jsonFromSaved(base + 'manifest.json');
    assert.deepEqual(manifest.files.filter((file: { path: string }) => file.path.startsWith('models/')),
      prior.files.filter((file: { path: string }) => file.path.startsWith('models/')), `${name}: model assets unchanged`);
  }

  const viewerBase = 'public/atlas-review-viewer/';
  const viewer = json(viewerBase + 'manifest.json');
  assert.equal(viewer.sourceCommit, footSourceRevision);
  assert.equal(viewer.personalRecordsIncluded, false);
  const viewerNotice = readFileSync(viewerBase + 'THIRD_PARTY_NOTICES.txt');
  const priorViewerNotice = saved(viewerBase + 'THIRD_PARTY_NOTICES.txt');
  const priorPrefix = Buffer.from(`# Clinical Review third-party notices\n\nAtlas source: 88cea927d48729769b96ad8fe680b0872b7e6687\n\n`);
  const currentPrefix = Buffer.from(`# Clinical Review third-party notices\n\nAtlas source: ${footSourceRevision}\n\n`);
  assert.deepEqual(priorViewerNotice.subarray(0, priorPrefix.length), priorPrefix);
  assert.deepEqual(priorViewerNotice.subarray(priorPrefix.length, priorPrefix.length + preFootNoticeBytes.length), preFootNoticeBytes);
  const oldDependencyTail = priorViewerNotice.subarray(priorPrefix.length + preFootNoticeBytes.length);
  assert.deepEqual(viewerNotice, Buffer.concat([currentPrefix, sourceFootNoticeBytes, oldDependencyTail]));
  const entry = viewer.files.find((file: { path: string }) => file.path === 'THIRD_PARTY_NOTICES.txt');
  assert(entry);
  assert.equal(sha(viewerNotice), entry.sha256);
});

function jsonFromSaved(path: string) { return JSON.parse(saved(path).toString()); }

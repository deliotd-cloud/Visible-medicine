// One-time admission record. Existing transitions must never be overwritten.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const before = JSON.parse(
  await readFile('content/hip-imaging.before.json', 'utf8'),
);
const { api } = await contentContext();
const after = {
  sourceCommit: before.sourceCommit,
  entries: before.entries.map((e) => ({
    id: e.identity.id,
    sections: Object.fromEntries(
      before.tabs.map((t) => {
        const lesson = api.hipImagingLesson(e.identity, t);
        assert.deepEqual(lesson, api.bodyLesson(e.identity, t));
        assert.equal(lesson.readiness, 'draft');
        return [t, hash(lesson)];
      }),
    ),
  })),
};
const path = 'content/hip-imaging.transition.json';
await assert.rejects(access(path));
await writeFile(path, JSON.stringify(after, null, 2) + '\n');
console.log(
  JSON.stringify({
    before: hash(before),
    after: hash(after),
    pins: hash(
      JSON.parse(await readFile('content/hip-imaging-pins.json', 'utf8')),
    ),
  }),
);

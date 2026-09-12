import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext } from './content-contract-tools.mjs';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const pins = JSON.parse(
  await readFile('content/lower-arterial-imaging-pins.json'),
);
const { api } = await contentContext();
const record = {
  sourceCommit: pins.sourceCommit,
  entries: pins.entries.map((e) => ({
    id: e.identity.id,
    sections: Object.fromEntries(
      e.topics.map((t) => {
        const lesson = api.lowerArterialImagingLesson(e.identity, t);
        assert.equal(lesson.readiness, 'draft');
        assert.deepEqual(api.bodyLesson(e.identity, t), lesson);
        return [t, hash(lesson)];
      }),
    ),
  })),
};
const path = 'content/lower-arterial-imaging.transition.json',
  text = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), text);
else await writeFile(path, text, { flag: 'wx' });
console.log(
  JSON.stringify({
    pinHash: hash(pins),
    transitionHash: hash(record),
    previous: pins.previousAllLessonsAndRecipesHash,
  }),
);

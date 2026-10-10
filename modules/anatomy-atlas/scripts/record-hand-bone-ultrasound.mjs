import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
const pins = JSON.parse(readFileSync('content/hand-bone-ultrasound-pins.json'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.baseline, 'cdc6ad23ad5c3c13a2f6588019a057d0a063818f');
const compiled = await build({stdin: {contents: "export {handBoneUltrasoundLesson} from './lib/hand-bone-ultrasound';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, format: 'esm', platform: 'node'});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const record = {
  baseline: pins.baseline, sourcePinsHash: hash(pins),
  reason: 'Forty-six exact-source hand-bone ultrasound surface-orientation drafts in eleven families. Thumb anatomy remains separate from finger anatomy; no acoustic image, marrow/fracture assessment, model-to-patient registration or clinical approval.',
  entries: pins.entries.flatMap(({identity, previous}) => Object.keys(previous).map(tab => ({id: identity.id, fmaId: identity.fmaId, tab, draftHash: hash(api.handBoneUltrasoundLesson(identity, tab))}))),
};
assert.equal(record.entries.length, 46);
const file = 'content/hand-bone-ultrasound.transition.json';
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(file, 'utf8').replaceAll('\r\n', '\n'), output);
else writeFileSync(file, output, {flag: process.argv.includes('--refresh') ? 'w' : 'wx'});
console.log(JSON.stringify({entries: record.entries.length, transitionHash: hash(record)}));

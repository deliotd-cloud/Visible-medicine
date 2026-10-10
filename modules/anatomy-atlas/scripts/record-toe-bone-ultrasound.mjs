import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';

const pins = JSON.parse(readFileSync('content/toe-bone-ultrasound-pins.json'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.baseline, 'a1cb14f05b3070b8553e85e3596f634b2bf36a5d');
const compiled = await build({stdin: {contents: "export {toeBoneUltrasoundLesson} from './lib/toe-bone-ultrasound';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, format: 'esm', platform: 'node'});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const record = {
  baseline: pins.baseline,
  sourcePinsHash: hash(pins),
  reason: 'Twenty-eight exact-source toe-phalanx ultrasound surface-orientation drafts in five families. Hallux anatomy and lesser-toe variants remain distinct; no acoustic images, whole-bone or marrow assessment, fracture exclusion, patient registration or clinical approval.',
  entries: pins.entries.flatMap(({identity, previous}) => Object.keys(previous).map(tab => ({id: identity.id, fmaId: identity.fmaId, tab, draftHash: hash(api.toeBoneUltrasoundLesson(identity, tab))}))),
};
assert.equal(record.entries.length, 28);
const file = 'content/toe-bone-ultrasound.transition.json';
const output = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(file, 'utf8').replaceAll('\r\n', '\n'), output);
else writeFileSync(file, output, {flag: process.argv.includes('--refresh') ? 'w' : 'wx'});
console.log(JSON.stringify({entries: record.entries.length, transitionHash: hash(record)}));

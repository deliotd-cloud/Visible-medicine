import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
const pins = JSON.parse(readFileSync('content/deep-brain-core-teaching-pins.json'));
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(pins.baseline, '398edc60a43f8d0235d9e6963c1ad56954b3fa98');
const built = await build({stdin: {contents: "export {deepBrainCoreLesson} from './lib/deep-brain-core-teaching';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, format: 'esm', platform: 'node'});
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const record = {baseline: pins.baseline, sourcePinsHash: hash(pins),
  reason: 'Ten exact-source deep-brain evidence-and-limits drafts; unsettled function and source scope remain explicit. No anatomical or clinical approval.',
  entries: pins.entries.flatMap(({identity, previous}) => Object.keys(previous).map(tab => ({id: identity.id, fmaId: identity.fmaId, tab, draftHash: hash(api.deepBrainCoreLesson(identity, tab))})))};
const path = 'content/deep-brain-core-teaching.transition.json', text = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), text);
else writeFileSync(path, text, {flag: process.argv.includes('--refresh') ? 'w' : 'wx'});
console.log(JSON.stringify({entries: record.entries.length, transitionHash: hash(record)}));

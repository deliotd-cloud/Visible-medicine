import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
const pins = JSON.parse(readFileSync('content/suprascapular-vessel-ultrasound-pins.json'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(hash(pins), '0ed9e6ba9dabbbad9079639a7ecc23cc203d6c25a78b3b8d11045804498c6389');
const built = await build({stdin: {contents: "export {suprascapularVesselUltrasoundLesson} from './lib/suprascapular-vessel-ultrasound';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, format: 'esm', platform: 'node'});
const api = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const record = {baseline: pins.baseline, sourcePinsHash: hash(pins),
  reason: 'Four exact-source suprascapular artery/vein ultrasound drafts; previous pending lessons reconstruct test-only teaching history.',
  entries: pins.entries.map(({identity}) => ({id: identity.id, fmaId: identity.fmaId, draftHash: hash(api.suprascapularVesselUltrasoundLesson(identity, 'ultrasound'))}))};
const path = 'content/suprascapular-vessel-ultrasound.transition.json', text = JSON.stringify(record, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'), text);
else writeFileSync(path, text, {flag: 'wx'});
console.log(JSON.stringify({entries: record.entries.length, transitionHash: hash(record)}));

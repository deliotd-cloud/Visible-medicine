import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images', pin = root + '/AUTHORED_SOURCE.json', source = json(pin);
assert.equal(hash(pin), '651d0ff8ab11044594538e16e0979a780a082e1320ff2ec4bc7b500489fee6fb');
assert(json('G:/VisibleMedicine-temp/staging/20261031-release-partition7-anatomy-final/RELEASE_QUEUE.json').terminal, 'Do not duplicate the live stock release job');
assert(json(root + '/FOCUSED_RESULT.json').passing);
assert(json(root + '/SCOPED_TYPES.json').passing);
for (const r of source.sourceRows) assert.equal(hash(source.website + '/' + r.path), r.sha256, r.path);
const result = await guarded({site: source.website, dir: root + '/build-1', command: root + '/build-child.mjs', heap: 1536, aggregate: 3584, minimum: 5632,
  extraEnv: {TEMP: root + '/tmp', TMP: root + '/tmp', VM_ATLAS_SOURCE_REPO: source.atlas, ATLAS_SOURCE_REPO: source.atlas, VM_WEBSITE_DISTRIBUTION_AUDIT_DIR: root + '/audit-metadata'}});
const readyPath = root + '/SOURCE_READY.json';
if (fs.existsSync(readyPath)) for (const r of json(readyPath).sourceRows) assert.equal(hash(source.website + '/' + r.path), r.sha256, r.path);
fs.writeFileSync(root + '/BUILD_RESULT.json', JSON.stringify({...result, authoredSource: {path: pin, sha256: hash(pin)}, source: fs.existsSync(readyPath) ? {path: readyPath, sha256: hash(readyPath)} : null, installed: false}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({passing: result.passing, installed: false}));
if (!result.passing) process.exitCode = 1;

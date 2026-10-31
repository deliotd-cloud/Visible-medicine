import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {guarded} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/run-native-build-balanced-guarded-20261025.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images-ready', pin = root + '/SOURCE.json', source = json(pin), site = source.website;
const envFile = 'F:/VisibleMedicine/staging/20261030-release-repair-website/HISTORICAL_ENVIRONMENT_2.json';
assert.equal(hash(envFile), 'bd5fc429483bc9cf7ba26ed5290b1c70bdd6e01cb74d8b9aa18b490dfae973f5');
assert(json('G:/VisibleMedicine-temp/staging/20261031-release-partition7-anatomy-final/RELEASE_QUEUE.json').terminal);
const focused = json(root + '/FOCUSED_RESULT.json'); assert(focused.passing); assert.equal(focused.source.sha256, hash(pin));
assert.equal(source.buildProductSource.sha256, 'ff5144cc18cf5ec41af01e99cd319654f89b14d2cd15cf2e08ed881f69df0caf');
assert.equal(hash(source.buildProductSource.path), source.buildProductSource.sha256);
assert(json('G:/VisibleMedicine-temp/staging/20261031-native-public-images/BUILD_RESULT.json').passing);
assert(json('G:/VisibleMedicine-temp/staging/20261031-native-public-images/DISTRIBUTION_RESULT.json').objectiveMet);
for (const r of json(source.buildProductSource.path).sourceRows) if (!r.path.startsWith('tests/')) assert.equal(hash(site + '/' + r.path), r.sha256, r.path);
const order = [...Array.from({length: 26}, (_, i) => i + 7), 1, 2, 3, 4, 5, 6];
const state = {schema: 'vm-frozen-release-queue/1', source: {path: pin, sha256: hash(pin)}, at: new Date().toISOString(), coordinatorPid: process.pid, order, completed: [], current: null, terminal: false, wholeSuitePassing: false};
assert(!fs.existsSync(root + '/RELEASE_QUEUE.json'));
const save = () => fs.writeFileSync(root + '/RELEASE_QUEUE.json', JSON.stringify(state, null, 2) + '\n');
const verify = () => {for (const r of source.sourceRows) assert.equal(hash(site + '/' + r.path), r.sha256, r.path);};
try {
  for (const index of order) {
    verify(); const dir = root + '/partition-' + index;
    state.current = {index, count: 32, evidence: dir, started: new Date().toISOString()}; save();
    console.log(JSON.stringify({partition: index, starting: true}));
    const result = await guarded({site, dir, command: 'scripts/run-website-tests.mjs --run --partition ' + index + '/32', heap: 2048, aggregate: 3584, minimum: 5632,
      extraEnv: {...json(envFile).environment, VM_CURRENT_SOURCE_RECEIPT: pin, VM_CURRENT_SOURCE_SHA256: hash(pin), VM_WEBSITE_ROOT: site, VM_ATLAS_SOURCE_REPO: source.atlas, ATLAS_SOURCE_REPO: source.atlas, VM_PUBLIC_PREVIEW_SOURCE_ROOT: site, TEMP: root + '/tmp', TMP: root + '/tmp'}});
    verify(); const file = root + '/PARTITION_RESULT-' + index + '.json';
    fs.writeFileSync(file, JSON.stringify({...result, source: state.source, sourceUnchanged: true, partition: index, count: 32, wholeSuitePassing: false}, null, 2) + '\n', {flag: 'wx'});
    state.completed.push({index, passing: result.passing, result: {path: file, sha256: hash(file)}}); state.current = null; save();
    console.log(JSON.stringify({partition: index, passing: result.passing}));
    if (!result.passing) {state.stopReason = 'Partition failed; inspect actual receipt before changing or retrying'; process.exitCode = 1; break;}
  }
  state.terminal = true; state.finished = new Date().toISOString(); state.requiresAggregateReceiptAudit = true; save();
} catch (error) {state.terminal = true; state.finished = new Date().toISOString(); state.error = String(error); save(); throw error;}

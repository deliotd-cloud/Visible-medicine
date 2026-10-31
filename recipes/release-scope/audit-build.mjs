import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-release-scope-ready', pin = root + '/SOURCE.json', source = json(pin);
assert(json(root + '/BUILD_RESULT_4096.json').passing);
// The earlier failed build left an RSC inventory; audit only the completed run.
const runId = '167968-ddd69941-9d02-4a77-8e6d-6f97c153ae56';
const records = fs.readdirSync(root + '/audit-metadata').filter(p => p.startsWith(runId + '-') && p.endsWith('.json')).map(p => ({path: root + '/audit-metadata/' + p, ...json(root + '/audit-metadata/' + p)}));
for (const record of records) {
  assert.equal(record.runId, runId);
  for (const binding of record.bindings) assert.equal(hash(source.website + '/' + binding.name), binding.sha256);
}
assert.equal(records.length, 3);
assert.deepEqual(records.map(r => r.environment).sort(), ['client', 'rsc', 'ssr']);
const packages = new Map(), environments = [], mismatches = [];
for (const record of records) {
  const out = source.website + '/dist/' + ({client: 'client', rsc: 'server', ssr: 'server/ssr'}[record.environment]);
  let matches = 0;
  for (const f of record.files) {
    const file = path.join(out, f.fileName);
    assert(fs.existsSync(file), f.fileName);
    const actual = hash(file);
    if (actual === f.sha256) matches++;
    else {
      assert.equal(record.environment, 'client'); assert.equal(f.fileName, '.assetsignore');
      mismatches.push({environment: record.environment, file: f.fileName, hookSha256: f.sha256, finalSha256: actual, finalText: fs.readFileSync(file, 'utf8')});
    }
  }
  const seen = new Set();
  for (const chunk of record.chunks) for (const m of chunk.modules) if (m.module.kind === 'package') {
    const p = m.module.package, key = p.name + '@' + p.version;
    packages.set(key, p); seen.add(key);
  }
  environments.push({environment: record.environment, inventory: {path: record.path, sha256: hash(record.path)}, files: record.files.length, matchingFinalFiles: matches, packages: [...seen].sort()});
}
for (const r of source.sourceRows) assert.equal(hash(source.website + '/' + r.path), r.sha256, r.path);
const unpicPackages = [...packages.values()].filter(p => ['@unpic/react', '@unpic/core', 'unpic'].includes(p.name));
const result = {at: new Date().toISOString(), source: {path: pin, sha256: hash(pin)}, build: {path: root + '/BUILD_RESULT_4096.json', sha256: hash(root + '/BUILD_RESULT_4096.json')}, environments,
  packages: [...packages.keys()].sort(), packageCount: packages.size, mismatches, unpicAbsentFromInventoriedJavascript: unpicPackages.length === 0, objectiveMet: unpicPackages.length === 0,
  installedDependenciesUnchanged: true, scope: 'Final written client/RSC/SSR JavaScript module inventories. This does not certify every dependency, CSS file, copied asset, worker sub-build or nonliteral runtime import.', sourceUnchanged: true, installed: false};
fs.writeFileSync(root + '/DISTRIBUTION_RESULT.json', JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({environments: environments.map(e => ({name: e.environment, files: e.files, matching: e.matchingFinalFiles})), packages: packages.size, unpicAbsent: result.objectiveMet, installed: false}));
assert(result.objectiveMet, 'Unpic still emitted; do not claim that notice gap has been removed');

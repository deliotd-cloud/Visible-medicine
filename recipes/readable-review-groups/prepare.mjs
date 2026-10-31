import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { hash, json } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-review-readable-groups', site = root + '/website';
const pin = 'G:/VisibleMedicine-temp/staging/20261030-release-notices-successor/SOURCE.json';
assert.equal(hash(pin), '2ef834f9fc79c5ec3921a8920e691ce504d5dea88bf4849de2428b7abda9fe91');
const parent = json(pin), proposal = 'G:/VisibleMedicine-temp/proposals/20261030-review-readable-groups';
const focused = json(proposal + '/FOCUSED_SOURCE-2.json');
assert(json(proposal + '/FOCUSED_RESULT-2.json').passing);
assert(!fs.existsSync(site));
const changed = ['components/ClinicalReviewQuickStart.tsx', 'lib/clinical-review-quick-start.ts', 'tests/clinical-review-quick-start.test.mjs', 'tests/clinical-review-quick-start-ui.test.mjs'];
for (const row of parent.sourceRows) {
  assert.equal(hash(parent.website + '/' + row.path), row.sha256, row.path);
  fs.mkdirSync(path.dirname(site + '/' + row.path), { recursive: true });
  fs.copyFileSync(parent.website + '/' + row.path, site + '/' + row.path, fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync(fs.realpathSync(parent.website + '/node_modules'), site + '/node_modules', 'junction');
fs.symlinkSync(parent.atlas, root + '/atlas', 'junction');
fs.mkdirSync(root + '/tmp', { recursive: true });
const git = (...args) => execFileSync('git', ['-C', site, ...args], { encoding: 'utf8', windowsHide: true }).trim();
git('init', '--quiet');
fs.writeFileSync(site + '/.git/objects/info/alternates', execFileSync('git', ['-C', 'F:/VisibleMedicine/website', 'rev-parse', '--path-format=absolute', '--git-path', 'objects'], { encoding: 'utf8', windowsHide: true }).trim().replaceAll('\\', '/') + '\n', { flag: 'wx' });
git('update-ref', 'HEAD', parent.websiteHead); git('read-tree', 'HEAD');
for (const p of changed) {
  assert.equal(hash(proposal + '/website/' + p), focused.rows.find(r => r.path === p).sha256);
  fs.copyFileSync(proposal + '/website/' + p, site + '/' + p);
}
const rows = parent.sourceRows.map(row => ({ path: row.path, sha256: hash(site + '/' + row.path), bytes: fs.statSync(site + '/' + row.path).size }));
assert.deepEqual(rows.filter(r => r.sha256 !== parent.sourceRows.find(p => p.path === r.path).sha256).map(r => r.path).sort(), changed.sort());
const integration = json(site + '/atlas-review/integration-inputs.json');
assert(changed.every(p => !integration.inputs.some(row => row.path === p)));
for (const row of integration.inputs) assert.equal(hash(site + '/' + row.path), row.sha256);
const source = { ...parent, schema: 'vm-readable-review-group-candidate/1', at: new Date().toISOString(), website: site,
  parent: { path: pin, sha256: hash(pin) }, sourceRows: rows, sourcePaths: rows.map(r => r.path), changedPaths: changed, addedPaths: [], removedPaths: [],
  reviewBindingUnchanged: true, protectedInputsUnchanged: true, installed: false, fullBuildPassed: false, fullTypesPassed: false, wholeSuitePassing: false,
  focusedSource: { path: proposal + '/FOCUSED_SOURCE-2.json', sha256: hash(proposal + '/FOCUSED_SOURCE-2.json') } };
fs.writeFileSync(root + '/SOURCE.json', JSON.stringify(source, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ sourceSha256: hash(root + '/SOURCE.json'), files: rows.length, changed: changed.length, reviewIntegration: integration.sha256, installed: false }));

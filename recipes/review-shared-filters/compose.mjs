import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { hash, json } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-review-shared-filters-ready', site = root + '/website';
const proposal = 'G:/VisibleMedicine-temp/proposals/20261031-review-shared-filters';
const pin = 'G:/VisibleMedicine-temp/staging/20261031-review-group-order-ready/SOURCE.json';
assert.equal(hash(pin), 'd719b7a0ab1dba6a89ef67677ed120036e246df46f96a92b3abee0572c968714');
const parent = json(pin), changes = ['components/ClinicalReviewInbox.tsx', 'components/ClinicalReviewQuickStart.tsx', 'tests/clinical-review-inbox-ui.test.mjs', 'tests/clinical-review-quick-start-ui.test.mjs'];
assert(!fs.existsSync(site));
for (const row of parent.sourceRows) {
  assert.equal(hash(parent.website + '/' + row.path), row.sha256, row.path);
  const target = site + '/' + row.path;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(parent.website + '/' + row.path, target, fs.constants.COPYFILE_EXCL);
}
for (const relative of changes) fs.copyFileSync(proposal + '/' + relative, site + '/' + relative);
fs.symlinkSync(fs.realpathSync(parent.website + '/node_modules'), site + '/node_modules', 'junction');
fs.symlinkSync(parent.atlas, root + '/atlas', 'junction');
fs.mkdirSync(root + '/tmp', { recursive: true });
const git = (...args) => execFileSync('git', ['-C', site, ...args], { encoding: 'utf8', windowsHide: true }).trim();
git('init', '--quiet');
fs.writeFileSync(site + '/.git/objects/info/alternates', execFileSync('git', ['-C', 'F:/VisibleMedicine/website', 'rev-parse', '--path-format=absolute', '--git-path', 'objects'], { encoding: 'utf8', windowsHide: true }).trim().replaceAll('\\', '/') + '\n', { flag: 'wx' });
git('update-ref', 'HEAD', parent.websiteHead); git('read-tree', 'HEAD');
const inputs = json(site + '/atlas-review/integration-inputs.json');
assert.equal(inputs.sha256, parent.review);
for (const row of inputs.inputs) assert.equal(hash(site + '/' + row.path), row.sha256, row.path);
for (const row of parent.sourceRows) if (!changes.includes(row.path)) assert.equal(hash(site + '/' + row.path), row.sha256, row.path);
const source = { ...parent, schema: 'vm-review-shared-filters-source/1', at: new Date().toISOString(),
  parent: { path: pin, sha256: hash(pin) }, website: site,
  sourceRows: parent.sourceRows.map(row => changes.includes(row.path) ? { path: row.path, sha256: hash(site + '/' + row.path), bytes: fs.statSync(site + '/' + row.path).size } : row),
  currentChanges: changes, authoredPaths: [...new Set([...parent.authoredPaths, ...changes])], runtimeUnchangedFromParent: false, installed: false };
fs.writeFileSync(root + '/SOURCE.json', JSON.stringify(source, null, 2) + '\n', { flag: 'wx' });
fs.writeFileSync(root + '/COMPOSITION.json', JSON.stringify({ at: new Date().toISOString(), source: { path: root + '/SOURCE.json', sha256: hash(root + '/SOURCE.json') }, changed: changes,
  protectedInputsUnchanged: true, selectionAndPriorityUnchanged: true, installed: false, fullBuildPassed: false, wholeSuitePassing: false }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ source: hash(root + '/SOURCE.json'), rows: source.sourceRows.length, changes, review: source.review }));

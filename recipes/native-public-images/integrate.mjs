import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images';
const prepared = json(root + '/PREPARED.json'), site = prepared.website;
assert.equal(hash(prepared.parent.path), prepared.parent.sha256);
const parent = json(prepared.parent.path), old = new Map(parent.sourceRows.map(r => [r.path, r]));
const publicProposal = json(prepared.proposal.path);
const proposal = 'G:/VisibleMedicine-temp/proposals/20261031-native-review-brand-image';
const manifest = json(proposal + '/MANIFEST.json');
assert.equal(manifest.baselineSource2Sha256, prepared.parent.sha256);
assert.deepEqual(manifest.files.map(r => r.path).sort(), ['components/AtlasPublicBrandImage.tsx', 'scripts/atlas-public-brand-image-plugin.mjs', 'tests/atlas-public-brand-image.test.mjs']);
for (const row of manifest.files) {
  assert.equal(row.baseSha256, null);
  assert(!old.has(row.path), row.path);
  assert.equal(hash(proposal + '/website/' + row.path), row.sha256, row.path);
  assert.equal(fs.statSync(proposal + '/website/' + row.path).size, row.bytes);
  fs.mkdirSync(path.dirname(site + '/' + row.path), {recursive: true});
  fs.copyFileSync(proposal + '/website/' + row.path, site + '/' + row.path, fs.constants.COPYFILE_EXCL);
}
const edit = (p, from, to) => {
  const file = site + '/' + p, text = fs.readFileSync(file, 'utf8');
  assert.equal(hash(file), old.get(p).sha256, p);
  assert.equal(text.split(from).length, 2, p + ' seam');
  fs.writeFileSync(file, text.replace(from, to));
};
const config = site + '/vite.config.ts';
edit('vite.config.ts', "import vinext from 'vinext';", "import vinext from 'vinext';\nimport { atlasPublicBrandImagePlugin } from './scripts/atlas-public-brand-image-plugin.mjs';");
let configText = fs.readFileSync(config, 'utf8');
assert.equal(configText.split('      vinext(),').length, 2);
fs.writeFileSync(config, configText.replace('      vinext(),', '      atlasPublicBrandImagePlugin({root: process.cwd()}),\n      vinext(),'));
const bindingInputs = ['components/AtlasPublicBrandImage.tsx', 'scripts/atlas-public-brand-image-plugin.mjs', 'public/brand/approved/visible-medicine-lockup-dark.png', 'public/brand/approved/visible-medicine-lockup-light.png'];
for (const p of bindingInputs) assert(fs.existsSync(site + '/' + p), p);
edit('scripts/bind-clinical-review.mjs', "  'vite.config.ts','scripts/local-atlas-development-plugin.mjs','scripts/website-distribution-inventory.mjs',", "  'vite.config.ts','scripts/local-atlas-development-plugin.mjs','scripts/website-distribution-inventory.mjs',\n  // Public review branding is part of the exact presentation being reviewed.\n  " + bindingInputs.map(p => JSON.stringify(p)).join(',') + ',');
const changed = [...publicProposal.migrated, 'vite.config.ts', 'scripts/bind-clinical-review.mjs'].sort();
const added = [...publicProposal.added, ...manifest.files.map(r => r.path)].sort();
const paths = [...new Set([...parent.sourcePaths, ...added])].sort();
const rows = paths.map(p => ({path: p, sha256: hash(site + '/' + p), bytes: fs.statSync(site + '/' + p).size}));
assert.deepEqual(rows.filter(r => r.sha256 !== old.get(r.path)?.sha256).map(r => r.path), [...changed, ...added].sort());
for (const r of rows.filter(r => r.path.startsWith('atlas-review/'))) assert.equal(r.sha256, old.get(r.path).sha256, r.path);
const source = {...parent, schema: 'vm-native-public-images-authored/1', at: new Date().toISOString(), website: site,
  parent: prepared.parent, proposals: [prepared.proposal, {path: proposal + '/MANIFEST.json', sha256: hash(proposal + '/MANIFEST.json')}],
  sourcePaths: paths, sourceRows: rows, changedPaths: changed, addedPaths: added, removedPaths: [],
  allProductInputsUnchanged: false, fullBuildPassed: false, fullTypesPassed: false, wholeSuitePassing: false,
  reviewBindingPending: true, bindingInputsAdded: bindingInputs, generatedAtlasSourceUnchanged: true, clinicalApproval: false, installed: false};
delete source.parentBuild;
fs.writeFileSync(root + '/AUTHORED_SOURCE.json', JSON.stringify(source, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({authoredSource: hash(root + '/AUTHORED_SOURCE.json'), changed: changed.length, added: added.length, reviewBindingPending: true, installed: false}));

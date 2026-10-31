import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images';
const site = root + '/website';
const pin = 'G:/VisibleMedicine-temp/staging/20261031-release-partition7-anatomy-final/SOURCE2.json';
assert.equal(hash(pin), 'a4a8e70bd6c17d8960f8f056f64558ced5756095c1a40501d636a6d06dca6356');
const parent = json(pin);
const proposalPin = 'G:/VisibleMedicine-temp/proposals/20261031-public-image-delivery/MAIN_SOURCE.json';
assert.equal(hash(proposalPin), '4c7d6048b38e74856c9672ddbc4005b276bca47caff94a0ad29d44020ba64352');
const proposal = json(proposalPin);
assert.equal(hash(proposal.parent.path), proposal.parent.sha256);
const previous = new Map(json(proposal.parent.path).sourceRows.map(r => [r.path, r.sha256]));
const base = new Map(parent.sourceRows.map(r => [r.path, r.sha256]));
for (const p of proposal.migrated) assert.equal(base.get(p), previous.get(p), 'Proposal preimage ' + p);
for (const p of proposal.added) assert(!base.has(p), p);
assert(!fs.existsSync(site));
for (const row of parent.sourceRows) {
  assert.equal(hash(parent.website + '/' + row.path), row.sha256, row.path);
  fs.mkdirSync(path.dirname(site + '/' + row.path), {recursive: true});
  fs.copyFileSync(parent.website + '/' + row.path, site + '/' + row.path, fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync(fs.realpathSync(parent.website + '/node_modules'), site + '/node_modules', 'junction');
fs.symlinkSync(parent.atlas, root + '/atlas', 'junction');
fs.mkdirSync(root + '/tmp', {recursive: true});
const git = (...args) => execFileSync('git', ['-C', site, ...args], {encoding: 'utf8', windowsHide: true}).trim();
git('init', '--quiet');
fs.writeFileSync(site + '/.git/objects/info/alternates', execFileSync('git', ['-C', 'F:/VisibleMedicine/website', 'rev-parse', '--path-format=absolute', '--git-path', 'objects'], {encoding: 'utf8', windowsHide: true}).trim().replaceAll('\\', '/') + '\n', {flag: 'wx'});
git('update-ref', 'HEAD', parent.websiteHead);
git('read-tree', 'HEAD');
for (const row of proposal.rows) {
  assert.equal(hash(proposal.website + '/' + row.path), row.sha256, row.path);
  assert.equal(fs.statSync(proposal.website + '/' + row.path).size, row.bytes, row.path);
  fs.copyFileSync(proposal.website + '/' + row.path, site + '/' + row.path);
}
for (const row of parent.sourceRows) if (!proposal.migrated.includes(row.path)) assert.equal(hash(site + '/' + row.path), row.sha256, row.path);
fs.writeFileSync(root + '/PREPARED.json', JSON.stringify({at: new Date().toISOString(), parent: {path: pin, sha256: hash(pin)}, proposal: {path: proposalPin, sha256: hash(proposalPin)}, website: site, files: parent.sourceRows.length, added: proposal.added, reviewBindingUnchanged: true, installed: false, ready: false}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({prepared: site, files: parent.sourceRows.length, added: proposal.added.length, ownerPreviewChanged: false}));

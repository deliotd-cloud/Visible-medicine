import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images-ready', site = root + '/website';
const pin = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images/SOURCE_READY.json';
assert.equal(hash(pin), 'ff5144cc18cf5ec41af01e99cd319654f89b14d2cd15cf2e08ed881f69df0caf');
const parent = json(pin);
assert(json('G:/VisibleMedicine-temp/staging/20261031-native-public-images/BUILD_RESULT.json').passing);
assert(json('G:/VisibleMedicine-temp/staging/20261031-native-public-images/DISTRIBUTION_RESULT.json').objectiveMet);
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
git('update-ref', 'HEAD', parent.websiteHead); git('read-tree', 'HEAD');
fs.writeFileSync(root + '/PREPARED.json', JSON.stringify({at: new Date().toISOString(), parent: {path: pin, sha256: hash(pin)}, website: site, files: parent.sourceRows.length, installed: false}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({prepared: site, files: parent.sourceRows.length, installed: false}));

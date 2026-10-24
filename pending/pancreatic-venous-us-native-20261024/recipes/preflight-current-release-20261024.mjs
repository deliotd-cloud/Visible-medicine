import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { hash, json } from './seal-simple-website-successor.mjs';

const receipt = 'F:/VisibleMedicine/staging/20261024-review-pager-website/SOURCE_BOUND.json';
assert.equal(hash(receipt), '4058a3a368dc9573efc74c16d3b7e636057566bebfbb88232095322a459d21ea');
const source = json(receipt), root = source.website;
const destination = 'F:/VisibleMedicine/staging/20261024-release-preflight';
assert(!fs.existsSync(destination));
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted, false);
for (const row of source.sourceRows) assert.equal(hash(root + '/' + row.path), row.sha256);
const { verifyPublicPreviewAssets } = await import(pathToFileURL(root + '/scripts/public-preview-preflight.mjs'));
const { assertWebsiteTestHistory } = await import(pathToFileURL(root + '/scripts/website-test-history-preflight.mjs'));
const previews = verifyPublicPreviewAssets(root), history = assertWebsiteTestHistory(root);
for (const row of source.sourceRows) assert.equal(hash(root + '/' + row.path), row.sha256);
const listRoot = root + '/.local/website-test-runs/2026-10-24T14-29-52-457Z-efb043e0-4edf-4ab7-88d5-50d0515f7094';
const list = json(listRoot + '/receipt.json');
assert.equal(list.launched, false);
fs.mkdirSync(destination);
fs.writeFileSync(destination + '/PREFLIGHT.json', JSON.stringify({
  at: new Date().toISOString(), website: root, sourceReceipt: receipt, sourceReceiptSha256: hash(receipt),
  sourcePathsCheckedBeforeAndAfter: source.sourceRows.length, previews, history,
  stockListReceipt: listRoot + '/receipt.json', stockListReceiptSha256: hash(listRoot + '/receipt.json'),
  stockListManifestSha256: hash(listRoot + '/manifest.json'),
  fullSuiteLaunched: false, passingClaim: false,
  limitation: 'Read-only preflight and inventory only. Full run deferred under severe system memory pressure; no full-suite, browser, signed-in or clinical acceptance claimed.',
  normalPreviewChanged: false, installed: false,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({receipt: destination + '/PREFLIGHT.json', sha256: hash(destination + '/PREFLIGHT.json'), sourcePaths: source.sourceRows.length, previewTiles: previews.assets.length, ...history, fullSuiteLaunched: false}));

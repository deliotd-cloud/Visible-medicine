import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {hash, json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-native-public-images';
const source = json(root + '/SOURCE_READY.json'), checks = [];
for (const [surface, width, height] of [['dark', 1024, 205], ['light', 1024, 217]]) {
  const pathname = '/brand/approved/visible-medicine-lockup-' + surface + '.png';
  const file = source.website + '/public' + pathname;
  assert.equal(hash(file), hash('F:/VisibleMedicine/website/public' + pathname));
  const response = await fetch('http://127.0.0.1:3000' + pathname, {signal: AbortSignal.timeout(15000)});
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^image\/png\b/i);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash(file));
  assert.equal(bytes.readUInt32BE(16), width); assert.equal(bytes.readUInt32BE(20), height);
  checks.push({pathname, status: response.status, sha256: hash(file), bytes: bytes.length, width, height});
}
fs.writeFileSync(root + '/ASSET_DELIVERY.json', JSON.stringify({at: new Date().toISOString(), source: {path: root + '/SOURCE_READY.json', sha256: hash(root + '/SOURCE_READY.json')}, checks, passing: true, scope: 'Existing approved public logo asset delivery on the installed preview; no review pages, authentication, decisions or owner tabs changed. Candidate layout acceptance remains separate.'}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({passing: true, assets: checks.length, ownerTabsChanged: false}));

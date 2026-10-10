import assert from 'node:assert/strict';
import test from 'node:test';
import {discSceneRequest} from './disc-review-request.mjs';

const hash = 'a'.repeat(64);
const protectedPage = 'https://visible.example/api/atlas-review/disc/index.html';

test('protected request carries the exact report hash to the adjacent source packet', () => {
 const request = discSceneRequest(`${protectedPage}?revision=${hash}`, hash);
 assert.deepEqual(request, {
  url: `https://visible.example/api/atlas-review/disc/scene.json?revision=${hash}`,
  expectedRevision: hash,
 });
 assert.equal(discSceneRequest(`${protectedPage}?revision=${hash}`, hash,
  'https://visible.example/api/atlas-review/disc/').url, request.url);
});

test('standalone local inspector may omit a query', () => {
 for (const page of ['http://127.0.0.1:60371/', 'http://localhost:60371/index.html',
  'http://[::1]:60371/index.html', 'file:///review/index.html']) {
  assert.equal(discSceneRequest(page, hash).url, new URL('./scene.json', page).href);
 }
});

test('request guard rejects malformed, stale, duplicate and unrelated revisions', () => {
 const badQueries = ['', '?', '?revision=', '?revision=wrong', `?revision=${'b'.repeat(64)}`,
  `?revision=${hash}&revision=${hash}`, `?revision=${hash}&other=1`,
  `?other=1&revision=${hash}`, `?%72evision=${hash}`, `?revision=${hash.toUpperCase()}`];
 for (const query of badQueries) {
  assert.throws(() => discSceneRequest(protectedPage + query, hash), /revision/i, query);
 }
 assert.throws(() => discSceneRequest(`http://localhost/index.html?other=1`, hash), /revision/i);
 assert.throws(() => discSceneRequest(`${protectedPage}?revision=${hash}`, 'b'.repeat(64)), /revision/i);
 assert.throws(() => discSceneRequest(`${protectedPage}?revision=${hash}`, undefined), /revision/i);
});

test('request guard rejects foreign or displaced asset bases and invalid page URLs', () => {
 const page = `${protectedPage}?revision=${hash}`;
 for (const base of ['https://foreign.example/api/atlas-review/disc/',
  'https://visible.example/api/atlas-review/other/',
  'https://visible.example/api/atlas-review/disc/?other=1',
  'https://visible.example/api/atlas-review/disc/#other']) {
  assert.throws(() => discSceneRequest(page, hash, base), /asset base/i, base);
 }
 for (const invalid of ['ftp://visible.example/review/index.html',
  'https://user:pass@visible.example/review/index.html',
  'https://visible.example/review/scene.json', `${page}#fragment`]) {
  assert.throws(() => discSceneRequest(invalid, hash), /review URL/i, invalid);
 }
});

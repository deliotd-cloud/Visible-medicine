import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const website = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(website, path));
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

test('pinned Geist Mono response and retained OFL agree with provenance and notices', () => {
  const record = JSON.parse(read('LICENSES/native-website/geist-mono-provenance.json'));
  const font = read(record.localFontPath);
  assert.equal(font.length, record.fontBytes);
  assert.equal(sha256(font), record.fontSha256);
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  assert.equal(record.sourceSubset, 'latin');
  assert.match(record.sourceFontUrl, /^https:\/\/fonts\.gstatic\.com\/s\/geistmono\/v6\/.+\.woff2$/);
  for (const path of ['LICENSES/geist-mono-OFL.txt', 'public/licenses/geist-mono-OFL.txt']) {
    assert.equal(sha256(read(path)), record.licenseSha256);
  }
  const notice = read('LICENSES/THIRD_PARTY_NOTICES.md').toString();
  assert.ok(notice.includes(record.sourceFontUrl));
  assert.ok(notice.includes(record.fontSha256));
  assert.ok(notice.includes(record.licenseSha256));
  const css = read('app/globals.css').toString();
  assert.match(css, /src: url\("\/fonts\/geist-mono-latin\.woff2"\) format\("woff2"\);/);
});

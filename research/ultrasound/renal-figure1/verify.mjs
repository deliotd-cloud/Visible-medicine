// Read-only, dependency-free integrity inspection. Never grants publication approval.
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packet = realpathSync(resolve(process.argv[2] || dirname(fileURLToPath(import.meta.url))));
const record = JSON.parse(readFileSync(resolve(packet, 'manifest.json'), 'utf8'));
assert.equal(record.schema, 'vm-ultrasound-candidate/1');
assert.equal(record.id, 'vm:media:us:hansen-2015:renal-figure-1');
assert.equal(record.publicationEligible, false, 'A clinical decision needs its own reviewed workflow');
assert.equal(record.teaching.registration, 'none');
assert.equal(record.teaching.patientToAtlasTransform, null);
assert.equal(record.teaching.pixelSpacingMm, null);
assert.equal(record.teaching.laterality, 'unknown');
assert.equal(record.teaching.imagingSyncEventsAllowed, false);
assert.equal(record.rights.license, 'CC-BY-4.0');
assert.equal(record.files.length, 3);
assert.equal(new Set(record.files.map(file => file.name)).size, 3);

function inspectJpeg(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'Not JPEG');
  let offset = 2, width, height;
  const segments = [];
  while (offset < bytes.length) {
    assert.equal(bytes[offset++], 0xff, 'Invalid marker');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9) break;
    const length = bytes.readUInt16BE(offset);
    assert(length >= 2 && offset + length <= bytes.length, 'Invalid segment length');
    const data = bytes.subarray(offset + 2, offset + length);
    segments.push({ marker: marker.toString(16), bytes: data.length,
      ...((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe
        ? {sha256:createHash('sha256').update(data).digest('hex'),
          printableRuns: [...data.toString('latin1').matchAll(/[\x20-\x7e]{5,}/g)].map(m => m[0])}
        : {}) });
    if ([0xc0,0xc1,0xc2].includes(marker)) {
      height = data.readUInt16BE(1); width = data.readUInt16BE(3);
    }
    offset += length;
    if (marker === 0xda) break; // Entropy data is not metadata; entire file is hash-checked.
  }
  assert(width > 0 && height > 0);
  return { width, height, segments };
}

const verified = [];
for (const file of record.files) {
  assert(/^[A-Za-z0-9_.-]+$/.test(file.name), 'Unsafe packet filename');
  const bytes = readFileSync(resolve(packet, file.name));
  assert.equal(bytes.length, file.bytes, file.name);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.name);
  if (file.sha1) assert.equal(createHash('sha1').update(bytes).digest('hex'), file.sha1);
  const jpeg = file.name.endsWith('.jpg') ? inspectJpeg(bytes) : null;
  if (jpeg) { assert.equal(jpeg.width, file.width); assert.equal(jpeg.height, file.height); }
  verified.push({ name:file.name, bytes:bytes.length, sha256:file.sha256, ...(jpeg || {}) });
}
const xml = readFileSync(resolve(packet, 'article-source.xml'), 'utf8');
assert(xml.includes('<article-title>Ultrasonography of the Kidney: A Pictorial Review</article-title>'));
assert(xml.includes('10.3390/diagnostics6010002'));
const permissions = xml.match(/<permissions>[\s\S]*?<\/permissions>/)?.[0];
assert(permissions?.includes('creativecommons.org/licenses/by/4.0/'));
const figure = xml.match(/<fig id="diagnostics-06-00002-f001"[^>]*>[\s\S]*?<\/fig>/)?.[0];
assert(figure?.includes('Column of Bertin'));
assert(figure.includes('371a48305b8e/diagnostics-06-00002-g001.jpg'));
assert(!/permission|courtesy|license|credit/i.test(figure), 'Figure-specific rights need reconsideration');
console.log(JSON.stringify({ schema:'vm-ultrasound-candidate-check/1', id:record.id,
  files:verified, articleFigureMatched:true, articleLicenseMatched:true,
  publicationEligible:false, clinicalReview:'pending', privacyReview:'pending-owner-decision',
  limitation:'Integrity and metadata inventory only; neither clinical nor legal/privacy approval.' }, null, 2));

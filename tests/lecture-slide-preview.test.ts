import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {parseSlidePreviewManifest, readSlidePreviewImage, readSlidePreviewPackage,
  type PreviewLocalFile, type SlidePreviewManifest} from '../lib/lecture-slide-preview.ts';

const png = Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const hex = 'a'.repeat(64);

function manifest(count = 1): SlidePreviewManifest {
  return {
    schema: 'vm-lecture-slide-preview-v1', state: 'review-only',
    source: {label: 'Synthetic presentation', sha256: hex, bytes: 1024},
    intakeSha256: hex, renderer: {name: 'test renderer', version: '1.0'},
    sourceSlideCount: count,
    slides: Array.from({length: count}, (_, index) => ({
      position: index + 1, part: `ppt/slides/slide${index + 1}.xml`, partSha256: hex,
      title: `Synthetic slide ${index + 1}`, notes: '',
      image: {path: `slides/slide-${String(index + 1).padStart(4, '0')}.png`,
        sha256: sha(png), bytes: png.byteLength, width: 1, height: 1},
    })),
  };
}

function file(path: string, bytes: Uint8Array, calls?: {count: number}, size = bytes.byteLength): PreviewLocalFile {
  return {name: path.split('/').at(-1)!, webkitRelativePath: `lesson/${path}`, size,
    async arrayBuffer() {
      if (calls) calls.count++;
      return Uint8Array.from(bytes).buffer;
    }};
}

function packageFiles(value: SlidePreviewManifest, calls?: {count: number}): PreviewLocalFile[] {
  return [file('preview.json', new TextEncoder().encode(JSON.stringify(value))),
    ...value.slides.map(slide => file(slide.image.path, png, calls))];
}

test('82-slide package is complete and does not eagerly read any PNG', async () => {
  const expected = manifest(82);
  const calls = {count: 0};
  const result = await readSlidePreviewPackage(packageFiles(expected, calls));
  assert.equal(result.manifest.slides.length, 82);
  assert.equal(result.images.size, 82);
  assert.equal(calls.count, 0);
  assert.deepEqual(await readSlidePreviewImage(result.images.get(expected.slides[80].image.path)!,
    expected.slides[80].image), png);
  assert.equal(calls.count, 1);
});

test('rejects unknown fields including claims of approval and remote image paths', () => {
  const base = manifest();
  for (const invalid of [
    {...base, approved: true},
    {...base, source: {...base.source, rightsApproved: true}},
    {...base, renderer: {...base.renderer, url: 'https://example.org'}},
    {...base, slides: [{...base.slides[0], clinicalApproval: true}]},
    {...base, slides: [{...base.slides[0], image: {...base.slides[0].image, path: 'https://example.org/slide.png'}}]},
    {...base, slides: [{...base.slides[0], image: {...base.slides[0].image, path: '../slides/slide-0001.png'}}]},
    {...base, slides: [{...base.slides[0], image: {...base.slides[0].image, path: 'slides\\slide-0001.png'}}]},
  ]) assert.throws(() => parseSlidePreviewManifest(JSON.stringify(invalid)));
});

test('optional slide text preserves exact text and accepts legacy previews', async () => {
  const legacy = manifest();
  assert.deepEqual(parseSlidePreviewManifest(JSON.stringify(legacy)), legacy);
  assert.equal(Object.hasOwn(legacy.slides[0], 'sourceText'), false);
  for (const sourceText of ['', 'Custom heading\nText\tfrom shapes', 'x'.repeat(32000)]) {
    const current = manifest();
    current.slides[0].title = '';
    current.slides[0].sourceText = sourceText;
    const result = await readSlidePreviewPackage(packageFiles(current));
    assert.equal(result.manifest.slides[0].title, '');
    assert.equal(result.manifest.slides[0].sourceText, sourceText);
  }
});

test('slide text extension rejects malformed data without allowing extra fields', () => {
  for (const sourceText of [null, false, 23, {}, [], 'x'.repeat(32001), 'hidden\u0000text']) {
    const value = manifest();
    Object.assign(value.slides[0], {sourceText});
    assert.throws(() => parseSlidePreviewManifest(JSON.stringify(value)), /source text/);
  }
  const value = manifest();
  Object.assign(value.slides[0], {sourceText: 'Heading', approved: true});
  assert.throws(() => parseSlidePreviewManifest(JSON.stringify(value)), /unsupported fields/);
});

test('rejects truncated slides, duplicate parts, bad sequence, and invalid text', () => {
  const two = manifest(2);
  const variants = [
    {...two, slides: [two.slides[0]]},
    {...two, slides: [two.slides[0], {...two.slides[1], part: two.slides[0].part}]},
    {...two, slides: [{...two.slides[0], position: 2}, two.slides[1]]},
    {...two, slides: [{...two.slides[0], notes: '<script>\u0000</script>'}, two.slides[1]]},
    {...two, slides: [{...two.slides[0], title: 'x'.repeat(501)}, two.slides[1]]},
    {...two, sourceSlideCount: 501},
    {...two, source: {...two.source, bytes: 256 * 1024 * 1024 + 1}},
  ];
  for (const invalid of variants) assert.throws(() => parseSlidePreviewManifest(JSON.stringify(invalid)));
  assert.throws(() => parseSlidePreviewManifest(' '.repeat(8 * 1024 * 1024 + 1)));
});

test('rejects image byte, dimension, pixel and aggregate limits', () => {
  const base = manifest();
  for (const image of [
    {...base.slides[0].image, bytes: 16 * 1024 * 1024 + 1},
    {...base.slides[0].image, width: 4097},
    {...base.slides[0].image, width: 4096, height: 4096},
  ]) assert.throws(() => parseSlidePreviewManifest(JSON.stringify({...base,
    slides: [{...base.slides[0], image}]})));
  const many = manifest(33);
  for (const slide of many.slides) slide.image.bytes = 16 * 1024 * 1024;
  assert.throws(() => parseSlidePreviewManifest(JSON.stringify(many)));
});

test('package rejects missing, duplicate, case-ambiguous, extra, escaping and mixed-root files', async () => {
  const base = packageFiles(manifest());
  const bad = [
    [base[0]],
    [...base, base[1]],
    [...base, {...base[1], name: 'SLIDE-0001.PNG', webkitRelativePath: 'lesson/slides/SLIDE-0001.PNG'}],
    [...base, file('slides/slide-0002.png', png)],
    [base[0], {...base[1], webkitRelativePath: 'lesson/../slide-0001.png'}],
    [base[0], {...base[1], webkitRelativePath: 'another/slides/slide-0001.png'}],
    [base[0], {...base[1], webkitRelativePath: 'lesson\\slides\\slide-0001.png'}],
  ];
  for (const candidate of bad) await assert.rejects(() => readSlidePreviewPackage(candidate));
});

test('oversized PNG is rejected before any file read', async () => {
  const calls = {count: 0};
  const base = packageFiles(manifest(), calls);
  base[1] = file('slides/slide-0001.png', png, calls, 16 * 1024 * 1024 + 1);
  await assert.rejects(() => readSlidePreviewPackage(base));
  assert.equal(calls.count, 0);
  await assert.rejects(() => readSlidePreviewImage(base[1], manifest().slides[0].image));
  assert.equal(calls.count, 0);
});

test('selected image verifies size, PNG header, dimensions and SHA-256', async () => {
  const image = manifest().slides[0].image;
  const good = file(image.path, png);
  assert.deepEqual(await readSlidePreviewImage(good, image), png);
  await assert.rejects(() => readSlidePreviewImage(good, {...image, sha256: hex}), /SHA-256/);
  await assert.rejects(() => readSlidePreviewImage(good, {...image, width: 2}), /dimensions/);
  const altered = Uint8Array.from(png); altered[0] = 0;
  await assert.rejects(() => readSlidePreviewImage(file(image.path, altered), image), /PNG/);
  const tampered = Uint8Array.from(png); tampered[tampered.length - 1] ^= 1;
  await assert.rejects(() => readSlidePreviewImage(file(image.path, tampered), image), /SHA-256/);
  await assert.rejects(() => readSlidePreviewImage(file(image.path, png, undefined, png.byteLength + 1), image));
});

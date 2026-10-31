import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { siteImageAttributes, siteImagePreloadOptions } from '../lib/site-image.ts';

// Run from the selected website checkout with node --experimental-strip-types.
const website = process.cwd();
const requireFromWebsite = createRequire(resolve(website, 'package.json'));
const { getImageProps } = await import(pathToFileURL(resolve(website, 'node_modules/vinext/dist/shims/image.js')).href);
const propsToCompare = ['src', 'srcSet', 'sizes', 'alt', 'width', 'height', 'loading', 'fetchPriority', 'decoding', 'className', 'data-nimg'];

test('actual public artwork matches the installed Vinext image attributes', () => {
  const cases = [
    { src: '/brand/review/visible-medicine-light-approved.png', width: 2172, height: 724, alt: 'Approved light Visible Medicine logo with by Elivion endorsement', priority: true },
    { src: '/brand/review/visible-medicine-dark-approved.png', width: 2140, height: 735, alt: 'Approved dark Visible Medicine logo with inline by Elivion endorsement' },
    { src: '/brand/approved/visible-medicine-lockup-dark.png', width: 1024, height: 205, alt: '', className: 'splash-static-brand', priority: true },
    { src: '/brand/approved/visible-medicine-lockup-light.png', width: 1024, height: 217, alt: '', className: 'brand-lockup-image', sizes: '(max-width: 760px) 168px, 214px' },
    { src: '/media/splash/glide-poster-v1.webp', width: 192, height: 108, alt: '', className: 'thumbnail' },
    { src: '/media/atlas/ct-preview.png', width: 640, height: 440, alt: 'Representative axial CT image of the brain', loading: 'lazy', unoptimized: true },
    { src: '/media/atlas/mri-preview.png', width: 640, height: 440, alt: 'Representative sagittal MRI of an ex vivo human brain', unoptimized: true },
    { src: '/brand/approved/visible-medicine-lockup-dark.png?version=1&dpl=release-7', width: 1024, height: 205, alt: '' },
  ];
  for (const input of cases) {
    const actual = siteImageAttributes(input);
    const expected = getImageProps(input).props;
    for (const key of propsToCompare) assert.deepEqual(actual[key], expected[key], `${input.src}: ${key}`);
    if (!input.unoptimized) assert.match(actual.src, /^\/_next\/image\?url=/);
    else assert.equal(actual.src, input.src);
  }
});

test('preload metadata retains responsive candidates, sizes and high priority', () => {
  const input = { src: '/brand/approved/visible-medicine-lockup-light.png', width: 1024, height: 217, alt: '', sizes: '(max-width: 760px) 168px, 214px', priority: true };
  const attributes = siteImageAttributes(input);
  assert.equal(attributes.loading, 'eager');
  assert.equal(attributes.fetchPriority, 'high');
  assert.deepEqual(siteImagePreloadOptions(input), { as: 'image', imageSrcSet: attributes.srcSet, imageSizes: input.sizes, fetchPriority: 'high' });
  assert.match(attributes.srcSet, / 3840w$/);
  const original = siteImageAttributes({ ...input, unoptimized: true });
  assert.equal(original.src, input.src);
  assert.equal(siteImagePreloadOptions({ ...input, unoptimized: true }).imageSrcSet, undefined);
});

test('configured deployment ID follows the installed Vinext URL behavior', () => {
  const previous = process.env.__VINEXT_DEPLOYMENT_ID;
  process.env.__VINEXT_DEPLOYMENT_ID = 'current-release';
  try {
    const input = { src: '/brand/approved/visible-medicine-lockup-dark.png?version=1', width: 1024, height: 205, alt: '' };
    assert.equal(siteImageAttributes(input).src, getImageProps(input).props.src);
    assert.match(siteImageAttributes(input).src, /&dpl=current-release$/);
    const pinned = { ...input, src: `${input.src}&dpl=prior-release` };
    assert.equal(siteImageAttributes(pinned).src, getImageProps(pinned).props.src);
    assert.match(siteImageAttributes(pinned).src, /&dpl=prior-release$/);
  } finally {
    if (previous === undefined) delete process.env.__VINEXT_DEPLOYMENT_ID;
    else process.env.__VINEXT_DEPLOYMENT_ID = previous;
  }
});

test('deployment IDs cannot inject optimizer query parameters', () => {
  const input = { src: '/brand/approved/visible-medicine-lockup-dark.png?dpl=release%26w%3D1%26q%3D100', width: 1024, height: 205, alt: '' };
  const rendered = siteImageAttributes(input);
  const url = new URL(rendered.src, 'http://local.invalid');
  assert.equal(url.searchParams.get('dpl'), 'release&w=1&q=100');
  assert.deepEqual(url.searchParams.getAll('w'), ['2048']);
  assert.deepEqual(url.searchParams.getAll('q'), ['75']);
  const previous = process.env.__VINEXT_DEPLOYMENT_ID;
  process.env.__VINEXT_DEPLOYMENT_ID = 'release&w=1';
  try {
    const fallback = new URL(siteImageAttributes({ ...input, src: '/brand/approved/visible-medicine-lockup-dark.png' }).src, 'http://local.invalid');
    assert.equal(fallback.searchParams.get('dpl'), 'release&w=1');
    assert.deepEqual(fallback.searchParams.getAll('w'), ['2048']);
  } finally {
    if (previous === undefined) delete process.env.__VINEXT_DEPLOYMENT_ID;
    else process.env.__VINEXT_DEPLOYMENT_ID = previous;
  }
});

test('actual SiteImage render emits priority preload and keeps lazy decorative artwork', async () => {
  const { transform } = await import(pathToFileURL(requireFromWebsite.resolve('esbuild')).href);
  const source = await readFile(resolve(import.meta.dirname, '../components/SiteImage.tsx'), 'utf8');
  let { code } = await transform(source, { loader: 'tsx', format: 'esm', jsx: 'automatic' });
  const references = {
    'react-dom': pathToFileURL(requireFromWebsite.resolve('react-dom')).href,
    'react/jsx-runtime': pathToFileURL(requireFromWebsite.resolve('react/jsx-runtime')).href,
    '../lib/site-image': pathToFileURL(resolve(import.meta.dirname, '../lib/site-image.ts')).href,
  };
  for (const [specifier, url] of Object.entries(references)) code = code.replaceAll(`"${specifier}"`, JSON.stringify(url));
  const { default: SiteImage } = await import(`data:text/javascript,${encodeURIComponent(code)}`);
  const { createElement } = await import(pathToFileURL(requireFromWebsite.resolve('react')).href);
  const { renderToStaticMarkup } = await import(pathToFileURL(requireFromWebsite.resolve('react-dom/server')).href);

  const priorityProps = { src: '/brand/approved/visible-medicine-lockup-light.png', width: 1024, height: 217, alt: '', className: 'brand-lockup-image', sizes: '(max-width: 760px) 168px, 214px', priority: true };
  const priority = renderToStaticMarkup(createElement(SiteImage, priorityProps));
  assert.match(priority, /<link rel="preload" as="image"/);
  assert.match(priority, /imageSrcSet="\/_next\/image/);
  assert.match(priority, /imageSizes="\(max-width: 760px\) 168px, 214px"/);
  assert.match(priority, /fetchPriority="high"/);
  assert.match(priority, /<img [^>]*loading="eager"/);
  assert.match(priority, /<img [^>]*width="1024"[^>]*height="217"/);

  const lazy = renderToStaticMarkup(createElement(SiteImage, { src: '/media/splash/glide-poster-v1.webp', width: 192, height: 108, alt: '', className: 'thumbnail' }));
  assert.doesNotMatch(lazy, /<link rel="preload"/);
  assert.match(lazy, /<img [^>]*alt=""/);
  assert.match(lazy, /<img [^>]*width="192"[^>]*height="108"/);
  assert.match(lazy, /<img [^>]*loading="lazy"/);
  assert.match(lazy, /<img [^>]*class="thumbnail"/);
});

test('local source validation rejects remote, protocol-relative and malformed paths', () => {
  const base = { width: 192, height: 108, alt: '' };
  for (const src of [
    'https://example.com/a.png', 'data:image/png;base64,abc', '//example.com/a.png', 'relative.png',
    '/private/a.png', '/media/other/a.png', '/brandish/a.png', '/brand/../private/a.png',
    '/brand/%2e%2e/private.png', '/brand/%252e%252e/private.png', '/brand/a%2fb.png',
    '/brand/a%5cb.png', '/brand/a%00b.png', '/brand/a%0ab.png', '/brand/a%GG.png',
    '/brand/a\\b.png', '/brand/a\nb.png', '/brand/a#fragment.png', '/brand//a.png',
    '/brand/a.png?x=%2fprivate', '/brand/a.png?x=%5cprivate', '/brand/a.png?x=%GG',
  ]) {
    assert.throws(() => siteImageAttributes({ ...base, src }), /valid public artwork path/, src);
  }
  assert.equal(siteImageAttributes({ ...base, src: '/brand/logo.svg' }).src, '/brand/logo.svg');
  assert.equal(siteImageAttributes({ ...base, src: '/brand/logo.png?version=1' }).src, '/_next/image?url=%2Fbrand%2Flogo.png%3Fversion%3D1&w=384&q=75');
  assert.equal(siteImageAttributes({ ...base, src: '/brand/logo.png?version=1&dpl=release-7' }).src, '/_next/image?url=%2Fbrand%2Flogo.png%3Fversion%3D1&w=384&q=75&dpl=release-7');
});

test('original six-caller image migration remains authenticated beside current callers', async () => {
  const originalHashes = {
    'app/brand-preview/page.tsx': 'd1b18bee7f55b09b3ff97bc018cd37b30d114a8e778cb805ad1aa7f87d0f9c2f',
    'app/splash-preview/page.tsx': 'f862591d8c3820a0e27d69e01f96fd7df80af8e914e80b708f1ce522791e3d8d',
    'components/AtlasModalityCards.tsx': 'e0dd1f9c270ab8d9040cafa3ffd893de48baeca60d614168076e79d22db02dfd',
    'components/BrandLockup.tsx': 'b6065152d812f48701868d95477c48d3272eb0c5d5015f55753388d42d4a3ae0',
    'components/CinematicFilm.tsx': '321e565fb3ed2c42b59f1d0ce78a7e53b3cb3f74bee028c92f57bbd1f0fc6cba',
    'components/SplashScreen.tsx': '2d7f6f8243826954906792121c921f6e967ec3a6daaa21bc99d21f5af483a116',
  };
  for (const [path, originalHash] of Object.entries(originalHashes)) {
    const current = await readFile(resolve(import.meta.dirname, '..', path), 'utf8');
    // Freeze the admitted migration witness; later Atlas copy changes have their own rendered tests.
    const text = path === 'components/AtlasModalityCards.tsx'
      ? await readFile(resolve(import.meta.dirname, 'fixtures/site-image-initial-atlas-cards.tsx.raw'), 'utf8')
      : current;
    const importPattern = /import Image from ["'](?:\.\.\/\.\.\/components|\.)\/SiteImage["'];/g;
    assert.equal([...text.matchAll(importPattern)].length, 1, `${path}: exactly one migrated import`);
    const restored = text.replace(importPattern, path === 'components/AtlasModalityCards.tsx' ? "import Image from 'next/image';" : 'import Image from "next/image";');
    assert.equal(createHash('sha256').update(restored).digest('hex'), originalHash, `${path}: all other bytes preserved`);
    assert.doesNotMatch(text, /next\/image/, path);
    assert.equal([...current.matchAll(importPattern)].length, 1, `${path}: current caller uses the migrated image`);
    assert.doesNotMatch(current, /next\/image/, path);
  }
});

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { atlasPublicBrandImagePlugin } from '../scripts/atlas-public-brand-image-plugin.mjs';

const root = resolve(process.env.VM_BRAND_WEBSITE_ROOT ?? process.cwd());
const generatedBrand = resolve(root, 'atlas-review/app/brand.tsx');
const proposedAdapter = resolve(import.meta.dirname, '../components/AtlasPublicBrandImage.tsx');
const requireFromWebsite = createRequire(resolve(root, 'package.json'));

test('only the canonical generated brand module is transformed', async () => {
  const plugin = atlasPublicBrandImagePlugin({ root });
  const brand = resolve(root, 'atlas-review/app/brand.tsx');
  const source = await readFile(brand, 'utf8');
  assert.equal(plugin.enforce, 'pre');
  const expected = source.replace("import Image from 'next/image';", "import Image from '../../components/AtlasPublicBrandImage';");
  for (const id of [brand, brand.replaceAll('\\', '/') + '?v=123', '/' + brand.replaceAll('\\', '/') + '#variant']) {
    assert.equal(plugin.transform(source, id).code, expected);
  }
  for (const id of [undefined, '', 'brand.tsx', resolve(root, 'components/BrandLockup.tsx'), resolve(root, 'atlas-review/app/brand.tsx.bak')]) {
    assert.equal(plugin.transform(source, id), null, String(id));
  }
  for (const changed of [
    source.replace("import Image from 'next/image';", 'import Image from "next/image";'),
    source + "\nimport OtherImage from 'next/image';\n",
    source.replace("import Image from 'next/image';", ''),
  ]) assert.throws(() => plugin.transform(changed, brand), /Generated Atlas brand image import has changed/);
});

test('Vite transforms the brand import before its image resolver can see it', async () => {
  const { createServer } = await import(pathToFileURL(requireFromWebsite.resolve('vite')).href);
  let imageResolutionAttempts = 0;
  const server = await createServer({
    root, configFile: false, server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true },
    plugins: [atlasPublicBrandImagePlugin({ root }), {
      name: 'test-image-alias-sentinel', enforce: 'pre',
      resolveId(source, importer) {
        if (source === 'next/image' && importer?.replaceAll('\\', '/').includes('/atlas-review/app/brand.tsx')) {
          imageResolutionAttempts++;
          throw new Error('Vinext image alias saw generated Brand');
        }
        if (source === '../../components/AtlasPublicBrandImage') return proposedAdapter;
        return null;
      },
    }],
  });
  try {
    const transformed = await server.transformRequest('/atlas-review/app/brand.tsx');
    assert.ok(transformed?.code);
    assert.match(transformed.code, /AtlasPublicBrandImage/);
    assert.doesNotMatch(transformed.code, /next\/image/);
    assert.equal(imageResolutionAttempts, 0);
  } finally {
    await server.close();
  }
});

test('the unchanged generated Brand renders both public lockups through the native adapter', async () => {
  const source = await readFile(generatedBrand, 'utf8');
  assert.match(source, /import Image from 'next\/image';/);
  assert.match(source, /unoptimized/);
  const { build } = await import(pathToFileURL(requireFromWebsite.resolve('esbuild')).href);
  const rewritten = atlasPublicBrandImagePlugin({ root }).transform(source, generatedBrand).code;
  let vinextImageResolutionAttempts = 0;
  const { outputFiles } = await build({
    stdin: { contents: rewritten, resolveDir: resolve(root, 'atlas-review/app'), sourcefile: generatedBrand, loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    packages: 'external', jsx: 'automatic',
    plugins: [{
      name: 'test-generated-brand-route',
      setup(bundler) {
        bundler.onResolve({ filter: /^next\/image$/ }, () => {
          vinextImageResolutionAttempts++;
          throw new Error('Generated Brand reached next/image resolution');
        });
        bundler.onResolve({ filter: /AtlasPublicBrandImage$/ }, () => ({ path: proposedAdapter }));
        bundler.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'next/link', namespace: 'test-link' }));
        bundler.onLoad({ filter: /.*/, namespace: 'test-link' }, () => ({
          contents: 'import * as React from "react"; export default function Link({href,children,...rest}) { return React.createElement("a", {href,...rest}, children); }',
          loader: 'js', resolveDir: root,
        }));
      },
    }],
  });
  assert.equal(vinextImageResolutionAttempts, 0);
  const module = { exports: {} };
  runInNewContext(outputFiles[0].text, { module, exports: module.exports, require: requireFromWebsite });
  const React = requireFromWebsite('react');
  const { renderToStaticMarkup } = requireFromWebsite('react-dom/server');
  for (const [surface, suffix] of [['dark', 'dark'], ['light', 'light']]) {
    const markup = renderToStaticMarkup(React.createElement(module.exports.Brand, { surface }));
    assert.match(markup, /<a href="\/" class="vm-brand" aria-label="Visible Medicine by Elivion — anatomy home">/);
    assert.match(markup, new RegExp(`<img[^>]*src="/brand/approved/visible-medicine-lockup-${suffix}\\.png"`));
    assert.match(markup, /<img[^>]*alt="Visible Medicine by Elivion"/);
    assert.match(markup, new RegExp(`<img[^>]*width="1024"[^>]*height="${surface === 'light' ? 217 : 205}"`));
    assert.match(markup, /<img[^>]*loading="lazy"[^>]*decoding="async"[^>]*data-nimg="1"/);
    assert.doesNotMatch(markup, /_next\/image|srcset=|<link rel="preload"/i);
  }
  const defaultMarkup = renderToStaticMarkup(React.createElement(module.exports.Brand));
  assert.match(defaultMarkup, /\/brand\/approved\/visible-medicine-lockup-dark\.png/);
});

test('approved public PNG bytes and intrinsic dimensions are pinned', async () => {
  const expected = {
    dark: { sha256: '360265d257a9eb3d8adf9535de686363c5d5cc6e0051bd6e5aa3ef5e664c2e98', bytes: 111431, imageSize: [1024, 205] },
    light: { sha256: 'b99ff216f299d62541cd7ecd73b0ad12cdba7d7e289069d3189a1dd75aa30c42', bytes: 121818, imageSize: [1024, 217] },
  };
  for (const [surface, pin] of Object.entries(expected)) {
    const path = `/brand/approved/visible-medicine-lockup-${surface}.png`;
    const bytes = await readFile(resolve(root, `public${path}`));
    assert.equal(bytes.length, pin.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), pin.sha256);
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], pin.imageSize);
    const atlasCopy = await readFile(resolve(root, `public/atlas-runtime/head-neck/brand/visible-medicine-lockup-${surface}.png`));
    assert.deepEqual(bytes, atlasCopy);
  }
});

test('the adapter rejects calls outside the generated image contract', async () => {
  const { transform } = await import(pathToFileURL(requireFromWebsite.resolve('esbuild')).href);
  const { code } = await transform(await readFile(proposedAdapter, 'utf8'), { loader: 'tsx', format: 'cjs', jsx: 'automatic' });
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports, require: requireFromWebsite });
  const valid = { src: '/brand/visible-medicine-lockup-dark.png', alt: 'Visible Medicine by Elivion', width: 1005, height: 202, unoptimized: true };
  for (const override of [
    { src: 'https://example.invalid/logo.png' }, { src: '/brand/other.png' },
    { width: 1 }, { height: 1 }, { alt: '' }, { unoptimized: false },
  ]) assert.throws(() => module.exports.default({ ...valid, ...override }), /Unsupported generated Atlas brand image props/);
});

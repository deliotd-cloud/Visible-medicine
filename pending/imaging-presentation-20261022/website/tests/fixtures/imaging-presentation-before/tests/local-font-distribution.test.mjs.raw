import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = name => readFileSync(new URL(name, root));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('root font uses a pinned local asset with the existing body variable', () => {
  const layout = read('app/layout.tsx').toString();
  assert.match(layout, /import localFont from "next\/font\/local";/);
  assert(!layout.includes('next/font/google'));
  assert.match(layout, /src: "\.\.\/public\/fonts\/geist-mono-latin\.woff2"/);
  assert.match(layout, /variable: "--font-atlas-mono"/);
  assert.match(layout, /weight: "100 900", style: "normal", display: "swap"/);
  assert.match(layout, /<body className=\{geistMono\.variable\}>/);
});

test('shipped Latin font is the unchanged reviewed WOFF2, not a synthetic replacement', () => {
  const bytes = read('public/fonts/geist-mono-latin.woff2');
  assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
  assert.equal(bytes.length, 23108);
  assert.equal(sha(bytes), '5f3d6ad60f29d6cb708414ec6887163d63bf197377ef5417d2483ff31ace6c3b');
});

test('full upstream font licence accompanies the source and public copy', () => {
  const licence = read('LICENSES/geist-mono-OFL.txt');
  assert.deepEqual(licence, read('public/licenses/geist-mono-OFL.txt'));
  assert.equal(sha(licence), '1781d2806a07d91c4edf4740b88449fab7d0eadad53f7c351b94cd4d4eb8c00f');
  assert.match(licence.toString(), /Copyright 2024 The Geist Project Authors/);
  assert.match(licence.toString(), /SIL OPEN FONT LICENSE Version 1\.1/);
  const notices = read('LICENSES/THIRD_PARTY_NOTICES.md').toString();
  assert.match(notices, /Pinned local Geist Mono font/);
  assert.match(notices, /\/licenses\/geist-mono-OFL\.txt/);
  assert.match(notices, /not an independently restored upstream font-byte provenance claim/);
});

test('installed local-font transform imports the asset independently of the Google cache', async () => {
  const pluginFile = new URL('../node_modules/vinext/dist/plugins/fonts.js', import.meta.url);
  const { createLocalFontsPlugin } = await import(pluginFile.href);
  const plugin = createLocalFontsPlugin();
  const layout = read('app/layout.tsx').toString();
  const output = plugin.transform.handler(layout, '/synthetic-project/app/layout.tsx');
  assert(output?.code);
  assert.match(output.code, /import __vinext_local_font_0 from "\.\.\/public\/fonts\/geist-mono-latin\.woff2"/);
  assert.match(output.code, /src: __vinext_local_font_0/);
  assert.match(output.code, /family: "geistMono"/);
  assert(!output.code.includes('fonts.googleapis.com'));
  assert(!output.code.includes('.vinext/fonts'));
});

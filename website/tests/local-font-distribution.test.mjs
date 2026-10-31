import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';

const root = process.env.VM_WEBSITE_ROOT ? pathToFileURL(process.env.VM_WEBSITE_ROOT.replaceAll('\\','/')+'/') : new URL('../', import.meta.url);
const {readPresentationFontBeforeProvenance,assertPresentationFontProvenance}=await import(new URL('tests/partition10-font-history.mjs',root));
const read = name => readFileSync(new URL(name, root));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('historical local-font loader used the pinned asset and body variable (not current delivery)', () => {
  const layout = read('tests/fixtures/imaging-presentation-before/app/layout.tsx.raw').toString();
  assert.match(layout, /import localFont from "next\/font\/local";/);
  assert(!layout.includes('next/font/google'));
  assert.match(layout, /src: "\.\.\/public\/fonts\/geist-mono-latin\.woff2"/);
  assert.match(layout, /variable: "--font-atlas-mono"/);
  assert.match(layout, /weight: "100 900", style: "normal", display: "swap"/);
  assert.match(layout, /<body className=\{geistMono\.variable\}>/);
});

test('historical Latin font retains its exact reviewed bytes before the official replacement', () => {
  const bytes = readPresentationFontBeforeProvenance();
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
  const historicalRoot='F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate';
  const receiptBytes=readFileSync(join(historicalRoot,'SOURCE_V2.json'));
  assert.equal(sha(receiptBytes),'d388db43518ff7ccd443a8e7977e7ac67b2f49a696eb294529992ba64fc4132d');
  const role=JSON.parse(receiptBytes).sourceRows.filter(row=>row.path==='LICENSES/THIRD_PARTY_NOTICES.md');
  assert.equal(role.length,1);assert.equal(role[0].sha256,'2ce224dcf5634635b98d88b65d2549c19bc0cdd8fb3236b430f114268a0ba503');
  const historicalNotice=readFileSync(join(historicalRoot,'website',role[0].path));
  assert.equal(historicalNotice.length,role[0].bytes);assert.equal(sha(historicalNotice),role[0].sha256);
  assert.match(historicalNotice.toString(), /not an independently restored upstream font-byte provenance claim/);
  assertPresentationFontProvenance({read});
});

test('historical loader transform imports the asset independently of the Google cache (not HTTP acceptance)', async () => {
  const pluginFile = new URL('node_modules/vinext/dist/plugins/fonts.js', root);
  const { createLocalFontsPlugin } = await import(pluginFile.href);
  const plugin = createLocalFontsPlugin();
  const layout = read('tests/fixtures/imaging-presentation-before/app/layout.tsx.raw').toString();
  const output = plugin.transform.handler(layout, '/synthetic-project/app/layout.tsx');
  assert(output?.code);
  assert.match(output.code, /import __vinext_local_font_0 from "\.\.\/public\/fonts\/geist-mono-latin\.woff2"/);
  assert.match(output.code, /src: __vinext_local_font_0/);
  assert.match(output.code, /family: "geistMono"/);
  assert(!output.code.includes('fonts.googleapis.com'));
  assert(!output.code.includes('.vinext/fonts'));
});

test('current bundled font is the exact attributed official response, with its full OFL',()=>{
 assertPresentationFontProvenance({read});
 const originalRead=read;
 assert.throws(()=>assertPresentationFontProvenance({read:p=>p==='public/fonts/geist-mono-latin.woff2'?Buffer.from('wOF2forged'):originalRead(p)}));
});

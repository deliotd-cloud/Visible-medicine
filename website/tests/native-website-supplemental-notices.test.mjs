import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p)),sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(read('LICENSES/native-website/supplemental-manifest.json'));
const publicText=read('public/licenses/native-website-supplemental-NOTICES.txt').toString();

test('supplemental notices bind the exact installed package versions and metadata',()=>{
  assert.equal(manifest.schema,'vm-native-website-supplemental-notices/1');
  assert.deepEqual(manifest.entries.map(({name,version})=>[name,version]),[['@react-three/fiber','9.7.0'],['@vitejs/plugin-rsc','0.5.34'],['@bufbuild/protobuf','1.10.1']]);
  for(const entry of manifest.entries){const bytes=read('node_modules/'+entry.name+'/package.json'),pkg=JSON.parse(bytes);assert.equal(sha(bytes),entry.installedPackageJsonSha256);assert.equal(pkg.version,entry.version);assert.equal(pkg.license,entry.license);assert.equal(new URL(entry.upstream.packageUrl).hostname,'raw.githubusercontent.com');assert(entry.upstream.packageUrl.includes('/'+entry.upstream.ref+'/'));}
});

test('all retained licence terms are distributed completely and without machine paths',()=>{
  assert.equal(manifest.entries.flatMap(e=>e.notices).length,5);
  for(const entry of manifest.entries){assert(publicText.includes(entry.name+' '+entry.version));for(const notice of entry.notices){assert.match(notice.path,/^LICENSES\/native-website\/[a-zA-Z0-9.-]+\.txt$/);const bytes=read(notice.path);assert.equal(sha(bytes),notice.sha256);assert(publicText.includes(bytes.toString()),notice.path);}}
  assert.doesNotMatch(publicText,/(?:^|\s)[A-Z]:[\\/]|localhost|127\.0\.0\.1|CortexData|\.env/im);
  assert(read('app/credits/page.tsx').toString().includes('href="/licenses/native-website-supplemental-NOTICES.txt"'));
});

test('Protocol Buffers retains both Apache terms and its complete embedded BSD notice',()=>{
  const entry=manifest.entries.find(e=>e.name==='@bufbuild/protobuf');assert.equal(entry.license,'(Apache-2.0 AND BSD-3-Clause)');
  for(const suffix of ['Buf-NOTICE.txt','Google-BSD-NOTICE.txt']){const n=entry.notices.find(n=>n.path.endsWith(suffix)),installed=read(n.sourceFile).toString(),prefix=installed.match(/^(?:\/\/[^\r\n]*(?:\r?\n|$))+/)[0];assert.equal(read(n.path).toString(),prefix);}
  assert(publicText.includes('Neither the name of Google Inc.'));assert(publicText.includes('END OF TERMS AND CONDITIONS'));assert(publicText.includes('Copyright 2021-2024 Buf Technologies, Inc.'));
});

test('unresolved image-library notices remain explicit and never become licence clearance',()=>{
  assert.deepEqual(manifest.unresolved.map(e=>[e.name,e.version]),[['@unpic/core','1.0.3'],['unpic','4.2.2']]);
  assert.match(manifest.scope,/not a whole-website rights clearance/);
  for(const e of manifest.unresolved)assert(!manifest.entries.some(n=>n.name===e.name));
  assert.doesNotMatch(publicText,/all (?:software|packages|assets).*cleared|approved for commercial use/i);
});

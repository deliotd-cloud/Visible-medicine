import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verifyNativeBodyRendererSeal} from '../scripts/verify-native-body-renderer-seal.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const entrypoints=[
  'app/body-explorer.tsx','app/layout.tsx','app/globals.css','vite.config.ts',
  'package.json','package-lock.json','scripts/compress-model-delivery.mjs',
  'scripts/glb-lossless-codec.mjs',
];
const sources=new Map([
  ['app/body-explorer.tsx',"import {orientation} from './orientation'; export const scene=orientation;\n"],
  ['app/orientation.ts',"export const orientation='anterior';\n"],
  ['app/layout.tsx',"export default function Layout(){return null;}\n"],
  ['app/globals.css',"@import './detail.css';\n"],
  ['app/detail.css','.detail{display:block}\n'],
  ['vite.config.ts','export default {};\n'],
  ['package.json','{"private":true}\n'],
  ['package-lock.json','{"lockfileVersion":3}\n'],
  ['scripts/compress-model-delivery.mjs','export const codec=true;\n'],
  ['scripts/glb-lossless-codec.mjs','export const lossless=true;\n'],
]);
const sealed=source=>{
  const dependencies=[...source].map(([path,text])=>({path,sha256:sha(text.replaceAll('\r\n','\n'))}))
    .sort((a,b)=>a.path.localeCompare(b.path));
  return {schemaVersion:1,scope:'root-body-renderer',entrypoints,
    dependencies,sha256:sha(JSON.stringify(dependencies))};
};
const verify=(source,seal=sealed(source))=>verifyNativeBodyRendererSeal({seal,
  names:new Set(source.keys()),read:async paths=>new Map(paths.map(path=>[path,source.get(path)]))});

test('fresh committed-style source closure accepts LF and CRLF transport',async()=>{
  const copy=new Map(sources);copy.set('app/orientation.ts',copy.get('app/orientation.ts').replaceAll('\n','\r\n'));
  const result=await verify(copy,sealed(sources));
  assert.equal(result.dependencies,sources.size);
});

test('same-size change, missing dependency and forged shortened list all reject',async()=>{
  const changed=new Map(sources);changed.set('app/orientation.ts',changed.get('app/orientation.ts').replace('anterior','inferior'));
  await assert.rejects(verify(changed,sealed(sources)),/Stale body renderer seal: app\/orientation\.ts/);
  const missing=new Map(sources);missing.delete('app/orientation.ts');
  await assert.rejects(verify(missing,sealed(sources)),/Unresolved renderer import/);
  const forged=sealed(sources);
  forged.dependencies=forged.dependencies.filter(row=>row.path!=='app/orientation.ts');
  forged.sha256=sha(JSON.stringify(forged.dependencies));
  await assert.rejects(verify(sources,forged),/Stale body renderer seal: app\/orientation\.ts/);
  const cssForged=sealed(sources);cssForged.dependencies=cssForged.dependencies.filter(row=>row.path!=='app/detail.css');
  cssForged.sha256=sha(JSON.stringify(cssForged.dependencies));
  await assert.rejects(verify(sources,cssForged),/Stale body renderer seal: app\/detail\.css/);
});

test('importer binds unchanged generator and validates before any output write',()=>{
  const source=readFileSync(new URL('../scripts/import-clinical-review.mjs',import.meta.url),'utf8');
  const generator=source.indexOf("readCommitted(['scripts/body-renderer-revisions.mjs'])");
  const check=source.indexOf('await verifyNativeBodyRendererSeal(');
  const firstMkdir=source.indexOf('mkdirSync('),firstWrite=source.indexOf('writeFileSync(');
  assert(generator>0&&check>generator&&firstMkdir>check&&firstWrite>check);
  assert(source.includes('6a297c3c75b427d275e3c63dc5a275b880430667237b1b3fa0f1991b9a4f4baf'));
  assert(source.includes("'cat-file', '--batch'"),'Committed blobs remain batched');
});

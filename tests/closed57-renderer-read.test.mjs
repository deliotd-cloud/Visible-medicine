import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {readRevision54} from './historical-current-atlas-delivery-54.mjs';
import {readRevision55} from './historical-current-atlas-delivery-55.mjs';
import {readRevision56} from './historical-current-atlas-delivery-56.mjs';
import {readRevision57} from './historical-current-atlas-delivery-57.mjs';

const path='components/HeadAtlasViewer.tsx';
const digest='06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=readFileSync(new URL('./fixtures/closed57-overrides/components/HeadAtlasViewer.raw',import.meta.url));

test('closed54/55/56/57 retrieve one raw, metadata-bound historical viewer',()=>{
 assert.equal(fixture.length,107435);
 assert.equal(sha(fixture),digest);
 for(const [epoch,read] of [[54,readRevision54],[55,readRevision55],[56,readRevision56],[57,readRevision57]]){
  const bytes=read(path,{readLive:()=>Buffer.from('forged live component')});
  assert(Buffer.isBuffer(bytes),`closed${epoch} must return raw bytes`);
  assert(bytes.equals(fixture),`closed${epoch} old viewer bytes`);
 }
});

test('the historical seam does not admit undeclared paths or forged ordinary inputs',()=>{
 for(const read of [readRevision54,readRevision55,readRevision56,readRevision57]){
  assert.throws(()=>read('components/HeadAtlasViewer.tsx/../secret'));
  assert.throws(()=>read('components/NotDeclaredViewer.tsx'));
  assert.throws(()=>read('components/HeadAtlasComparisonNavigation.tsx',{readLive:()=>Buffer.from('forged ordinary input')}));
 }
});

test('closed57 Review viewer resolves its own frozen payload rather than closed56 or live bytes',()=>{
 const path='public/atlas-review-viewer/index.html';
 const expected=readFileSync(new URL('./fixtures/closed57-viewer/'+path,import.meta.url));
 const actual=readRevision57(path,{readLive:()=>Buffer.from('forged later viewer')});
 assert(actual.equals(expected));
 const manifest=JSON.parse(readRevision57('public/atlas-review-viewer/manifest.json'));
 assert.equal(sha(actual),manifest.files.find(row=>row.path==='index.html').sha256);
});

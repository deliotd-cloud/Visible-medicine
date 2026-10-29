import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {restorePreGuidedCaption} from './head-guided-caption-inverse.mjs';
const root=process.env.VM_WEBSITE_ROOT||resolve(fileURLToPath(new URL('../',import.meta.url)));
const current=readFileSync(resolve(root,'components/HeadAtlasGuidedModel.tsx'),'utf8').replaceAll('\r\n','\n');
const sha=s=>createHash('sha256').update(s).digest('hex');
test('caption inverse restores the exact prior wrapper, retaining all non-caption behaviour',()=>{
  assert.equal(sha(restorePreGuidedCaption(current)),"c10c75828276cf858fae4397d04cb16ca7962e1221d9ce0e2abe778d1fa9cf39");
});
test('caption inverse rejects a missing or altered announcement guard',()=>{
  assert.throws(()=>restorePreGuidedCaption(current.replace("liveStatus.current!=='ready'","false")));
  assert.throws(()=>restorePreGuidedCaption(current.replace('  const announced=useRef<string|null>(null);\n','')));
});
test('caption inverse rejects repeated seams and unrelated source drift',()=>{
  assert.throws(()=>restorePreGuidedCaption(current+"\n  const announced=useRef<string|null>(null);\n"));
  assert.throws(()=>restorePreGuidedCaption(current.replace('pending.current!==null','false')));
});
test('caption inverse does not silently admit the old wrapper as current',()=>{
  assert.throws(()=>restorePreGuidedCaption(restorePreGuidedCaption(current)));
});

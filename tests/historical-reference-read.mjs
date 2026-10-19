import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {historicalInline46Read} from './historical-inline-46-epoch.mjs';
const root=new URL('../',import.meta.url),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const registry=fs.readFileSync(new URL('tests/fixtures/historical-unchanged-support.json',root));
assert.equal(sha(registry),'f80cdee10bf2bab575a62a7acbd09cd8cad2046265c72bdce1832aae88df3f65');
const support=JSON.parse(registry);
/** Older tests may read their unchanged fixtures, never unchecked current source. */
export function historicalInline46OrSupportRead(relative){
 if(Object.hasOwn(support,relative)){
  assert((relative.startsWith('tests/fixtures/')||relative==='tests/head-asset-checksum-binding.test.mjs')&&!relative.includes('..')&&!relative.includes('\\'));
  const bytes=fs.readFileSync(new URL(relative,root));
  assert.equal(sha(bytes),support[relative],'Original historical fixture changed: '+relative);
  return bytes;
 }
 return historicalInline46Read(relative);
}

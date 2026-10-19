import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {historicalInline46OrSupportRead} from './historical-reference-read.mjs';
test('historical support reads retain exact originals and refuse unchecked source',()=>{
 const registry=readFileSync(new URL('./fixtures/historical-unchanged-support.json',import.meta.url));
 assert.equal(createHash('sha256').update(registry).digest('hex'),'f80cdee10bf2bab575a62a7acbd09cd8cad2046265c72bdce1832aae88df3f65');
 const records=JSON.parse(registry);assert.equal(Object.keys(records).length,266);
 for(const p of ['tests/fixtures/completion-checklist-42.json','tests/head-asset-checksum-binding.test.mjs'])
  assert.equal(createHash('sha256').update(historicalInline46OrSupportRead(p)).digest('hex'),records[p]);
 for(const p of ['../.env.local','.env.local','tests/no-such-archive.mjs','atlas-review/content/posterior-fossa-ultrasound.ts'])
  assert.throws(()=>historicalInline46OrSupportRead(p));
});

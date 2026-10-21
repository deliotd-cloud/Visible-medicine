import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

// Package/read-only companion checks only. Model, access and rights validation
// remain in the existing inventory and protected-delivery implementations.
function prebuildChecks(command){
 assert.equal(typeof command,'string');
 const steps=command.split(/\s*&&\s*/);
 for(const expected of ['node scripts/verify-clinical-review.mjs','node scripts/atlas-model-inventory.mjs --check','npm run verify:atlas-delivery-policy'])
  assert(steps.includes(expected),'Prebuild must retain the read-only gate: '+expected);
}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('ordinary builds check runtime assets and notices without regenerating the inventory',()=>{
 const command=JSON.parse(readFileSync('package.json')).scripts.prebuild;
 prebuildChecks(command);
 for(const bad of [command.replace(' && node scripts/atlas-model-inventory.mjs --check',''),command.replace('atlas-model-inventory.mjs --check','atlas-model-inventory.mjs'),command.replace('atlas-model-inventory.mjs --check','atlas-model-inventory.mjs --check || true')])
  assert.throws(()=>prebuildChecks(bad));
});
test('each generated runtime retains the complete declared LICENSE bytes',()=>{
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const base='public/atlas-runtime/'+module+'/',manifest=JSON.parse(readFileSync(base+'manifest.json'));
  const records=manifest.files.filter(row=>row.path==='LICENSE');assert.equal(records.length,1,module);
  const bytes=readFileSync(base+'LICENSE'),record=records[0];assert.equal(bytes.length,record.bytes,module+': length');assert.equal(sha(bytes),record.sha256,module+': digest');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);assert(text.includes('MIT License')&&text.includes('Copyright (c) 2026 Visible Medicine')&&text.includes('Third-party assets are not relicensed by this MIT grant.'),module+': legal notices retained');
 }
});

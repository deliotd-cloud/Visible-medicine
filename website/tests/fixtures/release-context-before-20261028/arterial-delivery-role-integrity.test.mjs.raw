import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadArterialFixture,authenticateArterialCollector,originalArterialCollectorPayload,assertFiniteRow,assertArterialRoleIdentity,assertCompleteArterialChild,arterialChildEnvironment} from './arterial-delivery-roles.mjs';
const subject='tests/atlas-arterial-evidence-limits.test.mjs';
const read=name=>fs.readFileSync(new URL(name,import.meta.url));

test('arterial whole-source byte inverse refuses foreign originals, wrappers and weakened assertions',()=>{
 const f=loadArterialFixture(),original=read('./fixtures/arterial-delivery-roles/original-six.mjs.raw'),collector=read('./atlas-arterial-evidence-limits.test.mjs');
 assert.deepEqual(authenticateArterialCollector(subject,collector),original);
 assert.deepEqual(originalArterialCollectorPayload(collector),original);
 const weakenedPayload=Buffer.from(collector.toString().replace('assert.equal(refused,142);','assert.equal(refused,141);'));
 assert.throws(()=>originalArterialCollectorPayload(weakenedPayload));assert.throws(()=>authenticateArterialCollector(subject,weakenedPayload));
 assert.deepEqual(authenticateArterialCollector(subject,original),original);
 const changed=Buffer.from(collector);changed[0]^=1;
 for(const bytes of [changed,Buffer.concat([collector,Buffer.from('/* foreign */')]),Buffer.from(original.toString().replace("assert.equal(CURRENT_ATLAS_REVISION,'6e810b188dde401f6c19a970928f316a479696df');","assert.equal(CURRENT_ATLAS_REVISION,'727ed5b451ae940a01e56272c8fbc703ea3b0095');")),Buffer.from(original.toString().replace('assert.equal(refused,142);','assert.equal(refused,141);'))]){
  assert.throws(()=>authenticateArterialCollector(subject,bytes));
 }
 const row={path:'original-six.mjs.raw',...f.original6};assertFiniteRow(row,original);
 assert.throws(()=>assertFiniteRow(row,Buffer.concat([original,Buffer.from('\n')])));
 const different=Buffer.from(original);different[0]^=1;assert.throws(()=>assertFiniteRow(row,different));
 assert.strictEqual(authenticateArterialCollector('tests/unrelated.test.mjs',collector),collector,'No global source replacement');
});

test('historical, installed and current arterial delivery identities refuse cross-role and family changes',()=>{
 const f=loadArterialFixture();
 for(const role of ['original6','installed','current']){
  const pin=structuredClone(f.identities[role]);assertArterialRoleIdentity(role,pin);
  for(const other of ['original6','installed','current'].filter(r=>r!==role))assert.throws(()=>assertArterialRoleIdentity(role,f.identities[other]));
  for(const key of ['source','sourceTree','reviewIntegration']){const changed=structuredClone(pin);changed[key]='0'.repeat(key==='reviewIntegration'?64:40);assert.throws(()=>assertArterialRoleIdentity(role,changed));}
  for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){const changed=structuredClone(pin);changed.runtimeSources[name]='0'.repeat(40);assert.throws(()=>assertArterialRoleIdentity(role,changed));}
 }
 assert.throws(()=>assertArterialRoleIdentity('unreviewed',f.identities.current));
});

function terminal(cases){return 'TAP version 13\n'+Array.from({length:cases},(_,i)=>`ok ${i+1} - original case ${i+1}\n`).join('')+`1..${cases}\n# tests ${cases}\n# pass ${cases}\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n`;}
test('complete native six/two child transport refuses skips, missing roots/counts, signals and reporter inheritance',()=>{
 const result={code:0,signal:null};
 for(const cases of [6,2]){
  const tap=terminal(cases);assert.equal(assertCompleteArterialChild(result,tap,cases).tests,cases);
  for(const bad of [{code:1,signal:null},{code:0,signal:'SIGTERM'},{code:0,signal:null,error:'ENOENT'}])assert.throws(()=>assertCompleteArterialChild(bad,tap,cases));
  for(const broken of [tap.replace('ok 1 -','not ok 1 -'),tap.replace('ok 1 - original case 1','ok 1 - original case 1 # SKIP'),tap.replace('ok 1 - original case 1','ok 1 - original case 1 # TODO'),terminal(cases-1),tap.replace('# skipped 0','# skipped 1'),tap.replace('# todo 0','# todo 1'),tap.replace('# cancelled 0','# cancelled 1'),tap.replace('# pass '+cases,'# pass '+(cases-1)),tap.replace('# tests '+cases+'\n',''),tap.replace(`1..${cases}\n`,''),tap+`1..${cases}\n`,tap+'Bail out! foreign\n',tap.replace('ok 1 - original case 1\n','')])assert.throws(()=>assertCompleteArterialChild(result,broken,cases));
 }
 const env=arterialChildEnvironment({NODE_TEST_CONTEXT:'child-v8',NODE_OPTIONS:'--test-name-pattern=only',VM_ATLAS_SOURCE_REPO:'wrong',DATABASE_URL:'remote',OPENAI_API_KEY:'synthetic-secret',ComSpec:'cmd.exe'},'F:/historical-atlas');
 assert.equal(env.NODE_TEST_CONTEXT,undefined);assert.equal(env.DATABASE_URL,undefined);assert.equal(env.OPENAI_API_KEY,undefined);assert.equal(env.ComSpec,'cmd.exe');assert.equal(env.VM_ATLAS_SOURCE_REPO,'F:/historical-atlas');assert.equal(env.ATLAS_SOURCE_REPO,'F:/historical-atlas');assert.equal(env.NODE_OPTIONS,'--max-old-space-size=768');
});

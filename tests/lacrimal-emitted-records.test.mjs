import assert from 'node:assert/strict';
import test from 'node:test';
import {assertLacrimalEmittedPin} from './lacrimal-emitted-records.mjs';

const expected = {id:'vm:anatomy:body:head-neck:right:organ:right-nasolacrimal-duct',
  fma:'FMA59555', file:'FJ1353', sourceHash:'abc123', group:'duct'};
const record = `{identity:{id:\`${expected.id}\`,fmaId:\`${expected.fma}\`,sources:[{file:\`${expected.file}\`,sha256:\`${expected.sourceHash}\`}],validation:{anatomicalReview:!1}},group:\`duct\`,anatomy:{readiness:\`draft\`}}`;
const base = `{identity:{id:\`${expected.id}\`,fmaId:\`${expected.fma}\`,sources:[{file:\`${expected.file}\`,sha256:\`${expected.sourceHash}\`}],validation:{anatomicalReview:!1}},previous:{readiness:\`pending\`}}`;
const neighbor = `{identity:{id:\`other\`,fmaId:\`other\`,sources:[{file:\`${expected.file}\`,sha256:\`${expected.sourceHash}\`}],validation:{anatomicalReview:!1}},group:\`duct\`,anatomy:{readiness:\`draft\`}}`;
const module = pin => `const pins=[${base},${pin},${neighbor}];`;

test('selects one complete syntax-bounded teaching pin despite preceding base and following neighbour records',()=>{
  assert.doesNotThrow(()=>assertLacrimalEmittedPin(module(record),expected));
});

for (const [label, changed] of [
  ['changed identity', record.replace(expected.id, 'wrong-id')],
  ['missing identity', record.replace(`id:\`${expected.id}\`,`, '')],
  ['changed FMA', record.replace(expected.fma, 'FMA00000')],
  ['changed source file', record.replace(expected.file, 'FJ0000')],
  ['missing source file', record.replace(`file:\`${expected.file}\`,`, '')],
  ['changed source hash', record.replace(expected.sourceHash, 'wrong-hash')],
  ['missing source hash', record.replace(`,sha256:\`${expected.sourceHash}\``, '')],
  ['changed group', record.replace('group:`duct`', 'group:`sac`')],
  ['missing group', record.replace(',group:`duct`', '')],
  ['changed review flag', record.replace('anatomicalReview:!1', 'anatomicalReview:!0')],
  ['missing review flag', record.replace('anatomicalReview:!1', 'other:!1')],
]) test(`${label} cannot pass through neighbour fields`,()=>{
  assert.throws(()=>assertLacrimalEmittedPin(module(changed),expected));
});

test('duplicate teaching identity fails rather than accepting one matching record',()=>{
  assert.throws(()=>assertLacrimalEmittedPin(module(`${record},${record}`),expected),/one emitted teaching pin/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projectHeadEpoch} from './head-epoch-projections.mjs';
import {restorePreRecoveryCurrentDeliverySource} from './current-delivery-predecessor-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const current=readFileSync(new URL('./current-atlas-delivery.test.mjs',import.meta.url));
const prior=readFileSync('F:/VisibleMedicine/staging/20261027-head-epoch-composition/website/tests/current-atlas-delivery.test.mjs');
test('authenticated Review successor preserves the complete earlier delivery projection',()=>{
 assert.equal(sha(current),'dfd4195012a9ac2661ba28b069416bfb2412d5859c96b71c1149aeacdcd2b2f7');
 assert.equal(sha(restorePreRecoveryCurrentDeliverySource(current.toString('utf8'))),'95f246d6f65f5b6afb06b8e4a9c6eb47a00313e03aadf22bba271822eaea3fdd');
 assert.equal(sha(prior),'7a814c4b0d2ef77feda6c12f7fa6f73eb007cc351a8bbec7cf22b8e480c791d6');
 const projected=projectHeadEpoch('delivery',current);
 assert.deepEqual(projected,projectHeadEpoch('delivery',prior));
 assert.equal(sha(projected),'6a4d43e4a5ca4a6c88b77c63cbb7269eac95d1a4eb678c3622e4b40b1fb911eb');
});
test('successor projection refuses altered bytes, removed assertions, wrong roles and its old output',()=>{
 const removed=Buffer.from(current.toString().replace('assert.throws','void'));assert.notDeepEqual(removed,current);
 for(const bytes of [Buffer.concat([current,Buffer.from('foreign')]),removed,projectHeadEpoch('delivery',current)])assert.throws(()=>projectHeadEpoch('delivery',bytes));
 for(const role of ['native','coverage','unknown'])assert.throws(()=>projectHeadEpoch(role,current));
});

import {restorePilotBeforeSourceRoles} from './head-epoch-projections.mjs';
for(const row of [{"name":"head-neck-pilot-current.test.mjs","path":"tests/head-neck-pilot-current.test.mjs","old":"2891a842e5c4723820ca61cfc51aea533a861809a40c4db8492808584462283d","current":"b9986f08009042b6e12266cb0de311172a3c5521d607eb9423f01bc5666bf3b4","hunks":2,"patch":"23b8ed603b82135d5c88681ae3c94fea58a9065574dd2bf1445ae0f9c1704ddb"},{"name":"head-neck-pilot.test.ts","path":"tests/head-neck-pilot.test.ts","old":"5cb326883f1081550cb9940f4a603b2b9258e57ef41cee068ab3d33d786fc7d9","current":"ba20957e2441f5a6d4f6f0589c7f8c9c1fdb0a7e0124857d3b717339c419e946","hunks":2,"patch":"7ab03cb84e9e819735a60543a9b192cf73f0ff99fd0e208e6d69c23e33448394"}])test('whole pilot successor restores exact historical bytes and rejects mutation: '+row.name,()=>{
 const bytes=readFileSync(new URL('./'+row.name,import.meta.url));
 const restored=restorePilotBeforeSourceRoles(row.name,bytes);
 assert.equal(sha(bytes),row.current);assert.equal(sha(restored),row.old);
 assert.deepEqual(restored,readFileSync('F:/VisibleMedicine/staging/20261027-head-epoch-composition/website/'+row.path));
 assert.throws(()=>restorePilotBeforeSourceRoles(row.name,Buffer.concat([bytes,Buffer.from('foreign')])));
 assert.throws(()=>restorePilotBeforeSourceRoles(row.name,restored));
 assert.throws(()=>restorePilotBeforeSourceRoles('unknown',bytes));
});

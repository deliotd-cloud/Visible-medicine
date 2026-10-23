import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {inspectHeadToolsWiderConsumer,restoreHeadToolsWiderConsumer} from './head-tools-wider-consumer-inverse.mjs';
import './head-tools-wider-consumer-current-role.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const witnesses={
 'desktop-learning-row-history.test.mjs':['./fixtures/head-tools-current-consumer/desktop-learning-row-history.test.mjs.raw','189e900c45910ac63e2227098c0e4187eb69c9854018c893fc172ddaf32639c9'],
 'drawable-epoch-current-admission.test.mjs':['./fixtures/zero-registration-before/drawable-epoch-current-admission.test.mjs.raw','269e7af836b93760fcf460bf39ce1be296a96c1549452b04076a38a52d24c9ce'],
 'head-manual-recovery-54-to-55-closed.test.mjs':['./fixtures/current-source-closure-before/head-manual-recovery-54-to-55-closed.test.mjs.raw','07c63b0d0eb11832ba209715a2c20e42f791c9d171a6902fb950010cfd5443ad'],
 'head-native-history-current-transition.test.mjs':['./fixtures/current-source-closure-before/head-native-history-current-transition.test.mjs.raw','6a2cf5ee21203146e830b696436fa5abc5d41637e818b7e54acfa672d5e5cfb5']
};
const names=Object.keys(witnesses);
for(const name of names)test('complete historical assertions survive exact head-tools role hunks: '+name,()=>{
 const [path,expected]=witnesses[name],intermediate=read(path),prior=read('./fixtures/head-tools-wider-consumer/'+name+'.raw');
 assert.equal(sha(intermediate),expected,name+': complete authenticated intermediate source');
 const proof=inspectHeadToolsWiderConsumer(name,intermediate);
 assert.deepEqual(proof.hunkDigests,proof.spec.hunks);
 assert.deepEqual(restoreHeadToolsWiderConsumer(name,intermediate),prior);
 assert.throws(()=>restoreHeadToolsWiderConsumer(name,Buffer.concat([intermediate,Buffer.from('\n// forged\n')])));
 assert.throws(()=>restoreHeadToolsWiderConsumer(name,prior),'Historical role cannot be substituted for current');
});

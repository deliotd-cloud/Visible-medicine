import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {inspectHeadToolsWiderConsumer,restoreHeadToolsWiderConsumer} from './head-tools-wider-consumer-inverse.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url));
const names=[
 'desktop-learning-row-history.test.mjs',
 'drawable-epoch-current-admission.test.mjs',
 'head-manual-recovery-54-to-55-closed.test.mjs',
 'head-native-history-current-transition.test.mjs'
];
for(const name of names)test('complete historical assertions survive exact head-tools role hunks: '+name,()=>{
 const current=read('./'+name),prior=read('./fixtures/head-tools-wider-consumer/'+name+'.raw');
 const proof=inspectHeadToolsWiderConsumer(name,current);
 assert.deepEqual(proof.hunkDigests,proof.spec.hunks);
 assert.deepEqual(restoreHeadToolsWiderConsumer(name,current),prior);
 assert.throws(()=>restoreHeadToolsWiderConsumer(name,Buffer.concat([current,Buffer.from('\n// forged\n')])));
 assert.throws(()=>restoreHeadToolsWiderConsumer(name,prior),'Historical role cannot be substituted for current');
});

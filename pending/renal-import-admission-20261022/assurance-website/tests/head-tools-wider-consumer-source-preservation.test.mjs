import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {inspectHeadToolsWiderConsumer,restoreHeadToolsWiderConsumer} from './head-tools-wider-consumer-inverse.mjs';
import {restorePreAdmissionDrawable} from './admission-source-roles.mjs';
import {restoreSurfaceDesktopHistoricalTest} from './four-consumer-source-inverse.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url));
const names=[
 'desktop-learning-row-history.test.mjs',
 'drawable-epoch-current-admission.test.mjs',
 'head-manual-recovery-54-to-55-closed.test.mjs',
 'head-native-history-current-transition.test.mjs'
];
for(const name of names)test('complete historical assertions survive exact head-tools role hunks: '+name,()=>{
 const current=read('./'+name),prior=read('./fixtures/head-tools-wider-consumer/'+name+'.raw');
 const role=name==='desktop-learning-row-history.test.mjs'?restoreSurfaceDesktopHistoricalTest(current):
  name==='drawable-epoch-current-admission.test.mjs'?restorePreAdmissionDrawable(current):current;
 const proof=inspectHeadToolsWiderConsumer(name,role);
 assert.deepEqual(proof.hunkDigests,proof.spec.hunks);
 assert.deepEqual(restoreHeadToolsWiderConsumer(name,role),prior);
 const forged=Buffer.concat([current,Buffer.from('\n// forged\n')]);
 assert.throws(()=>name==='desktop-learning-row-history.test.mjs'?restoreSurfaceDesktopHistoricalTest(forged):
  name==='drawable-epoch-current-admission.test.mjs'?restorePreAdmissionDrawable(forged):restoreHeadToolsWiderConsumer(name,forged));
 assert.throws(()=>restoreHeadToolsWiderConsumer(name,Buffer.concat([role,Buffer.from('\n// forged\n')])));
 assert.throws(()=>restoreHeadToolsWiderConsumer(name,prior),'Historical role cannot be substituted for current');
});

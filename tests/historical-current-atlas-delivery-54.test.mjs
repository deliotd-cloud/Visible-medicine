import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readRevision54,validateRevision54Delivery} from './historical-current-atlas-delivery-54.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('closed54 replay admits only the frozen delivery and digest-checked old inputs',()=>{
 assert.equal(validateRevision54Delivery().source,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb');
 assert.equal(sha(readRevision54('docs/completion-checklist.json')),'b5efbbe06b29bf66636b1b73d001ef3b025d197320f06a14edb7be2a910c6a4c');
 assert.equal(sha(readRevision54('tests/current-atlas-delivery.test.mjs')),'ff81268dff6e06ebfddec7e10a21346bf03584c14c470e9b8a2ba8ab937e7d17');
 assert.throws(()=>readRevision54('../.env.local'));
 assert.throws(()=>readRevision54('atlas-review/content/superficial-medial-plantar-ultrasound.ts'));
 assert.throws(()=>readRevision54('components/HeadAtlasComparisonNavigation.tsx',{readLive:()=>Buffer.from('mutation')}));
 assert.throws(()=>readRevision54('components/HeadAtlasComparisonNavigation.tsx',{readLive:()=>Buffer.alloc(32)}));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readRevision55,revision55,validateRevision55Delivery} from './historical-current-atlas-delivery-55.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('closed55 documents, changed old text and strict fallback retain the original epoch',()=>{
 assert.deepEqual(validateRevision55Delivery(),revision55);
 assert.equal(sha(readRevision55('app/workspace/atlas-review/model/page.tsx')),'593cbca7fb47e09ed73ef7d307028417f33473b6f7ab7e9581343e4e4ada2069');
 assert.equal(sha(readRevision55('app/workspace/atlas-review/model/embedded/page.tsx')),'ca478ce89f0ee20154376dcb3ed33105fa62b2e1ebe22827423fac8f71ef68fb');
 assert.throws(()=>readRevision55('../.env.local'));
 assert.throws(()=>readRevision55('tests/not-an-old-fixture.mjs'));
 assert.throws(()=>readRevision55('components/HeadAtlasComparisonNavigation.tsx',{readLive:()=>Buffer.from('mutation')}));
 assert.throws(()=>readRevision55('components/HeadAtlasComparisonNavigation.tsx',{readLive:()=>Buffer.alloc(32)}));
 assert.equal(sha(readRevision55('tests/current-atlas-delivery.test.mjs')),'8eee814461c64c903514be3717a8ba88858b1fe63c1448d037d5d1ce879a511f');
});

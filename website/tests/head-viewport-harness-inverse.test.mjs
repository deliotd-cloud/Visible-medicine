import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {restoreViewportHarness,restoreViewportTransition} from './head-viewport-harness-inverse.mjs';

const current=new URL('.',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1');
const parent='F:/VisibleMedicine/staging/20261027-lecture-preview-follow/website/tests';
const names=[
 'head-image-history.test.ts','head-pan-interruption.test.ts','head-slice-zoom.test.ts',
 'head-pane-expansion-labels.test.mjs','native-slice-commit.test.mjs',
 'head-slice-keyboard.test.ts','head-mask-picking-ui.test.ts',
];
for(const name of names)test(`${name}: strict viewport inverse recovers the entire parent`,()=>{
 const now=readFileSync(join(current,name)),before=readFileSync(join(parent,name));
 assert.deepEqual(restoreViewportHarness(name,now),before);
 const mutated=Buffer.from(now);mutated[0]^=1;
 assert.throws(()=>restoreViewportHarness(name,mutated),/Exact current viewport harness/);
 assert.throws(()=>restoreViewportHarness(name,before),/Exact current viewport harness/);
});
test('unknown name, non-Buffer and stale transition are refused',()=>{
 const now=readFileSync(join(current,names[0]));
 assert.throws(()=>restoreViewportHarness('head-view-history-client.test.mjs',now),/Only seven named/);
 assert.throws(()=>restoreViewportHarness(names[0],now.toString('utf8')),/Buffer source required/);
 const projected=readFileSync(new URL('./head-pan-source-transition.test.ts',import.meta.url));
 assert.deepEqual(restoreViewportTransition(projected),readFileSync(join(parent,'head-pan-source-transition.test.ts')));
 assert.throws(()=>restoreViewportTransition(readFileSync(join(parent,'head-pan-source-transition.test.ts'))),/Exact current viewport harness/);
});

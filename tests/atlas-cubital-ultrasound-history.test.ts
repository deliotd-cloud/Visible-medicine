import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {withoutCubitalVenousUltrasoundNotice} from './atlas-cubital-ultrasound-history.ts';

test('historical comparisons remove only the intact pinned append without changing shipped credits',()=>{
 const path='atlas-review/LICENSES/THIRD_PARTY_NOTICES.md';
 const bytes=readFileSync(path),text=new TextDecoder().decode(bytes).replaceAll('\r','');
 const marker='\n## Superficial forearm venous ultrasound orientation — 2 October 2026\n';
 const start=text.indexOf(marker);assert(start>=0);
 const before=text.slice(0,start),addition=text.slice(start),suffix='\nDependency licences remain here.\n';
 assert.equal(withoutCubitalVenousUltrasoundNotice(text),before);
 assert.equal(withoutCubitalVenousUltrasoundNotice(text+suffix),before+suffix);
 assert.equal(withoutCubitalVenousUltrasoundNotice(before),before);
 assert.throws(()=>withoutCubitalVenousUltrasoundNotice(text+addition),/Duplicate cubital notice/);
 assert.throws(()=>withoutCubitalVenousUltrasoundNotice(text.slice(0,-1)),/Altered cubital notice/);
 assert.deepEqual(readFileSync(path),bytes);
});

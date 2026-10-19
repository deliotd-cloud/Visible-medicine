import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {withoutCubitalVenousUltrasoundNotice} from './atlas-cubital-ultrasound-history.ts';
import {withoutLumbarSacralNotice} from './atlas-lumbar-sacral-history.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

test('historical comparisons remove only the intact pinned append without changing shipped credits',()=>{
 const path='atlas-review/LICENSES/THIRD_PARTY_NOTICES.md';
 const bytes=readFileSync(path),current=new TextDecoder().decode(bytes).replaceAll('\r','');
 // Exercise the exact cubital append, not a duplicate of both saved epochs.
 const text=withoutLumbarSacralNotice(current);
 const marker='\n## Superficial forearm venous ultrasound orientation — 2 October 2026\n';
 const start=text.indexOf(marker);assert(start>=0);
 const next=text.indexOf('\n## ',start+marker.length);assert(next>start,'Later independent notices follow the original append');
 const before=text.slice(0,start)+text.slice(next),addition=text.slice(start,next),suffix='\nDependency licences remain here.\n';
 const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
 assert.equal(sha(addition),'592572427cd5bb772212819d163fe20ae6b5f26162e437e448f5388f47570b36');
 const saved=(at:string)=>execFileSync('git',['--no-replace-objects','show',at+':'+path],{maxBuffer:32e6});
 const milestone=saved('167c77f4da6ec16455093008dcacea250b0a6678'),prior=saved('4aa346e7923e3b303ad869d71e0ea36044d61aa6');
 assert.equal(sha(milestone),'4627118a7feaa2ebeb33ecd00cf2f51190f7eba2e9e2ce01bc05d1c38fc5bc69');
 assert.equal(sha(prior),'8c29092d1e85b6eba2aaa756d44420f8ad2e59d8b599671276fb68c2d994cc9a');
 assert.equal(milestone.toString(),prior.toString()+addition,'The exact original append was terminal only at its introduction epoch');
 const revision=JSON.parse(readFileSync('atlas-review/manifest.json','utf8')).revision;
 assert.equal(revision,CURRENT_ATLAS_REVISION);
 assert.deepEqual(bytes,execFileSync('git',['--no-replace-objects','-C',currentAtlasDeliveryRoot(),'show',revision+':LICENSES/THIRD_PARTY_NOTICES.md'],{maxBuffer:32e6}));
 assert.equal(withoutCubitalVenousUltrasoundNotice(text),before);
 assert.equal(withoutCubitalVenousUltrasoundNotice(current),before);
 assert.equal(withoutCubitalVenousUltrasoundNotice(text+suffix),before+suffix);
 assert.equal(withoutCubitalVenousUltrasoundNotice(before),before);
 assert.throws(()=>withoutCubitalVenousUltrasoundNotice(text+addition),/Duplicate cubital notice/);
 const altered=addition.slice(0,marker.length)+'X'+addition.slice(marker.length+1);
 assert.throws(()=>withoutCubitalVenousUltrasoundNotice(text.slice(0,start)+altered+text.slice(next)),/Altered cubital notice/);
 assert.deepEqual(readFileSync(path),bytes);
});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {withoutSpinalNotice} from './atlas-spinal-notice-history.ts';
import {withoutCubitalVenousUltrasoundNotice} from './atlas-cubital-ultrasound-history.ts';

const canonical=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
const marker='\n## Spinal-bone ultrasound orientation — 3 October 2026\n';

test('spinal notice extraction retains the exact preceding thoracic notice and any future append',()=>{
 const start=canonical.indexOf(marker);
 assert(start>=0);
 assert.match(withoutSpinalNotice(canonical),/## Thoracic-bone quick checks — 2 October 2026/);
 const next=canonical.indexOf('\n## ',start+marker.length),end=next<0?canonical.length:next;
 const retained=canonical.slice(0,start)+canonical.slice(end);
 assert.equal(withoutSpinalNotice(canonical),retained);
 const later='\n## Later independent notice\n\nRetained verbatim.\n';
 assert.equal(withoutSpinalNotice(canonical+later),retained+later);
});

test('spinal notice extraction refuses duplicate, moved and altered append',()=>{
 const start=canonical.indexOf(marker),addition=canonical.slice(start);
 assert.throws(()=>withoutSpinalNotice(canonical+addition),/Duplicate spinal notice/);
 assert.throws(()=>withoutSpinalNotice('x'+canonical),/Altered preceding notice or moved spinal notice/);
 const altered=canonical.slice(0,start)+canonical.slice(start).replace('Thirteen independently written drafts','Twelve independently written drafts');
 assert.throws(()=>withoutSpinalNotice(altered),/Altered spinal notice/);
});

test('complete earlier notice replay retains spinal and refuses changed old append bytes',()=>{
 const cubitalStart=canonical.indexOf('\n## Superficial forearm venous ultrasound orientation — 2 October 2026\n');
 const spinalStart=canonical.indexOf(marker);
 assert(cubitalStart>=0&&spinalStart>cubitalStart);
 const replay=withoutCubitalVenousUltrasoundNotice(canonical);
 assert.equal(replay.slice(replay.indexOf(marker)),canonical.slice(spinalStart));
 for(const oldMarker of [
  '## Superficial forearm venous ultrasound orientation — 2 October 2026',
  '## Lumbar and sacral structure checks — 2 October 2026',
  '## Wrist ultrasound orientation — 2 October 2026',
  '## Carpal-bone structure checks — 2 October 2026',
  '## Thoracic-bone quick checks — 2 October 2026',
 ])assert(!replay.includes(oldMarker));
 for(const [oldText,newText] of [
  ['Four draft placements reuse','Five draft placements reuse'],
  ['Six original draft questions use','Seven original draft questions use'],
  ['Original four draft lessons for','Original five draft lessons for'],
  ['Eight original questions serve','Nine original questions serve'],
  ['Nine original formative questions cover','Ten original formative questions cover'],
 ]){
  assert(canonical.includes(oldText));
  assert.throws(()=>withoutCubitalVenousUltrasoundNotice(canonical.replace(oldText,newText)),/Altered/);
 }
});

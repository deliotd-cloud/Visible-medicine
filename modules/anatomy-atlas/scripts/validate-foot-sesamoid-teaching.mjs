import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {snapshot,hash} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const pins=JSON.parse(await readFile('content/foot-sesamoid-teaching-pins.json')),live=await contentContext(),{api}=live,display=api.bodyDisplayCatalog(live.catalog),parent=await exactSourceHistoryApi(pins.parentCommit);
assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
for(const b of pins.bundles){assert.deepEqual(display.bundles.find(x=>x.id===b.id),b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const targets=new Map();for(const e of pins.entries){assert.deepEqual(display.structures.find(x=>x.id===e.identity.id),e.identity);assert.deepEqual(e.topics,api.contentTabs);for(const t of e.topics)targets.set(e.identity.id+'|'+t,e);}
assert.equal(targets.size,18);const transitionEntries=[];let unchanged=0,rejected=0;
for(const s of display.structures)for(const t of api.contentTabs){const before=parent.bodyLesson(s,t),now=api.bodyLesson(s,t),target=targets.get(s.id+'|'+t);if(!target){assert.deepEqual(now,before,s.id+'|'+t);assert.equal(api.footSesamoidLesson(s,t),undefined);unchanged++;continue;}
 assert.deepEqual(before,target.previous[t]);assert.equal(now.readiness,'draft');assert.notDeepEqual(now,before);assert.deepEqual(now,api.footSesamoidLesson(s,t));assert.match(now.note,/review pending/);assert.match(now.note,/remain independent/);assert.match(now.bullets.join(' '),/not a verified medial/);assert(now.citations.length);
 const {readiness:_r,...shown}=now;assert.deepEqual(api.bodyContent(s,t),shown);const copy=structuredClone(now);now.bullets.push('foreign');now.citations.length=0;assert.deepEqual(api.bodyLesson(s,t),copy);transitionEntries.push({id:s.id,tab:t,previousHash:hash(before),currentHash:hash(copy)});
}
const records=api.bodyContentRecords(display),validate=await contentValidator(live.registry);
for(const e of pins.entries){const record=records.find(r=>r.id===e.identity.id);assert(validate(record));assert.equal(record.validation.clinicalApproval,'not-included');const packet=await api.bodyReviewMaterial(e.identity.id);assert.equal(packet.approval,false);
 for(const t of e.topics){assert.deepEqual(record.content[t],api.bodyLesson(e.identity,t));const {tab:_t,...shown}=packet.topics.find(x=>x.tab===t);assert.deepEqual(shown,api.bodyLesson(e.identity,t));}
 for(const key of Object.keys(e.identity)){const changed=structuredClone(e.identity);changed[key]=e.identity[key]===null?'foreign':null;for(const t of e.topics){assert.equal(api.footSesamoidLesson(changed,t),undefined);rejected++;}}
 const extra={...e.identity,foreign:true};for(const t of e.topics){assert.equal(api.footSesamoidLesson(extra,t),undefined);rejected++;}
}
const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries:transitionEntries};
const path='content/foot-sesamoid-teaching-transition.json';if(process.argv.includes('--record'))await writeFile(path,JSON.stringify(transition,null,2)+'\n',{flag:'wx'});else{
 assert.deepEqual(JSON.parse(await readFile(path)),transition);const {beforeFootSesamoidTeaching}=await import('./foot-sesamoid-teaching-history.mjs');const restored=beforeFootSesamoidTeaching(api);assert.deepEqual(snapshot(restored,display),snapshot(parent,display));assert.equal(beforeFootSesamoidTeaching(restored),restored);
 const first=pins.entries[0];for(const mode of ['mixed','foreign'])assert.throws(()=>beforeFootSesamoidTeaching({...api,bodyLesson(s,t){const now=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='anatomy'?mode==='mixed'?first.previous.anatomy:{...now,body:'foreign'}:now;}}),/Mixed|Unrecorded/);
}
console.log(JSON.stringify({changed:targets.size,unchanged,rejected,reviewSelections:pins.entries.length,transitionHash:hash(transition),clinicalApproval:false}));

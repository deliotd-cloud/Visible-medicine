import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {facialBoneUltrasoundLesson as lesson} from '../lib/facial-bone-ultrasound.ts';
const pins=JSON.parse(fs.readFileSync('content/facial-bone-ultrasound-pins.json'));
const gitBytes=p=>execFileSync('git',['show',pins.baseline+':'+p],{windowsHide:true,maxBuffer:32e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const before=JSON.parse(gitBytes('content/regional-teaching/head-neck.json'));
test('five exact source-bound drafts retain pending predecessors and selected side',()=>{
 assert.equal(pins.entries.length,5);assert.equal(sha(gitBytes('content/regional-teaching/head-neck.json')),pins.regionalSnapshotSha256);
 for(const e of pins.entries){const old=before.entries.find(x=>JSON.parse(x.identity).id===e.identity.id);assert.deepEqual(JSON.parse(old.identity),e.identity);assert.deepEqual(old.lessons.ultrasound,e.previous);assert.equal(e.previous.readiness,'pending');const shown=lesson(e.identity,'ultrasound');assert.equal(shown.readiness,'draft');assert(shown.title.startsWith(e.identity.name+' ·'));assert.equal(e.identity.validation.anatomicalReview,false);assert.match(shown.note,/radiologist review/);}
});
test('stale source, side, geometry and approval assertions are refused',()=>{
 for(const e of pins.entries)for(const change of [s=>s.id+='-foreign',s=>s.fmaId='FMA0',s=>s.laterality='unspecified',s=>s.sources[0].sha256='0'.repeat(64),s=>s.sources.push({...s.sources[0]}),s=>s.bounds.min[0]+=0.01,s=>s.validation.anatomicalReview=true,s=>s.provenance.license='unknown']){const s=structuredClone(e.identity);change(s);assert.equal(lesson(s,'ultrasound'),undefined);}
});
test('unrelated structures and modalities remain outside this addition',()=>{
 for(const row of before.entries){const s=JSON.parse(row.identity);for(const tab of Object.keys(row.lessons))if(tab!=='ultrasound'||!pins.entries.some(e=>e.identity.id===s.id))assert.equal(lesson(s,tab),undefined);}
});
test('equivalent property order is accepted and output arrays are isolated',()=>{
 const reorder=v=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reorder(x)])):v;
 for(const e of pins.entries){const expected=lesson(e.identity,'ultrasound');assert.deepEqual(lesson(reorder(e.identity),'ultrasound'),expected);const changed=lesson(e.identity,'ultrasound');changed.bullets.push('foreign');changed.citations.push('foreign');assert.deepEqual(lesson(e.identity,'ultrasound'),expected);}
});
test('the complete prior dispatcher is recoverable byte-for-byte',()=>{
 const old=gitBytes('app/body-content.ts').toString('utf8').replaceAll('\r\n','\n');const current=fs.readFileSync('app/body-content.ts','utf8').replaceAll('\r\n','\n');
 const first="import {facialBoneUltrasoundLesson} from '../lib/facial-bone-ultrasound';\n",seam='\n  const facialBoneUltrasound = facialBoneUltrasoundLesson(s, tab);\n  if (facialBoneUltrasound) return facialBoneUltrasound;';
 assert.equal(current.split(first).length,2);assert.equal(current.split(seam).length,2);assert.equal(current.replace(first,'').replace(seam,''),old);
});
test('real generated output changes exactly five lessons across all regions and preserves geometry and metadata',()=>{
 let changed=0,kept=0,structures=0;
 for(const filename of fs.readdirSync('content/regional-teaching').filter(p=>p.endsWith('.json'))){
   const p='content/regional-teaching/'+filename;const prior=JSON.parse(gitBytes(p));const current=JSON.parse(fs.readFileSync(p));const restored=structuredClone(current);
   assert.deepEqual(current.undefinedPaths,prior.undefinedPaths);assert.equal(current.entries.length,prior.entries.length);
   for(let i=0;i<current.entries.length;i++){
     const row=current.entries[i],old=prior.entries[i],s=JSON.parse(row.identity);assert.equal(row.identity,old.identity);structures++;
     for(const [tab,value]of Object.entries(row.lessons)){
       const newLesson=lesson(s,tab);
       if(newLesson){assert.deepEqual(value,newLesson);assert.notDeepEqual(value,old.lessons[tab]);restored.entries[i].lessons[tab]=old.lessons[tab];changed++;}
       else{assert.deepEqual(value,old.lessons[tab],s.id+':'+tab);kept++;}
     }
   }
   assert.deepEqual(restored,prior,'Complete predecessor snapshot recovery: '+filename);
 }
 assert.equal(structures,1104);assert.equal(changed,5);assert.equal(kept,9931);
});

// Test-only current contract; later milestones never rewind unrelated current teaching.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json=async path=>JSON.parse(await readFile(new URL('../content/'+path,import.meta.url)));
const pins=await json('abdominal-organ-imaging-pins.json');
const original=await json('abdominal-organ-imaging.transition.json');
const ultrasound=await json('renal-ultrasound.transition.json');
const xray=await json('renal-xray.transition.json');
assert.equal(hash(pins),'4eaecd43646f4f7f2df08ee3dfb0846e3f372341009b4034b26695b38a5bfc69','Original pins changed');
assert.equal(hash(original),'5c36a2d12cdd8c7db209be1e1cf78cdd0cadf01cdd3f856870818f238d7f30d8','Original transition changed');
assert.equal(hash(ultrasound),'9096a2e2ada11a5f74003b30dd7eef99c69953b32f9ab24b0d0c3feb700c5f40','Renal ultrasound transition changed');
assert.equal(hash(xray),'ba280268012a53fc4a357b6caab353ecb0310fecca5963b79512b73cbc615166','Renal X-ray transition changed');
assert.equal(original.sourceCommit,pins.sourceCommit);
assert.equal(ultrasound.originalPinsHash,hash(pins));
assert.equal(xray.originalPinsHash,hash(pins));

const successor=new Map();
for(const [transition,tab] of [[ultrasound,'ultrasound'],[xray,'xray']]){
 assert.equal(transition.entries.length,2,'Only the two pinned kidneys may supersede the original lesson');
 for(const entry of transition.entries){
  assert.equal(entry.tab,tab);
  const originalEntry=original.entries.find(row=>row.id===entry.identity.id);
  const pin=pins.entries.find(row=>row.identity.id===entry.identity.id);
  assert(originalEntry&&pin&&['FMA7204','FMA7205'].includes(pin.identity.fmaId));
  assert.deepEqual(entry.identity,pin.identity,'Successor source identity changed');
  assert.equal(entry.previousHash,originalEntry.sections[tab],'Successor must extend original lesson');
  const key=entry.identity.id+'|'+tab;
  assert(!successor.has(key),'Duplicate successor');
  successor.set(key,entry.currentHash);
 }
}
assert.equal(successor.size,4);

export function verifyCurrentAbdominalImaging(api,catalog){
 const display=api.bodyDisplayCatalog(catalog);
 const targets=new Set(pins.entries.map(entry=>entry.identity.id));
 let sections=0,successors=0,rejected=0;
 for(const [index,pin] of pins.entries.entries()){
  const structure=display.structures.find(row=>row.id===pin.identity.id);
  assert.deepEqual(structure,pin.identity,'Current source identity changed');
  const recorded=original.entries[index];
  assert.equal(recorded.id,structure.id);
  assert.deepEqual(Object.keys(recorded.sections),pin.topics);
  for(const tab of pin.topics){
   const expected=successor.get(structure.id+'|'+tab)??recorded.sections[tab];
   const lesson=api.bodyLesson(structure,tab);
   assert.equal(hash(lesson),expected,'Unrecorded abdominal-organ imaging change (current lesson)');
   assert.deepEqual(api.abdominalOrganImagingLesson(structure,tab),lesson,'Current lesson/helper mismatch');
   assert.equal(lesson.readiness,'draft');
   if(successor.has(structure.id+'|'+tab))successors++;
   sections++;
   const forged=structuredClone(structure);forged.name+=' foreign';
   assert.equal(api.abdominalOrganImagingLesson(forged,tab),undefined,'Foreign source received abdominal teaching');
   rejected++;
  }
 }
 for(const structure of display.structures){
  if(targets.has(structure.id))continue;
  for(const tab of ['ct','mri','xray','ultrasound'])
   assert.equal(api.abdominalOrganImagingLesson(structure,tab),undefined,'Abdominal lesson escaped pinned source');
 }
 assert.equal(sections,32);assert.equal(successors,4);assert.equal(rejected,32);
 return {sections,successors,rejected};
}

/** Rewind only the 32 targets; the full historical snapshot is verified separately. */
export function currentAbdominalImagingBefore({api,catalog}){
 verifyCurrentAbdominalImaging(api,catalog);
 const previous=new Map(pins.entries.flatMap(entry=>entry.topics.map(tab=>[entry.identity.id+'|'+tab,{identity:entry.identity,lesson:entry.previous[tab]}])));
 assert.equal(previous.size,32);
 const bodyLesson=(s,tab)=>{
  const entry=previous.get(s.id+'|'+tab);if(!entry)return api.bodyLesson(s,tab);
  // A foreign/raw pancreas representation is not the pinned corrected display.
  if(hash(s)!==hash(entry.identity))return api.bodyLesson(s,tab);
  return structuredClone(entry.lesson);
 };
 return {...api,bodyLesson,bodyContent(s,tab){const {readiness,...shown}=bodyLesson(s,tab);return shown;}};
}

// Test-only source-epoch bridge for two celiac lessons after the older display reversal.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import transition from '../content/celiac-display-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const exact={
 xray:{file:'git-author-b3d936de.json',author:'b3d936de6992b612c77abaddd7b761b5fb43b446',pinsHash:'fc9d74bb9f2452b4f284dd971d2ec1c3a8b88787e78c0ea90558446b1e859e77',transitionHash:'6cce9cd9e9ae9d6eba94d65b3d68ad2b9ce10512b4599a41054efba58dceb293',sourceRecordHash:'43974658e34c5235f422935a2bc13eb5135075c7462163280e5fca3388140f52'},
 quiz:{file:'git-pin-5363ae64.json',author:'5363ae64e06cb5629a36469c7d15fddbcfff32b4',pinsHash:'6ebae01c73588c548ad3104c45716413dcd06464f7fb6cc4e48d61c722d9ee97',transitionHash:'273cdda69c9b6e9e0f0f8f717704ea5924544213fd19001d0dbd6cbb564a37c3',sourceRecordHash:'2c82a00e27b6feca4b359abe88544217ce0d9e88e3e6ddd50a160346b69f0787'}
};
function verifyRecords(){
 assert.equal(hash(transition),'04fe1aeaba2bc1c5960b8bf5637d0f4ec498c49c63dd9997beddd06023c2c08e','Celiac display transition changed');
 assert.equal(transition.sourceCommit,'6b96e836942a7c124e6caf947e3920dc898687fd');
 assert.equal(transition.original.id,'vm:anatomy:body:abdomen:unspecified:vessel:celiac-artery');
 assert.equal(transition.original.bundle,'abdomen-vessels-recovery');
 assert.equal(transition.replacement.bundle,'celiac-display-corrected');
 assert.equal(transition.bundle.id,'celiac-display-corrected');
 for(const[tab,expected]of Object.entries(exact)){
  const record=JSON.parse(readFileSync(new URL('../content/post-foot-author-history/configs/'+expected.file,import.meta.url)));
  const source=JSON.parse(readFileSync(new URL('../content/post-foot-author-history/author-epochs/'+expected.author+'.json',import.meta.url)));
  assert.equal(record.name,expected.file.slice(0,-5));
  assert.equal(record.pins.authorCommit,expected.author);
  assert.equal(record.pinsHash,expected.pinsHash);assert.equal(hash(record.pins),expected.pinsHash);
  assert.equal(record.transitionHash,expected.transitionHash);assert.equal(hash(record.transition),expected.transitionHash);
  assert.equal(record.sourceRecordHash,expected.sourceRecordHash);assert.equal(hash(source),expected.sourceRecordHash);
  const matches=record.pins.entries.filter(entry=>entry.identity.id===transition.original.id);
  assert.equal(matches.length,1,`One exact celiac ${tab} source pin`);
  assert.deepEqual(matches[0].identity,transition.replacement,`Corrected celiac ${tab} source identity changed`);
  assert.deepEqual(Object.keys(matches[0].previous),[tab],`Celiac ${tab} source topics changed`);
 }
}
export function bridgeCeliacDisplayEpoch(api,catalog){
 verifyRecords();
 const source=structuredClone(transition);
 assert.equal(typeof api.bodyDisplayCatalog,'function');
 const sourceDisplay=api.bodyDisplayCatalog(catalog);
 assert.deepEqual(sourceDisplay.structures.filter(s=>s.id===source.original.id),[source.original],'Recovered celiac displayed identity changed');
 assert(!sourceDisplay.bundles.some(b=>b.id===source.bundle.id),'Corrected celiac display bundle remains');
 assert.deepEqual(catalog.structures.filter(s=>s.id===source.original.id),[source.original],'Raw celiac source identity changed');
 for(const tab of Object.keys(exact)){
  const lesson=api.bodyLesson(source.replacement,tab);
  assert(lesson&&typeof lesson==='object',`Guarded corrected celiac ${tab} lesson required`);
  if(typeof api.bodyContent==='function'){
   const{readiness:_,...shown}=lesson;
   assert.deepEqual(api.bodyContent(source.replacement,tab),shown,`Guarded corrected celiac ${tab} content changed`);
  }
 }
 const target=(structure,tab)=>structure?.id===source.original.id&&Object.hasOwn(exact,tab);
 const exactSource=(structure)=>{
  verifyRecords();
  assert.deepEqual(structure,source.original,'Exact recovered celiac source identity required');
  const display=api.bodyDisplayCatalog(catalog);
  assert.deepEqual(display.structures.filter(s=>s.id===source.original.id),[source.original],'Recovered celiac displayed identity changed');
  assert(!display.bundles.some(b=>b.id===source.bundle.id),'Corrected celiac display bundle remains');
 };
 return {...api,
  bodyLesson(structure,tab){
   if(!target(structure,tab))return api.bodyLesson(structure,tab);
   exactSource(structure);
   return api.bodyLesson(source.replacement,tab);
  },
  bodyContent(structure,tab){
   if(!target(structure,tab))return api.bodyContent(structure,tab);
   exactSource(structure);
   return api.bodyContent(source.replacement,tab);
  }
 };
}

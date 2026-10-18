import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {headAtlasConceptOptions,headConceptById} from '../lib/head-atlas-links.ts';
import {parseHeadSelection,HEAD_SELECTION_PROTOCOL as type} from '../lib/head-live-selection.ts';
const revision='f'.repeat(40),session='test-session-12345678';
const packet=(selection:unknown)=>({type,version:1,revision,session,sequence:1,status:'selected',selection});
const read=(value:unknown,last=0)=>parseHeadSelection(value,revision,session,last);
test('all 42 authored exact root/nested matches resolve without inferred neighbours',()=>{
  const options=headAtlasConceptOptions();assert.equal(options.length,42);
  const facial=['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'];
  assert.equal(options.filter(option=>!facial.includes(option.conceptId)).length,39);
  assert.deepEqual(options.filter(option=>facial.includes(option.conceptId)).map(option=>option.conceptId),facial);
 for(const {conceptId}of options){
  const concept=headConceptById(conceptId)!,q=new URL(concept.atlasHref,'https://atlas.invalid').searchParams,nested=q.get('study')==='2';
  const id=q.get(nested?'part':'structure')!;
  const selection={kind:nested?'nested':'root',id,source:q.get(nested?'partSource':'source'),laterality:id.split(':')[4],...(nested?{parentId:q.get('structure'),parentSource:q.get('source'),study:q.get('detail')}:{})};
  assert.equal(read(packet(selection))?.concept?.conceptId,conceptId);
  assert.equal(read(packet({...selection,source:'0'.repeat(64)}))?.concept,null);
  assert.equal(read(packet({...selection,laterality:selection.laterality==='left'?'right':'left'}))?.concept,null);
  if(nested)for(const key of ['parentId','parentSource','study'])assert.equal(read(packet({...selection,[key]:key==='parentSource'?'0'.repeat(64):key==='study'?'eye':id}))?.concept,null);
 }
 const unknown={kind:'root',id:'vm:anatomy:body:head-neck:left:muscle:left-unmapped',source:'0'.repeat(64),laterality:'left'};
 assert.equal(read(packet(unknown))?.status,'selected');assert.equal(read(packet(unknown))?.concept,null,'Valid unmapped selection clears old links');
});
test('every neighbouring body-region selection admitted to the head view clears a mapped focus',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
 const neighbouring=(manifest.regionalIds as string[]).filter(id=>!id.startsWith('vm:anatomy:body:head-neck:'));
 assert(neighbouring.length>0);
 for(const region of ['spine','thorax','shoulder-arm'])assert(neighbouring.some(id=>id.split(':')[3]===region));
 const previous=read(packet({kind:'root',id:'vm:anatomy:body:head-neck:left:organ:left-eyeball',source:'7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915',laterality:'left'}))!;
 assert.equal(previous.concept?.conceptId,'orbit-left-globe');
 for(const id of neighbouring){
   const next=read({...packet({kind:'root',id,source:'0'.repeat(64),laterality:id.split(':')[4]}),sequence:2},previous.sequence);
   assert.equal(next?.status,'selected',id+' must not be discarded as malformed');
   assert.equal(next?.concept,null,id+' must clear, not retain or invent a comparison');
 }
});

test('revision, session, sequence, exact schema and blocked-state gates reject stale or widened messages',()=>{
 const empty={type,version:1,revision,session,sequence:1,status:'empty'};
 assert.equal(read(empty)?.status,'empty');
 for(const reason of ['practice','guided','unavailable']){
  const blocked={...empty,status:'blocked',reason};assert.equal(read(blocked)?.reason,reason);
  assert.equal(read({...blocked,selection:{id:'answer'}}),null);
 }
 for(const value of [null,[],{}, {...empty,type:'other'},{...empty,version:2},{...empty,revision:'a'.repeat(40)},{...empty,session:'old-session'}, {...empty,sequence:0},{...empty,sequence:1.5},{...empty,sequence:NaN},{...empty,sequence:Number.MAX_SAFE_INTEGER+1},{...empty,coordinates:[1,2,3]},{...empty,status:'blocked',reason:'unknown'}])assert.equal(read(value),null);
 assert.equal(read(empty,1),null);assert.equal(read({...empty,sequence:2},1)?.sequence,2);
 const selection={kind:'root',id:'vm:anatomy:body:head-neck:left:organ:left-eyeball',source:'7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915',laterality:'left'};
 for(const invalid of [{...selection,patient:'x'},{...selection,source:'invalid'},{...selection,id:'foreign'},{...selection,laterality:'both'},{...selection,kind:'unknown'}])assert.equal(read(packet(invalid)),null);
});

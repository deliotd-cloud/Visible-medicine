import assert from 'node:assert/strict';
import test from 'node:test';
import {draftKey,fixture} from './studio-release-predecessor-action-fixture.mjs';

const oldKey=draftKey('course:one'),currentKey=draftKey('release:one');
function predecessor(overrides={}){return{expectedCourseId:'course:one',expectedReleaseId:'release:one',expectedVersion:'2',title:'Older unsent edit',slug:'older-unsent-edit',summary:'Unsent description',level:'Intermediate',duration:'Self-paced',outcomes:'Identify structures\nCompare views',publisherName:'School',publisherKind:'institution',visibility:'private',accessModel:'invitation',enrolmentOpen:'on',workbookIds:['workbook:one'],price:'0',currency:'GBP',...overrides};}
async function mounted(options){const h=fixture(options);await h.settle();return h;}

test('real ActionForm recovers a complete matching old key only when the current key is empty',async()=>{
  const raw=JSON.stringify(predecessor());const h=await mounted({old:raw});
  try{assert.equal(h.fields.get('title'),'Older unsent edit');assert.equal(h.fields.get('expectedVersion'),'2');assert.equal(h.stored.get(oldKey),raw);assert.equal(h.stored.has(currentKey),false);h.runTimers();assert(h.find(node=>node.type==='form'));}
  finally{h.dispose();}
});

test('a current release key takes precedence and preserves a coexisting course key',async()=>{
  const old=predecessor(),primary=predecessor({title:'Current key edit'});const h=await mounted({old,primary});
  try{assert.equal(h.fields.get('title'),'Current key edit');assert.equal(h.stored.get(oldKey),JSON.stringify(old));assert.equal(h.stored.get(currentKey),JSON.stringify(primary));}
  finally{h.dispose();}
});

test('a current key arriving during predecessor inspection still wins',async()=>{
  const current=predecessor({title:'Arriving current edit'}),h=await mounted({old:predecessor(),onRead(key,stored,reads){if(key===oldKey&&reads.filter(item=>item===oldKey).length===1)stored.set(currentKey,JSON.stringify(current));}});
  try{assert.equal(h.fields.get('title'),'Arriving current edit');assert.equal(h.stored.has(oldKey),true);}
  finally{h.dispose();}
});

test('an old-key read failure cannot veto a current key that arrives during that read',async()=>{
  const current=predecessor({title:'Arriving after old read failure'}),h=await mounted({onRead(key,stored,reads){if(key===oldKey&&reads.filter(item=>item===oldKey).length===1){stored.set(currentKey,JSON.stringify(current));throw Error('synthetic old-key read failure');}}});
  try{assert.equal(h.fields.get('title'),'Arriving after old read failure');assert.equal(h.stored.get(currentKey),JSON.stringify(current));h.runTimers();assert(h.find(node=>node.type==='p'&&JSON.stringify(node.props.children).includes('older course-scoped draft could not be checked')),'recovered primary retains the unread older-key warning');}
  finally{h.dispose();}
});

for(const[name,old]of[
  ['partial', {expectedCourseId:'course:one',expectedReleaseId:'release:one',expectedVersion:'2'}],
  ['foreign course', predecessor({expectedCourseId:'course:other'})],
  ['foreign release', predecessor({expectedReleaseId:'release:other'})],
  ['future version', predecessor({expectedVersion:'3'})],
  ['foreign workbook', predecessor({workbookIds:['workbook:other']})],
  ['invalid JSON', '{not-json'],
])test(`${name} old-key bytes stay untouched and do not change the live fields`,async()=>{
  const raw=typeof old==='string'?old:JSON.stringify(old),h=await mounted({old:raw});
  try{assert.equal(h.fields.get('title'),'Original release');assert.equal(h.stored.get(oldKey),raw);assert.equal(h.stored.has(currentKey),false);assert.equal(h.removes.length,0);}
  finally{h.dispose();}
});

test('confirmed save removes recovered predecessor only under its own named lock',async()=>{
  const h=await mounted({old:predecessor()});
  try{await h.submit();assert.equal(h.payloads.length,1);assert.equal(h.stored.has(oldKey),false);assert(h.locks.some(name=>name.includes('release:course:one')));assert(h.removes.includes(oldKey));}
  finally{h.dispose();}
});

test('changed predecessor bytes survive a confirmed save',async()=>{
  const h=await mounted({old:predecessor()});
  try{const foreign=JSON.stringify(predecessor({title:'Other tab edit'}));h.stored.set(oldKey,foreign);await h.submit();assert.equal(h.stored.get(oldKey),foreign);assert(!h.removes.includes(oldKey));}
  finally{h.dispose();}
});

test('a new current-key draft is not removed when its bytes change in another tab',async()=>{
  const h=await mounted({old:predecessor()});
  try{h.change('title','Queued current edit');await h.settle();const foreign=JSON.stringify(predecessor({title:'Other tab current edit'}));h.stored.set(currentKey,foreign);await h.submit();assert.equal(h.stored.get(currentKey),foreign);}
  finally{h.dispose();}
});

test('edits made during a deferred save retain the predecessor and a new current draft',async()=>{
  const h=await mounted({old:predecessor()});
  try{let finish;h.setFetch(()=>new Promise(resolve=>{finish=resolve;}));const pending=h.submit();for(let i=0;i<8&&!finish;i++)await Promise.resolve();assert(finish,'save reached transport');h.change('title','Newer unsent edit');await h.settle();finish({ok:true,status:200,json:async()=>({ok:true,action:'save-release',releaseId:'release:one'})});await pending;await h.settle();assert.equal(h.stored.has(oldKey),true);assert.equal(JSON.parse(h.stored.get(currentKey)).title,'Newer unsent edit');}
  finally{h.dispose();}
});

for(const[name,reply]of[
  ['rejected', {ok:false,status:409,body:{error:'Release changed'}}],
  ['uncertain', {ok:false,status:503,body:{error:'Service unavailable'}}],
])test(`${name} save keeps the predecessor`,async()=>{
  const h=await mounted({old:predecessor()});
  try{h.setReply(reply);await h.submit();assert.equal(h.stored.has(oldKey),true);assert(!h.removes.includes(oldKey));}
  finally{h.dispose();}
});

test('context failure before recovery leaves both keys and fields intact',async()=>{
  const h=await mounted({old:predecessor(),context:'unavailable'});
  try{assert.equal(h.fields.get('title'),'Original release');assert.equal(h.stored.has(oldKey),true);await h.submit();assert.equal(h.payloads.length,0);assert.equal(h.removes.length,0);}
  finally{h.dispose();}
});

test('unavailable Web Locks keep old bytes after a confirmed save',async()=>{
  const h=await mounted({old:predecessor(),lock:'unavailable'});
  try{await h.submit();assert.equal(h.stored.has(oldKey),true);assert.equal(h.removes.length,0);}
  finally{h.dispose();}
});

test('storage removal failure keeps the recovered predecessor',async()=>{
  const h=await mounted({old:predecessor(),remove:'failed'});
  try{await h.submit();assert.equal(h.stored.has(oldKey),true);assert(h.removes.includes(oldKey));}
  finally{h.dispose();}
});

test('unmount during a deferred save keeps the predecessor',async()=>{
  const h=await mounted({old:predecessor()});
  try{let finish;h.setFetch(()=>new Promise(resolve=>{finish=resolve;}));const pending=h.submit();for(let i=0;i<8&&!finish;i++)await Promise.resolve();assert(finish);h.unmount();finish({ok:true,status:200,json:async()=>({ok:true,action:'save-release',releaseId:'release:one'})});await pending;assert.equal(h.stored.has(oldKey),true);}
  finally{h.dispose();}
});

test('another education scope cannot recover a draft under this scope',async()=>{
  const shared=new Map([[oldKey,JSON.stringify(predecessor())]]),h=await mounted({shared});
  try{h.props.recoveryScope={actorId:'edu:other-author',organizationId:'org:synthetic'};h.render();await h.settle();assert.equal(shared.get(oldKey),JSON.stringify(predecessor()));assert.equal(h.removes.length,0);}
  finally{h.dispose();}
});

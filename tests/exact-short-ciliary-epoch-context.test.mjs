import assert from 'node:assert/strict';
import {test} from 'node:test';
import baseline from '../content/short-ciliary-transition.json' with {type:'json'};
import transition from '../content/short-ciliary-teaching.transition.json' with {type:'json'};
import {
 assertShortCiliaryEpochIdentity,assertShortCiliaryExactTransition,
 exactShortCiliaryEpochContext,shortCiliaryEpochPins,
} from '../scripts/exact-short-ciliary-epoch-context.mjs';

test('short-ciliary epochs pin commit, tree, sole parent and catalog blob',()=>{
 const before=shortCiliaryEpochPins.before,after=shortCiliaryEpochPins.after;
 const blob='100644 blob 2f4dc97cf918c3cff128dbb55092260430634eaa\tpublic/models/bodyparts3d/full-body/catalog.json';
 assert.equal(assertShortCiliaryEpochIdentity('before',`${before.commit} ${before.tree} ${before.parent}`,blob),before.commit);
 assert.equal(assertShortCiliaryEpochIdentity('after',`${after.commit} ${after.tree} ${after.parent}`,blob),after.commit);
 assert.throws(()=>assertShortCiliaryEpochIdentity('unknown',`${before.commit} ${before.tree} ${before.parent}`,blob),/Unknown/);
 assert.throws(()=>assertShortCiliaryEpochIdentity('after',`${before.commit} ${before.tree} ${before.parent}`,blob),/mismatch/);
 for(const altered of [
  `${after.commit} ${before.tree} ${before.parent}`,
  `${before.commit} ${after.tree} ${before.parent}`,
  `${before.commit} ${before.tree} ${after.parent}`,
 ])assert.throws(()=>assertShortCiliaryEpochIdentity('before',altered,blob),/mismatch/);
 assert.throws(()=>assertShortCiliaryEpochIdentity('before',`${before.commit} ${before.tree} ${before.parent}`,blob.replace('2f4dc97','0f4dc97')),/catalog blob mismatch/);
});

test('both exact source eras refuse altered pins, catalog and lessons',async()=>{
 const before=await exactShortCiliaryEpochContext('before'),after=await exactShortCiliaryEpochContext('after');
 const valid={before,after,baseline,transition};
 assert.equal(assertShortCiliaryExactTransition(valid).sections,8);
 assert.throws(()=>assertShortCiliaryExactTransition({...valid,before:{...before,commit:after.commit}}),/Wrong before epoch/);
 assert.throws(()=>assertShortCiliaryExactTransition({...valid,after:{...after,commit:before.commit}}),/Wrong after epoch/);
 assert.throws(()=>assertShortCiliaryExactTransition({...valid,baseline:{...baseline,currentCatalogHash:'0'.repeat(64)}}),/baseline pins/);
 assert.throws(()=>assertShortCiliaryExactTransition({...valid,transition:{...transition,currentAllLessonsAndRecipesHash:'0'.repeat(64)}}),/teaching transition/);
 assert.throws(()=>assertShortCiliaryExactTransition({...valid,after:{...after,catalog:{...after.catalog,sourceVersion:'foreign'}}}),/Catalog changed/);
 const changedBefore={...before,api:{...before.api,bodyLesson:(s,t)=>s.id===baseline.structure.id&&t==='clinical'?{...before.api.bodyLesson(s,t),body:'foreign'}:before.api.bodyLesson(s,t)}};
 assert.throws(()=>assertShortCiliaryExactTransition({...valid,before:changedBefore}),/Before source lesson mismatch/);
 const changedAfter={...after,api:{...after.api,bodyLesson:(s,t)=>s.id===baseline.structure.id&&t==='function'?{...after.api.bodyLesson(s,t),body:'foreign'}:after.api.bodyLesson(s,t)}};
 assert.throws(()=>assertShortCiliaryExactTransition({...valid,after:changedAfter}),/After source lesson mismatch/);
 for(const [name,context]of [['before',before],['after',after]]){
  const changedAnatomy={...context,api:{...context.api,bodyLesson:(s,t)=>s.id===baseline.structure.id&&t==='anatomy'?{...context.api.bodyLesson(s,t),body:'foreign'}:context.api.bodyLesson(s,t)}};
  assert.throws(()=>assertShortCiliaryExactTransition({...valid,[name]:changedAnatomy}),/source anatomy changed/);
 }
 const unrelated=before.display.structures.find(s=>s.id!==baseline.structure.id);
 const changedOther={...before,api:{...before.api,bodyLesson:(s,t)=>s.id===unrelated.id&&t==='anatomy'?{...before.api.bodyLesson(s,t),body:'foreign'}:before.api.bodyLesson(s,t)}};
 assert.throws(()=>assertShortCiliaryExactTransition({...valid,before:changedOther}),/Before exact full snapshot mismatch/);
});

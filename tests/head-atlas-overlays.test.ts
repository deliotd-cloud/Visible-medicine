import test from 'node:test';
import assert from 'node:assert/strict';
import {groupHeadOverlays,headOverlayBytes,layoutHeadLabels,visibleHeadOverlays} from '../lib/head-atlas-overlays.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';
const entry=(id:string,family:string,hash=id):HeadEntry=>({id,label:id,family,color:[1,0,0],opacity:{fill:.2,outline:.9},representation:'mask',mask:{file:id,sha256:hash,dtype:'uint8',shape_kji:[2,3,4],ijk_to_ras:[]}});
test('groups contain actual distinct masks only; no invented absent systems',()=>{
  const alias={...entry('alias','bst','pons'),source:{geometry_alias_of:'pons'}},locator={...entry('point','vas'),mask:undefined};
  const groups=groupHeadOverlays([entry('pons','bst'),entry('duplicate','bst','pons'),alias,locator,entry('skull','skl')]);
  assert.deepEqual(groups.map(g=>[g.id,g.entries.length]),[['bst',1],['skl',1]]);
  assert.equal(headOverlayBytes(groups[0].entries),24);
  assert.equal(groupHeadOverlays([{...entry('caudate','dgm'),source:{geometry_alias_of:'other-release.caudate'}}])[0].id,'dgm','External shared-source masks remain available; duplicates are identified by actual mask hashes');
});
test('selected overlay is last, no shared duplicate, individual visibility respected',()=>{
  const p={entry:entry('pons','bst')},q={entry:entry('midbrain','bst')},alias={entry:entry('alias','bst','pons')};
  assert.deepEqual(visibleHeadOverlays([p,q,alias],new Set(['midbrain']),p),[p]);
});
test('labels remain on anchor side, do not collide and retain selected target under density',()=>{
  const anchors=Array.from({length:30},(_,n)=>({id:String(n),x:n%2?600:100,y:100+n,text:'Target',selected:n===28}));
  const result=layoutHeadLabels(anchors,800,400,12);assert.equal(result.labels.length,12);assert.equal(result.omitted,18);assert.ok(result.labels.some(l=>l.id==='28'));
  for(const label of result.labels)assert.equal(label.boxX<400,label.x<400);
  for(const left of [true,false]){const list=result.labels.filter(l=>(l.x<400)===left);for(let n=1;n<list.length;n++)assert.ok(list[n].boxY>=list[n-1].boxY+list[n-1].boxHeight);}
  assert.deepEqual(layoutHeadLabels(anchors,90,80).labels,[]);
});

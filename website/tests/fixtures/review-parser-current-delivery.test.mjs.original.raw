import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root)),sha=b=>createHash('sha256').update(b).digest('hex'),wire=v=>JSON.parse(JSON.stringify(v));
const source='2ab63cbbc1c5e18a4d7b3a65f799e863f5be0491',tree='c625d8b1a55aabd8e6497169856e9d67b85ea0f3';
const parentSource='66ac064579ee23c5739d0907e8378e0e2d57d7bd',parentTree='0730550af7e5f8cc1d763d7326ca0a0c05458ca7';
const stage='F:/VisibleMedicine/staging/20261023-midfoot-reasoning',receiptBytes=readFileSync(stage+'/SOURCE_BOUND.json');
assert.equal(sha(receiptBytes),'feba2ee6e0127ff34a9b23eaf01b3fe9ed83b8ced45d0803c66feaacd9b3d7fc');
const receipt=JSON.parse(receiptBytes);assert.equal(receipt.head,source);assert.equal(receipt.tree,tree);
assert.equal(receipt.parent,parentSource);assert.equal(receipt.parentTree,parentTree);
const parentStage='F:/VisibleMedicine/staging/20261023-review-parser-context';
const parentBytes=readFileSync(parentStage+'/SOURCE_BOUND.json');
assert.equal(sha(parentBytes),'a32919b11982957ef10eece8526ac6767d5c5a16499ff51cf2e50c2fc912a5f4');
const parentReceipt=JSON.parse(parentBytes);assert.equal(parentReceipt.head,parentSource);assert.equal(parentReceipt.tree,parentTree);

test('actual imported parser and producer bind exact committed source through the current Website delivery',()=>{
 const current=validateCurrentAtlasDelivery();assert.equal(current.source,source);
 const manifest=JSON.parse(read('atlas-review/manifest.json'));assert.equal(manifest.revision,source);
 for(const p of ['lib/body-review-response.ts','lib/body-review-material.ts','lib/body-review-display-integrity.ts','content/body-review-display-pins.json','content/hamstring-tour-pins.json']){
  const authored=readFileSync(stage+'/atlas/'+p),row=receipt.sourceRows.find(r=>r.path===p),imported=manifest.files.find(r=>r.path===p);assert(row&&imported,p);
  assert.equal(sha(authored),row.sha256);assert.equal(imported.sourceSha256,row.sha256);
  const adapted=p.endsWith('.ts')?Buffer.from(authored.toString().replace(/(['"])@\//g,'$1@/atlas-review/')):authored;
  assert.deepEqual(read('atlas-review/'+p),adapted,p);assert.equal(sha(adapted),imported.importedSha256);
  if(p!=='content/body-review-display-pins.json')assert.equal(row.sha256,parentReceipt.sourceRows.find(r=>r.path===p)?.sha256,`Parent parser/hamstring preserved: ${p}`);
 }
 const expected=receipt.sourceRows.find(r=>r.path==='lib/body-review-response.ts').sha256;
 const prior=JSON.parse(readFileSync('F:/VisibleMedicine/staging/20261023-tour-reading/SOURCE_BOUND.json'));
 assert.notEqual(expected,prior.sourceRows.find(r=>r.path==='lib/body-review-response.ts').sha256,'Actual repaired parser is delivered, not the former rejected-packet implementation');
 const oldPins=JSON.parse(readFileSync(parentStage+'/atlas/content/body-review-display-pins.json'));
 const newPins=JSON.parse(read('atlas-review/content/body-review-display-pins.json'));
 const oldRows=new Map(oldPins.pins.map(row=>[row.structureId,row.sha256]));
 const newRows=new Map(newPins.pins.map(row=>[row.structureId,row.sha256]));
 assert.equal(oldRows.size,oldPins.pins.length);assert.equal(newRows.size,newPins.pins.length);
 assert.deepEqual([...newRows.keys()],[...oldRows.keys()],'Display pin ordering and target set preserved');
 const changed=[...newRows].filter(([id,digest])=>oldRows.get(id)!==digest).map(([id])=>id);
 const midfoot=JSON.parse(readFileSync(stage+'/atlas/content/midfoot-relationships-reasoning-pins.json'));
 assert.deepEqual(changed.sort(),midfoot.entries.map(row=>row.identity.id).sort(),'Only twelve source-bound midfoot displays changed');
});

test('actual Website-imported JSON worksheet path accepts all ten hamstring contexts and refuses altered packets',async()=>{
 const resolveDir=new URL('../',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1');
 const compiled=await build({stdin:{contents:"export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",resolveDir,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',packages:'external',alias:{'@':resolveDir}});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const pins=JSON.parse(read('atlas-review/content/hamstring-tour-pins.json')),entries=[...pins.entries,...pins.contextEntries];assert.equal(entries.length,10);
 for(const entry of entries){
  const packet=wire(await api.bodyReviewMaterial(entry.id));assert(packet);assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  assert(packet.guidedTours.some(g=>g.tour.id===`${entry.laterality}-hamstring-orientation`));
  assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
  for(const [label,mutate]of [
   ['material hash',p=>{p.materialHash='0'.repeat(64);}],
   ['source fingerprint',p=>{p.fingerprints.source='0'.repeat(64);}],
   ['teaching fingerprint',p=>{p.fingerprints.teaching='0'.repeat(64);}],
   ['checklist fingerprint',p=>{p.fingerprints.checklist='0'.repeat(64);}],
   ['tour caption',p=>{p.guidedTours.at(-1).tour.steps[0].caption+=' altered';}],
   ['approval',p=>{p.approval=true;}],
  ]){const altered=wire(packet);mutate(altered);assert.equal(await api.parseBodyReviewResponse(altered,entry.id),null,`${entry.id}: ${label}`);}
 }
});

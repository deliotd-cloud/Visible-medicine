import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root)),sha=b=>createHash('sha256').update(b).digest('hex'),wire=v=>JSON.parse(JSON.stringify(v));

test('current producer, parser and pins are exact Atlas source imports',()=>{
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 const manifest=JSON.parse(read('atlas-review/manifest.json'));
 const inputs=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(manifest.revision,pin.source);assert.equal(inputs.sourceCommit,pin.source);
 for(const p of ['lib/body-review-response.ts','lib/body-review-material.ts','lib/body-review-display-integrity.ts','content/body-review-display-pins.json','content/hamstring-tour-pins.json']){
  const row=manifest.files.find(r=>r.path===p);assert(row,p);
  const imported=read('atlas-review/'+p),input=inputs.inputs.find(r=>r.path==='atlas-review/'+p);assert(input,p);
  assert.equal(sha(imported),row.importedSha256,p);assert.equal(input.sha256,row.importedSha256,p);
  const source=execFileSync('git',['show',pin.source+':'+p],{cwd:sourceRoot,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(sha(source),row.sourceSha256,p);
  const adapted=p.endsWith('.ts')?Buffer.from(source.toString().replace(/(['"])@\//g,'$1@/atlas-review/')):source;
  assert.deepEqual(imported,adapted,p);
 }
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

// Source-bound product delivery checks; these do not confer clinical approval.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const receiptPath=process.env.VM_CURRENT_SOURCE_RECEIPT,receiptSha=process.env.VM_CURRENT_SOURCE_SHA256;
assert(receiptPath&&/^[a-f0-9]{64}$/.test(receiptSha??''),'Exact current Website receipt required');
const bytes=fs.readFileSync(receiptPath);assert.equal(hash(bytes),receiptSha);
const current=JSON.parse(bytes);assert.equal(path.resolve(current.website),path.resolve(root));
assert.equal(current.atlasHead,'a01ea4a00740dee0905204a33893761b8ae1ff1e');
const rows=new Map(current.sourceRows.map(r=>[r.path,r]));assert.equal(rows.size,current.sourceRows.length);
function readCurrent(p){const row=rows.get(p);assert(row,p);const b=fs.readFileSync(path.join(root,p));assert.equal(hash(b),row.sha256,p);return b;}
readCurrent('tests/title-tour-functional-delivery.test.mjs');
const nativeReceipt='F:/VisibleMedicine/staging/20261025-regional-title-native/SOURCE_CANDIDATE.json';
const nativeBytes=fs.readFileSync(nativeReceipt);assert.equal(hash(nativeBytes),'05215efe28eba7f4381fd87daf9212604a123fa1b2b0b810658232743573c1d6');
const native=JSON.parse(nativeBytes),nativeRows=new Map(native.sourceRows.map(r=>[r.path,r]));assert.equal(native.head,current.atlasHead);
assert.equal(current.parentSha256,'78fb4e35a0c9a20347232edfd881f4aeb19ad280fe0d1c6523e699c3496876c1');
const parentBytes=fs.readFileSync(current.parent);assert.equal(hash(parentBytes),current.parentSha256);
const parent=JSON.parse(parentBytes),parentRows=new Map(parent.sourceRows.map(r=>[r.path,r]));
function readParent(p){const b=fs.readFileSync(path.join(parent.website,p));assert.equal(hash(b),parentRows.get(p)?.sha256,p);return b;}
const manifest=JSON.parse(readCurrent('atlas-review/manifest.json'));
assert.equal(manifest.revision,native.head);
const imported=new Map(manifest.files.map(r=>[r.path,r]));
function readImported(p){const row=imported.get(p);assert(row,p);assert.equal(row.sourceSha256,nativeRows.get(p)?.sha256,p);const b=readCurrent('atlas-review/'+p);assert.equal(hash(b),row.importedSha256,p);return b;}

test('all9936Website lessons retain exact source; only11repeated headings change',()=>{
 const folder='atlas-review/content/regional-teaching/',names=fs.readdirSync(root+folder).filter(n=>n.endsWith('.json')&&n!=='index.json');assert.equal(names.length,11);
 let structures=0,placements=0,changed=0,unchanged=0;const changedIds=new Set();
 for(const name of names){
  const relative='content/regional-teaching/'+name,afterBytes=readImported(relative);
  assert.equal(hash(afterBytes),nativeRows.get(relative)?.sha256,'Exact native snapshot '+name);
  const after=JSON.parse(afterBytes),before=JSON.parse(readParent(folder+name));
  const restored=structuredClone(after);assert.equal(after.entries.length,before.entries.length);
  for(let i=0;i<after.entries.length;i++){
   const entry=after.entries[i],old=before.entries[i],identity=JSON.parse(entry.identity);assert.equal(entry.identity,old.identity);structures++;
   assert.deepEqual(Object.keys(entry.lessons),Object.keys(old.lessons));
   for(const[tab,lesson]of Object.entries(entry.lessons)){
    placements++;const previous=old.lessons[tab];
    if(lesson.title===previous.title){assert.deepEqual(lesson,previous);unchanged++;continue;}
    assert.equal(after.region,'abdomen');const prefix=identity.name+' · '+identity.name+' · ';
    assert(previous.title.startsWith(prefix));assert.equal(lesson.title,identity.name+' · '+previous.title.slice(prefix.length));
    assert.deepEqual({...lesson,title:previous.title},previous,'All other clinical/reference/readiness fields exact');
    restored.entries[i].lessons[tab].title=previous.title;changed++;changedIds.add(identity.id);
   }
  }
  assert.deepEqual(restored,before,'Complete snapshot differs only at admitted headings');
 }
 assert.equal(structures,1104);assert.equal(placements,9936);assert.equal(changed,11);assert.equal(unchanged,9925);assert.equal(changedIds.size,9);
 const after=JSON.parse(readImported('content/body-review-display-pins.json')),before=JSON.parse(readParent('atlas-review/content/body-review-display-pins.json'));
 assert(Array.isArray(after.pins)&&Array.isArray(before.pins));assert.equal(after.pins.length,1104);assert.equal(before.pins.length,1104);
 const oldPins=new Map(before.pins.map(p=>[p.structureId,p]));assert.equal(oldPins.size,1104);
 const changedPins=after.pins.filter(p=>{const previous=oldPins.get(p.structureId);assert(previous);assert.deepEqual(Object.keys(p),Object.keys(previous));return p.sha256!==previous.sha256;}).map(p=>p.structureId);assert.equal(changedPins.length,9);
 assert.deepEqual(changedPins.sort(),[...changedIds].sort(),'Only the nine corrected teaching materials advance');
 const renderer=JSON.parse(readImported('content/body-renderer-revision.json')),previousRenderer=JSON.parse(readParent('atlas-review/content/body-renderer-revision.json'));
 assert.notEqual(renderer.sourceRendererSha256,previousRenderer.sourceRendererSha256,'Renderer review remains independently revision-bound');
});

async function tourApi(base,prefix,sealedRows){
 const entry=`export * from './${prefix}lib/regional-tours';export {bodyDisplayCatalog} from './${prefix}lib/body-display-catalog';export {default as raw} from './${prefix}public/models/bodyparts3d/full-body/catalog.json';`;
 const result=await build({stdin:{contents:entry,resolveDir:base,loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,metafile:true,alias:{'@':base}});
 for(const p of Object.keys(result.metafile.inputs).filter(p=>p!=='<stdin>')){
  const absolute=path.resolve(p),relative=path.relative(base,absolute).replaceAll('\\','/');assert(!relative.startsWith('../')&&!path.isAbsolute(relative),p);
  const row=sealedRows.get(relative);assert(row,'Every actual compiler input is source-bound: '+relative);assert.equal(hash(fs.readFileSync(absolute)),row.sha256,relative);
 }
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('imported Website tours preserve all53native tours and414complete evidence results with fresh mutation refusal',async()=>{
 const website=await tourApi(root,'atlas-review/',rows),original=await tourApi(native.atlas,'',nativeRows);
 assert.deepEqual(website.regionalTours,original.regionalTours);
 const a=website.bodyDisplayCatalog(website.raw),b=original.bodyDisplayCatalog(original.raw);assert.deepEqual(a,b);
 let comparisons=0;assert.equal(website.regionalTours.length,53);
 for(const tour of website.regionalTours){
  assert.deepEqual(website.regionalTourResolvedFrames(a,tour),original.regionalTourResolvedFrames(b,tour));
  for(const id of new Set([...tour.contextIds,...tour.steps.map(s=>s.selectedId)])){
   assert.deepEqual(website.regionalTourEvidence(a,id),original.regionalTourEvidence(b,id));comparisons++;
  }
 }
 assert.equal(comparisons,414);
 const tour=website.regionalTours.find(t=>t.steps.some(s=>s.frameIds));assert(tour);const same=structuredClone(a),before=website.regionalTourResolvedFrames(same,tour),index=same.structures.findIndex(s=>s.id===tour.steps[0].selectedId);assert(index>=0);
 const[removed]=same.structures.splice(index,1);assert.throws(()=>website.regionalTourResolvedFrames(same,tour));assert.throws(()=>website.regionalTourEvidence(same,tour.steps[0].selectedId));same.structures.splice(index,0,removed);assert.deepEqual(website.regionalTourResolvedFrames(same,tour),before);
});

test('the reachable regional learner was emitted from the exact new tour and teaching source inputs',()=>{
 const base='public/atlas-runtime/head-neck/',runtime=JSON.parse(readCurrent(base+'manifest.json'));assert.equal(runtime.sourceCommit,native.head);assert.equal(runtime.patientDataIncluded,false);assert.equal(runtime.clinicalApproved,false);
 const files=new Map(runtime.files.map(r=>[r.path,r])),inputs=JSON.parse(readCurrent(base+'source-inputs.json'));assert.equal(files.get('source-inputs.json').sha256,hash(readCurrent(base+'source-inputs.json')));
 const byPath=new Map(inputs.map(r=>[r.path,r]));assert.equal(byPath.size,inputs.length);
 for(const p of ['app/regional-guided-learning.tsx','lib/regional-tours.ts','content/abdominal-eus-orientation.ts','content/abdominal-fold-ultrasound.ts','content/abdominal-detail-connective-xray.ts','content/abdominal-detail-vascular-xray.ts'])assert.equal(byPath.get(p)?.sha256,nativeRows.get(p)?.sha256,p);
 const reachable=new Set();function visit(p){if(reachable.has(p))return;reachable.add(p);const r=files.get(p);assert(r,p);const bytes=readCurrent(base+p);assert.equal(hash(bytes),r.sha256,p);for(const m of bytes.toString().matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))visit('assets/'+m[1]);}visit('index.html');
 assert([...reachable].some(p=>/^assets\/body-content-[^/]+\.js$/.test(p)));assert(reachable.size>5);
 const source=readImported('app/regional-guided-learning.tsx').toString();assert(source.includes('regionalTourResolvedFrames(catalog,tour)'),'The learner consumes the admitted batch API');
});

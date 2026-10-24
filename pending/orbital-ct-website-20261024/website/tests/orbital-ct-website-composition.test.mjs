import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';
import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertCurrentTourSource} from './adjacent-current-tour-source-role.mjs';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
const stage='F:/VisibleMedicine/staging/20261024-orbital-ct-website',site=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),native=json(prep.atlasReceipt),capture=json(stage+'/CAPTURE.json');
const ids=new Set(['FMA52623','FMA52622','FMA52657','FMA52656']);
let api;
async function actual(){
 if(api)return api;
 const result=await build({stdin:{contents:"export {bodyOrbitalCtLesson} from './lib/body-orbital-ct';export {bodyLesson} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyReviewMaterial} from './lib/body-review-material';export {parseBodyReviewResponse} from './lib/body-review-response';",resolveDir:site+'/atlas-review',loader:'ts'},absWorkingDir:site,bundle:true,write:false,format:'esm',platform:'node',metafile:true});
 const manifest=json(site+'/atlas-review/manifest.json'),binding=json(site+'/atlas-review/integration-inputs.json');
 for(const p of Object.keys(result.metafile.inputs))if(p!=='<stdin>'){
  const rel=p.replaceAll('\\','/');assert(rel.startsWith('atlas-review/')&&!rel.includes('..'),rel);
  assert.equal(sha(read(site+'/'+rel)),manifest.files.find(r=>r.path===rel.slice(13))?.importedSha256,rel);
  const row=binding.inputs.find(r=>r.path===rel);
  if(row)assert.equal(row.sha256,sha(read(site+'/'+rel)),rel);
  else assert(['atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json'].includes(rel),'Only stock derived rows excluded from cyclic binding');
 }
 api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));return api;
}
test('current exact delivery and original b79 proof reconstruct without relaxing assertions',()=>{
 const p=validateCurrentAtlasDelivery();assert.equal(p.source,native.atlasHead);assert.deepEqual(p,capture.pin);
 const before=read(stage+'/preimages/tests/current-atlas-delivery.test.mjs.raw').toString();
 assert.equal(sha(Buffer.from(before)),parent.sourceRows.find(r=>r.path==='tests/current-atlas-delivery.test.mjs').sha256);
 let inverse=read(site+'/tests/current-atlas-delivery.test.mjs').toString();
 inverse=inverse.replaceAll(native.atlasHead,parent.atlasHead).replace(native.atlasTree,parent.atlasTree).replace('assert.equal(sourceFiles,1604);assert.equal(inputs,1807);assert(artifacts>100);','assert.equal(sourceFiles,1603);assert.equal(inputs,1806);assert(artifacts>100);');
 assert.equal(inverse,before);assert.equal(read(site+'/tests/fixtures/current-atlas-delivery-studio-b79.mjs.raw').toString(),before);
 const proof=json(stage+'/PROOF_PATCH.json');let helper=read(site+'/tests/adjacent-current-tour-source-role.mjs').toString();
 for(const[a,b]of [...proof.changes].reverse()){assert.equal(helper.split(b).length,2);helper=helper.replace(b,a);}
 assert.equal(sha(Buffer.from(helper)),proof.beforeSha256);assertCurrentTourSource();
});
test('actual protected Review resolver exposes exactly four native CT drafts and rejects forged worksheet teaching',async()=>{
 const a=await actual(),catalog=a.bodyDisplayCatalog(json(prep.atlas+'/public/models/bodyparts3d/full-body/catalog.json'));
 assert.equal(catalog.structures.length,1104);const targets=catalog.structures.filter(s=>ids.has(s.fmaId));assert.equal(targets.length,4);
 const snapshot=json(prep.atlas+'/content/regional-teaching/head-neck.json');
 for(const s of targets){
  const expected=snapshot.entries.find(e=>JSON.parse(e.identity).id===s.id)?.lessons.ct;
  assert(expected);const lesson=a.bodyLesson(s,'ct');assert.deepEqual(lesson,expected);assert.equal(lesson.readiness,'draft');
  assert.equal(a.bodyOrbitalCtLesson({...s,laterality:s.laterality==='left'?'right':'left'},'ct'),undefined);
  assert.equal(a.bodyOrbitalCtLesson(s,'mri'),undefined);
  const packet=await a.bodyReviewMaterial(s.id);assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert(await a.parseBodyReviewResponse(packet,s.id));
  for(const change of [p=>p.topics.find(t=>t.tab==='ct').readiness='approved',p=>p.topics.find(t=>t.tab==='ct').body+=' invented',p=>p.topics.find(t=>t.tab==='ct').citations[0]='javascript:invalid']){const forged=structuredClone(packet);change(forged);assert.equal(await a.parseBodyReviewResponse(forged,s.id),null);}
 }
});
test('actual exported learner entry reaches the new CT teaching and retains independent licensed model delivery',()=>{
 const base=site+'/public/atlas-runtime/head-neck/',manifest=json(base+'manifest.json'),search=emittedTeachingSearch(base,manifest.files);
 assert.equal(manifest.sourceCommit,native.atlasHead);assert.equal(manifest.patientDataIncluded,false);assert.notEqual(manifest.clinicalApproved,true);
 for(const needle of ['CT teaching starts with the orbital apex','thin-section orbital or facial CT can orient the supraorbital rim','Atlas, case and lecture access remain independent.'])assert(search.includes(needle),needle);
 const old=json(parent.website+'/lib/atlas-model-inventory.json'),now=json(site+'/lib/atlas-model-inventory.json');assert.deepEqual(now.models,old.models);assert.equal(now.models.length,137);
 for(const p of ['package.json','package-lock.json','components/StudioNavigation.tsx','components/HeadAtlasViewer.tsx','lib/head-atlas-links.ts','lib/head-separate-comparison.ts','scripts/bind-clinical-review.mjs'])assert.deepEqual(read(site+'/'+p),read(parent.website+'/'+p),p);
 assert.match(read(site+'/lib/atlas-delivery-policy.ts').toString(),/audience: 'administrator-review'/);
});

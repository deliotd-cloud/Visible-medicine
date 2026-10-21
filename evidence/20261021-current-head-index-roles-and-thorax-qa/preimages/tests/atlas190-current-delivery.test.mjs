import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {transform} from 'esbuild';
import {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {restoreSalivaryPrior} from './salivary-cache-epoch-adapter.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(root+'/'+p),json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const source='190a63238eadcf906abe89dcbb6a67c88afe70b9',tree='c314f1cbfa394caed4c6874864fda7dea0a3286c';
const previous='485df97c2530e8e81a8d39a5ee61073ce76d93db';
const fixtures='tests/fixtures/source190-admission/';

test('salivary Map typing correction has an exact whole-source inverse and identical executable output',async()=>{
 const before=read(fixtures+'salivary-before-type-annotation.ts.raw').toString(),after=restoreSalivaryPrior(read('tests/clinical-review-salivary-stylohyoid-quiz.test.ts')).toString();
 assert.equal(sha(before),'fe9bbfe9e64286d36f1f373fd18475e91cdaf7a2ba6c504a0a71c7e483666dd5','Exact original assertion source');
 const from='const featureByIdentity=new Map(featureCache.entries.map',to='const featureByIdentity=new Map<string,any>(featureCache.entries.map';
 assert.equal(before.split(from).length,2);assert.equal(after,before.replace(from,to));assert.equal(after.replace(to,from),before);
 const compile=text=>transform(text,{loader:'ts',format:'esm',target:'es2022'}).then(r=>r.code);
 assert.equal(await compile(after),await compile(before),'Type annotation cannot change executable assertions or data');
});

test('source190 admission preserves the complete previous current contract as a separate epoch',()=>{
 const before=json(fixtures+'previous-current.json'),proof=json(fixtures+'admission.json');
 assert.equal(before.source,previous);assert.equal(before.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');
 assert.equal(before.reviewIntegration,'57663bdf62246dac62ef8a51e762432a711ab2f042d09b69ec1a34c23b8e4703');
 assert.equal(sha(read(fixtures+'previous-current.json')),proof.previousCurrentSha256);
 assert.equal(sha(read('tests/current-atlas-delivery.test.mjs')),proof.previousTestSha256);
 assert.equal(sha(read(fixtures+'importer-before.mjs.raw')),proof.previousImporterSha256);
 const old=read(fixtures+'importer-before.mjs.raw').toString(),current=read('scripts/import-clinical-review.mjs').toString();
 assert.equal(old.split(previous).length,2);assert.equal(current,old.replace(previous,source));assert.equal(current.replace(source,previous),old);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),'Historical485pin must not admit current190bytes');
});

test('source190 Review and every emitted learner file match their exact committed source and binding',()=>{
 const pin=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 const review=json('atlas-review/manifest.json'),binding=json('atlas-review/integration-inputs.json');
 for(const f of review.files){assert.equal(sha(read('atlas-review/'+f.path)),f.importedSha256,f.path);assert.equal(sha(readFileSync(atlas+'/'+f.path)),f.sourceSha256,f.path+' source');}
 for(const f of binding.inputs)assert.equal(sha(read(f.path)),f.sha256,f.path+' bound presentation');
 for(const module of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+module+'/',m=json(base+'manifest.json');assert.equal(m.sourceCommit,source);assert.equal(m.patientDataIncluded,false);
  for(const f of m.files){assert(/^[A-Za-z0-9_./-]+$/.test(f.path)&&f.path.split('/').every(p=>p&&p!=='.'&&p!=='..'));const stat=lstatSync(root+'/'+base+f.path);assert(stat.isFile()&&!stat.isSymbolicLink());const bytes=read(base+f.path);assert.equal(bytes.length,f.bytes);assert.equal(sha(bytes),f.sha256,base+f.path);}
  for(const k of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])assert(m[k]===false||m[k]===undefined,'No widened clearance:'+module+':'+k);
 }
});

test('source190 protected model bytes and licence package set remain identical to the previous candidate',()=>{
 const proof=json(fixtures+'admission.json'),inventory=json('lib/atlas-model-inventory.json'),viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(sha(JSON.stringify(inventory.models)),proof.modelsSha256);assert.equal(inventory.models.length,137);assert.equal(inventory.models.flatMap(m=>m.paths).length,144);
 assert.equal(sha(JSON.stringify([...viewer.packages].sort((a,b)=>a.name.localeCompare(b.name)))),proof.viewerPackagesSha256);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.modelDelivery,'existing-protected-inventory');
 for(const f of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+f.path)),f.sha256);
 assert.equal(json('lib/plexus-review-manifest.json').admissions,0);assert.equal(proof.clinicalApproval,false);assert.equal(proof.canonicalInstalled,false);
});

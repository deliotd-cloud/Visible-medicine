import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const stage=new URL('../',import.meta.url);
const atlas='F:/VisibleMedicine/staging/20261020-inbox-material-source';
const require=createRequire('F:/VisibleMedicine/staging/20261020-combined-website-ui/website/package.json');
const {transformSync}=require('esbuild');
const read=p=>readFileSync(new URL(p,stage));
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const proof=json('SOURCE_PIN_PROOF.json');
assert.equal(sha(read('content/dental-mri-pins.json')),proof.pinSha256);
assert.equal(sha(readFileSync(atlas+'/lib/body-source-additions.ts')),proof.canonicalHelperSha256);
assert.equal(sha(readFileSync(atlas+'/lib/body-presentation-parts.ts')),proof.canonicalHelperDependencySha256);
const {sourceCanonical}=await import(pathToFileURL(atlas+'/lib/body-source-additions.ts'));
const load=(p,imports)=>{
 const code=transformSync(read(p).toString(),{loader:'ts',format:'cjs',target:'es2022'}).code;
 const module={exports:{}};
 new Function('require','module','exports',code)(id=>{assert(Object.hasOwn(imports,id),'Unlisted import: '+id);return imports[id];},module,module.exports);
 return module.exports;
};
const content=load('content/dental-mri.ts',{});
const pins=json('content/dental-mri-pins.json');
const {dentalMriLesson}=load('lib/dental-mri.ts',{
 '../content/dental-mri-pins.json':pins,'../content/dental-mri':content,
 './body-source-additions':{sourceCanonical},
});

test('28 exact pending identities produce four shared MRI drafts with independent result arrays',()=>{
 assert.equal(pins.entries.length,28);assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,28);
 assert.deepEqual(Object.keys(content.dentalMriGroups),['incisors','canines','premolars','molars']);
 const distinctBodies=new Set();
 for(const {identity,previousReadiness} of pins.entries){
  assert.equal(previousReadiness,'pending');
  const result=dentalMriLesson(identity,'mri');
  assert.equal(result.readiness,'draft');assert(result.title.startsWith(identity.name+' · '));
  assert.match(result.note,/revision-bound radiologist review is pending/);
  assert.match(result.note,/not separately segmented/);assert.match(result.note,/access remain independent/);
  assert.match(result.note,/No scan or registration was imported or matched/);
  const before=structuredClone(result);distinctBodies.add(result.body);
  result.bullets.push('foreign');result.citations.push('foreign');
  assert.deepEqual(dentalMriLesson(identity,'mri'),before);
 }
 assert.equal(distinctBodies.size,4,'Shared methods drafts, not28unique lessons');
});

test('other tabs and whole-record identity/source/geometry/approval mutations refuse the draft',()=>{
 let refused=0;
 const mutations=[
  s=>{s.id+='-foreign';},s=>{s.fmaId='FMA0';},s=>{s.name+=' foreign';},
  s=>{s.sourceName+=' foreign';},s=>{s.laterality=s.laterality==='left'?'right':'left';},
  s=>{s.region='thorax';},s=>{s.regions=['head-neck','whole-body'];},s=>{s.system='skeleton';},
  s=>{s.category='bone';},s=>{s.bundle+='-foreign';},s=>{s.nodeName+='-foreign';},
  s=>{s.sourceTree='foreign';},s=>{s.sources=[];},s=>{s.sources[0].file='foreign';},
  s=>{s.sources[0].sha256='0'.repeat(64);},s=>{s.bounds.min[0]-=1;},
  s=>{s.bounds.max[0]+=1;},s=>{s.center[0]+=1;},s=>{s.anchor[0]+=1;},
  s=>{s.coverageNote='reviewed';},s=>{s.provenance={method:'foreign'};},
  s=>{s.validation={status:'reviewed',anatomicalReview:true};},s=>{s.extra=true;},
 ];
 for(const {identity} of pins.entries){
  for(const tab of ['anatomy','function','ct','xray','ultrasound','clinical','pathology','quiz']){
   assert.equal(dentalMriLesson(identity,tab),undefined);refused++;
  }
  for(const mutate of mutations){const altered=structuredClone(identity);mutate(altered);assert.equal(dentalMriLesson(altered,'mri'),undefined);refused++;}
  const reordered=Object.fromEntries(Object.entries(identity).reverse());
  assert.deepEqual(dentalMriLesson(reordered,'mri'),dentalMriLesson(identity,'mri'),'Canonical key order is not anatomy change');
 }
 assert.equal(refused,868);
});

test('exact raw catalogue targets agree with pins and unrelated identities are out of scope',()=>{
 const catalog=JSON.parse(readFileSync(atlas+'/public/models/bodyparts3d/full-body/catalog.json'));
 assert.equal(sha(readFileSync(atlas+'/public/models/bodyparts3d/full-body/catalog.json')),proof.catalogFileSha256);
 const targets=new Set(pins.entries.map(e=>e.identity.id));let checked=0;
 for(const {identity} of pins.entries){
  const matches=catalog.structures.filter(s=>s.id===identity.id);assert.equal(matches.length,1);
  assert.equal(sourceCanonical(matches[0]),sourceCanonical(identity),'Pin is the exact catalogue record');
 }
 for(const s of catalog.structures){if(targets.has(s.id))continue;assert.equal(dentalMriLesson(s,'mri'),undefined);checked++;}
 assert(checked>900);
 const foreign=structuredClone(pins.entries[0].identity);foreign.id='foreign';
 assert.equal(dentalMriLesson(foreign,'mri'),undefined,'No FMA/name-only fallback');
});

test('proposed body dispatcher preserves its complete clean-source body except the MRI hook',()=>{
 const original=read('originals/app/body-content.ts.raw');
 assert.deepEqual(original,readFileSync(atlas+'/app/body-content.ts'));
 let candidate=read('app/body-content.ts').toString();
 const additions=["import {dentalMriLesson} from '../lib/dental-mri';\n",
  '  const dentalMri=dentalMriLesson(s,tab);\n  if(dentalMri)return dentalMri;\n'];
 for(const addition of additions){assert.equal(candidate.split(addition).length,2);candidate=candidate.replace(addition,'');}
 assert.equal(candidate,original.toString(),'All original dispatch order and lesson bodies preserved');
 // Parse the actual proposed complete source without substituting its imports.
 // This is syntax/inverse evidence, not execution of the complete resolver.
 assert.doesNotThrow(()=>transformSync(read('app/body-content.ts').toString(),{loader:'ts',format:'esm',target:'es2022'}));
});

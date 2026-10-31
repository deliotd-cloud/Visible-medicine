import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {test} from 'node:test';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baseline=process.env.VM_CORONARY_BASELINE;
assert(baseline,'A source-bound previous Atlas is required for the strict content comparison');
const require=createRequire(path.join(baseline,'package.json')),ts=require('typescript');
const plain=value=>JSON.parse(JSON.stringify(value));
function load(site){
 const text=fs.readFileSync(path.join(site,'content/coronary-venous-teaching.ts'),'utf8');
 const compiled=ts.transpileModule(text,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
 assert.equal(compiled.diagnostics?.length??0,0);
 const module={exports:{}};runInNewContext(compiled.outputText,{module,exports:module.exports});return plain(module.exports);
}
const before=load(baseline),after=load(root),target=after.coronaryVenousConcepts.find(c=>c.id==='small-cardiac-vein');
const additions={xray:'smallCardiacVenographyCase',ultrasound:'smallCardiacEchoCase'};

test('only two pending imaging topics on the existing small cardiac vein become drafts',()=>{
 const restored=plain(after.coronaryVenousConcepts),changed=restored.find(c=>c.id==='small-cardiac-vein');
 const previous=before.coronaryVenousConcepts.find(c=>c.id==='small-cardiac-vein');
 assert.equal(changed.study,'coronary-venous');assert.deepEqual(changed.fmaIds,['FMA4714']);
 for(const [topic,reference]of Object.entries(additions)){
  assert(!Object.hasOwn(previous.imaging,topic));assert.equal(changed.imaging[topic].readiness,'draft');
  assert.deepEqual(changed.imaging[topic].references,[reference]);delete changed.imaging[topic];
 }
 assert.deepEqual(restored,before.coronaryVenousConcepts,'All previous lessons, quiz, FMA identities and source limits must remain exact');
});

test('two concept-scoped primary case references are the only bibliography additions',()=>{
 const restored=plain(after.coronaryVenousTeachingReferences);
 for(const [key,url]of [['smallCardiacVenographyCase','https://pubmed.ncbi.nlm.nih.gov/30473972/'],['smallCardiacEchoCase','https://doi.org/10.1002/jcu.23993']]){
  assert(!Object.hasOwn(before.coronaryVenousTeachingReferences,key));assert.equal(restored[key].url,url);
  assert.equal(restored[key].scopedToConcept,true);assert.match(restored[key].title,/case report/);delete restored[key];
 }
 assert.deepEqual(restored,before.coronaryVenousTeachingReferences);
});

test('X-ray lesson distinguishes contrast venography and the anomalous case from normal radiographs',()=>{
 const body=target.imaging.xray.body;assert.match(body,/Contrast X-ray venography/);assert.match(body,/enlarged anomalous vein/);
 assert.match(body,/superior vena cava/);assert.match(body,/caval obstruction/);
 assert.match(body,/variant case, not a normal chest-radiograph landmark or a prevalence estimate/);
 assert.match(body,/two grouped model surfaces do not establish an open lumen, junction or patient-specific route/);
 assert(body.split(/\s+/).length<=100);
});

test('ultrasound lesson describes exceptional dilatation and complementary imaging without routine visibility claims',()=>{
 const body=target.imaging.ultrasound.body;assert.match(body,/case report/);assert.match(body,/ostial atresia/);
 assert.match(body,/Contrast echocardiography and coronary CT/);assert.match(body,/right atrium/);
 assert.match(body,/does not establish routine visibility/);assert.match(body,/no ultrasound window, Doppler measurement or registered scan/);
 assert(body.split(/\s+/).length<=100);
});

test('all added teaching references resolve without creating a scan, branch or approval field',()=>{
 for(const topic of Object.keys(additions)){
  const section=target.imaging[topic];assert.deepEqual(Object.keys(section).sort(),['body','readiness','references']);
  for(const key of section.references)assert(after.coronaryVenousTeachingReferences[key]);
 }
 assert.deepEqual(Object.keys(target).sort(),Object.keys(before.coronaryVenousConcepts.find(c=>c.id===target.id)).sort());
});

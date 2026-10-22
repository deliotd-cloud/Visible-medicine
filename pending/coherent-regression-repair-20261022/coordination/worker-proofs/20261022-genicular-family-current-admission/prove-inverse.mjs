// Source/Git-byte proof only; imports the actual pure adapter, never website code.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {reconstructGenicularPrior} from './proposal/tests/genicular-prior-current-inverse.mjs';

const stage='F:/VisibleMedicine/staging/20261022-genicular-family-current-admission';
const site='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function once(text,newText,oldText){
 assert.equal(text.split(newText).length,2,`Unique inverse: ${newText.slice(0,75)}`);
 return text.replace(newText,oldText);
}
const raw=readFileSync(`${stage}/proposal/tests/fixtures/clinical-review-genicular-ultrasound.prior-current.ts.raw`);
const frozenSource=readFileSync(`${site}/tests/clinical-review-genicular-ultrasound.test.ts`);
const proposed=readFileSync(`${stage}/proposal/tests/clinical-review-genicular-ultrasound.test.ts`);
assert.equal(sha(raw),'1383901d9479d17f9321eb97386ede8e1dc4ce59e3016b4d2899a00ac2fe229e');
assert.equal(sha(proposed),'0c410ba6fa730323952ae8c1f242bb8c2d192a2edc2d3606067a2f32dbb2949b');
assert.deepEqual(raw,readFileSync(`${stage}/original/tests/clinical-review-genicular-ultrasound.test.ts`));
assert.deepEqual(raw,frozenSource);
assert.deepEqual(reconstructGenicularPrior(proposed,raw),raw,'Actual authored adapter recovers full frozen source');
const text=proposed.toString('utf8');
for(const [from,to] of [
 ['manifest.sourceCommit,admission.runtimeSources[name]','manifest.sourceCommit,liveCommit'],
 ['sha(committed(admission.runtimeSources.shoulder,path))','sha(committed(liveCommit,path))'],
 ['assert.equal(selected.length,4)','assert.equal(selected.length,3)'],
]){
 assert.equal(text.split(from).length,2,`Unique source mutant: ${from}`);
 assert.throws(()=>reconstructGenicularPrior(Buffer.from(text.replace(from,to)),raw));
}
assert.throws(()=>reconstructGenicularPrior(Buffer.from('if(false){\n'+text+'\n}'),raw));
console.log('Actual pure source adapter passed full bytes and refused family/count/wrapper mutants');

const witnessName='genicular-current-preservation.test.mjs';
const witnessOriginal=readFileSync(`${stage}/original/tests/${witnessName}`);
const witnessProposal=readFileSync(`${stage}/proposal/tests/${witnessName}`);
assert.equal(sha(witnessOriginal),'8ada261f1a0568b8afc4eb4b507a651419ae2680a719ea221d7ae8c4064c0279');
assert.equal(sha(witnessProposal),'860f4a33febf80676c13189ca543fc9a2731bd4461a977e688bc6d2e2b684018');
assert.deepEqual(witnessOriginal,readFileSync(`${site}/tests/${witnessName}`));
let restored=witnessProposal.toString('utf8');
restored=once(restored,"import {reconstructGenicularPrior} from './genicular-prior-current-inverse.mjs';\n",'');
restored=once(restored,
 "const priorCurrentRaw = readFileSync(new URL('./fixtures/clinical-review-genicular-ultrasound.prior-current.ts.raw', import.meta.url));\n",'');
restored=once(restored,
 "  const admitted = readFileSync(new URL('./clinical-review-genicular-ultrasound.test.ts', import.meta.url));\n  const candidate = reconstructGenicularPrior(admitted,priorCurrentRaw);",
 "  const candidate = readFileSync(new URL('./clinical-review-genicular-ultrasound.test.ts', import.meta.url));");
const start="  const admitted=readFileSync(new URL('./clinical-review-genicular-ultrasound.test.ts',import.meta.url));";
assert.equal(restored.split(start).length,2);
const begin=restored.indexOf(start),end=restored.lastIndexOf('});\n');
assert(begin<end);
const added=restored.slice(begin,end);
assert.equal(sha(Buffer.from(added)),'962c36d9a8326918878711222db44b8bc78b6e8945ddb810b6d500f2f23f8c38');
restored=restored.slice(0,begin)+restored.slice(end);
assert.deepEqual(Buffer.from(restored),witnessOriginal,'Complete original witness bytes recovered');
console.log('Witness unique full-file inverse and frozen equality passed');

const original9f=readFileSync(`${site}/tests/fixtures/clinical-review-genicular-ultrasound-before-current.ts.raw`);
assert.equal(sha(original9f),'9f58d0e61113b327695d6cb6c98bd89062e00d5b64c2228ff7636dee9def3f10');
const importLine="import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\n";
const newImport=importLine+"import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';\n"
 +"import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n";
const oldRoot="const atlas='F:/VisibleMedicine/atlas';",newRoot='const atlas=currentAtlasDeliveryRoot();';
const oldCommit="const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2'; // Exact integrated Atlas feature commit.";
const newCommit="const historicalFeature='9fba9a1e24b6669aafd48e945d55fc0939d50ab2'; // Exact original integrated Atlas feature commit.\n"
 +'const liveCommit=admitPreservedClinicalReview({revision:historicalFeature,sourceHashes:{\n'
 +"  'content/genicular-imaging-pins.json':'365a921cf5fa507c682f067df6762dd6759e21c4c686442129bc3f2e3103e9f2',\n"
 +"  'content/genicular-ultrasound.ts':'3a4d9e4da862b4de40aeef26408874ad7679e5ae3e13603f923d0313d70ae298',\n"
 +"  'lib/genicular-ultrasound.ts':'27ecab9cc163d92fb6d2adce507484b62e74dc42b6468ec00860a84f84124a13',\n"
 +"},learnerModules:['head-neck','shoulder']});";
let historical=original9f.toString('utf8');
for(const [before,after] of [[importLine,newImport],[oldRoot,newRoot],[oldCommit,newCommit]]){
 assert.equal(historical.split(before).length,2);
 historical=historical.replace(before,after);
}
assert.equal(raw.toString('utf8'),historical,'Original 9f plus exactly three old seams yields full frozen prior-current');
assert.equal((historical.match(/\ntest\('/g)??[]).length,2,'Both original registered test bodies retained');
console.log('Original 9f full-source three-seam/two-test theorem preserved');

const pin=JSON.parse(readFileSync(`${site}/tests/fixtures/current-atlas-delivery.json`));
const audit=JSON.parse(readFileSync('F:/VisibleMedicine/staging/20261022-historic-schema-repairs-consolidated/TEXT_INPUT_AUDIT.json'));
assert.deepEqual(pin.runtimeSources,audit.familySources);
assert.deepEqual(audit.familyMismatch,[]);
const gitSource=(revision,path)=>execFileSync('git',['--no-replace-objects','show',`${revision}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6});
for(const name of ['head-neck','shoulder']){
 const inputs=JSON.parse(readFileSync(`${site}/public/atlas-runtime/${name}/source-inputs.json`));
 const manifest=JSON.parse(readFileSync(`${site}/public/atlas-runtime/${name}/manifest.json`));
 assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
 for(const path of ['content/genicular-imaging-pins.json','content/genicular-ultrasound.ts','lib/genicular-ultrasound.ts','app/body-content.ts']){
  assert.equal(inputs.find(row=>row.path===path)?.sha256,sha(gitSource(pin.runtimeSources[name],path)),
   `${name}: exact family Git input ${path}`);
 }
}
assert.notEqual(sha(gitSource(pin.source,'app/body-content.ts')),
 sha(gitSource(pin.runtimeSources.shoulder,'app/body-content.ts')));
console.log('Head-neck and shoulder family Git/input roles authenticated, including distinct body-content');

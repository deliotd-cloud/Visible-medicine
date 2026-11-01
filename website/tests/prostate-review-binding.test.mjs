import assert from 'node:assert/strict';import test from 'node:test';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {webcrypto} from 'node:crypto';import {build,transform} from 'esbuild';
import {verifyProstateReviewPresentation} from '../scripts/verify-prostate-review-presentation.mjs';
const root=process.cwd(),require=createRequire(import.meta.url),read=p=>JSON.parse(fs.readFileSync(p));
const compiled=(await transform(fs.readFileSync('scripts/bind-clinical-review.mjs','utf8'),{format:'cjs',target:'es2022'})).code;
function simulate(changed){const outputs=new Map();const readBytes=p=>{const bytes=outputs.get(p)??fs.readFileSync(path.join(root,p));return p===changed?Buffer.concat([Buffer.from(bytes),Buffer.from('\n/* synthetic source change */\n')]):bytes;};
 const mockFs={readFileSync(p,encoding){const b=readBytes(p);return encoding?b.toString(encoding):b;},writeFileSync(p,bytes){outputs.set(p,Buffer.from(bytes));},readdirSync(p,options){return fs.readdirSync(path.join(root,p),options);}};
 runInNewContext(compiled,{require:name=>name==='node:fs'?mockFs:require(name),structuredClone,console:{log(){}},Buffer});
 return {source:JSON.parse(outputs.get('atlas-review/manifest.json')),receipt:JSON.parse(outputs.get('atlas-review/integration-inputs.json')),presentation:JSON.parse(outputs.get('lib/prostate-review-presentation.json'))};}
async function material(presentation){const bundled=await build({entryPoints:['lib/prostate-review-material.ts'],bundle:true,write:false,platform:'node',format:'cjs',target:'es2022',plugins:[{name:'synthetic-presentation',setup(b){b.onLoad({filter:/prostate-review-presentation\.json$/},()=>({contents:JSON.stringify(presentation),loader:'json'}));}}]});const m={exports:{}};runInNewContext(bundled.outputFiles[0].text,{module:m,exports:m.exports,require,crypto:webcrypto,TextEncoder,Uint8Array,structuredClone,URL,URLSearchParams});return m.exports.prostateReviewMaterial();}
test('real binder includes every prostate renderer, worksheet, API and validator exactly once',()=>{
 const bound=simulate();assert.equal(verifyProstateReviewPresentation(bound).requiredInputs,14);
 const again=simulate();assert.deepEqual(again.presentation,bound.presentation,'repeat binding is deterministic');
 assert.equal(bound.presentation.sourceCommit,read('atlas-review/manifest.json').revision);
 assert.equal(bound.receipt.inputs.filter(row=>row.path==='atlas-review/app/study-return-focus.ts').length,1,'Focus helper must bind the review presentation exactly once');
 for(const file of ['atlas-review/app/study-return-focus.ts','components/ProstateReviewNotes.tsx','lib/prostate-review-contract.ts','lib/prostate-review-api.ts','scripts/clinical-review-viewer/prostate-viewer.tsx','app/workspace/atlas-review/prostate/page.tsx'])assert.notEqual(simulate(file).presentation.presentationRevision,bound.presentation.presentationRevision,file+' must invalidate presentation');
});
test('full source and presentation changes invalidate prostate review context even with identical native geometry',async()=>{
 const original=simulate().presentation,a=await material(original),b=await material({...original,presentationRevision:'0'.repeat(64)}),c=await material({...original,sourceCommit:'0'.repeat(40)});
 assert.equal(a.modelRevision,b.modelRevision);assert.equal(a.modelRevision,c.modelRevision);assert.notEqual(a.revision,b.revision);assert.notEqual(a.revision,c.revision);
 assert.deepEqual(JSON.stringify(a.zones),JSON.stringify(b.zones));assert.equal(a.presentationRevision,original.presentationRevision);
 for(const bad of [{},{...original,extra:true},{...original,presentationRevision:null},{...original,presentationRevision:[original.presentationRevision]},{...original,sourceCommit:'bad'},{...original,schema:'other'}])await assert.rejects(()=>material(bad),/not bound/);
});
test('delivery verifier refuses missing, duplicate, mismatched and self-referential seals',()=>{
 const good=simulate();assert.doesNotThrow(()=>verifyProstateReviewPresentation(good));
 for(const altered of [
  {...good,presentation:{...good.presentation,presentationRevision:'0'.repeat(64)}},
  {...good,presentation:{...good.presentation,sourceCommit:'0'.repeat(40)}},
  {...good,presentation:{...good.presentation,clinicalApproval:true}},
  {...good,receipt:{...good.receipt,inputs:good.receipt.inputs.filter(r=>r.path!=='lib/prostate-review-api.ts')}},
  {...good,receipt:{...good.receipt,inputs:[...good.receipt.inputs,good.receipt.inputs.find(r=>r.path==='lib/prostate-review-api.ts')]}},
  {...good,receipt:{...good.receipt,inputs:[...good.receipt.inputs,{path:'lib/prostate-review-presentation.json',sha256:'0'.repeat(64)}]}}
 ])assert.throws(()=>verifyProstateReviewPresentation(altered));
 const verifier=fs.readFileSync('scripts/verify-clinical-review.mjs','utf8');assert.match(verifier,/verifyProstateReviewPresentation\(\{source,receipt\}\)/);
});

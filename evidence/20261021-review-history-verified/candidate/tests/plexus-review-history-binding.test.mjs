// Exact F-local presentation transition; no private packet/assets are fixtures.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const originalRoot='F:/VisibleMedicine/staging/20261021-imaging-comparison-label-candidate/website';
const fingerprintFile=resolve(existsSync(resolve(root,'scripts/plexus-review-fingerprints.mjs'))?root:originalRoot,'scripts/plexus-review-fingerprints.mjs');
const fingerprintURL=pathToFileURL(fingerprintFile).href;
const {plexusHash}=await import(fingerprintURL);
assert.equal(plexusHash(readFileSync(fingerprintFile)),'499649237cf340062f87b85e11e239cae7320423b8d84fb23a8f06fda1093972');
const source=readFileSync(resolve(root,'scripts/rebind-plexus-review-history.mjs'),'utf8');
const {rebindPlexusHistory,historyPins}=await import('data:text/javascript;base64,'+Buffer.from(source.replace("'./plexus-review-fingerprints.mjs'",JSON.stringify(fingerprintURL))).toString('base64'));
const readOriginal=p=>readFileSync(resolve(originalRoot,p));
const sparse=!existsSync(resolve(root,'lib/clinical-review-navigation-guard.ts'));
const readCandidate=p=>readFileSync(resolve(sparse?(p==='lib/clinical-review-navigation-guard.ts'?'F:/VisibleMedicine/staging/20261021-review-history-guard-proposal/candidate':originalRoot):root,p));
const original=JSON.parse(readOriginal('lib/plexus-review-manifest.json'));
const moduleText=readOriginal('.local/plexus-review/assets.ts').toString();
const run=(packet=original,module=moduleText,before=readOriginal,after=readCandidate)=>rebindPlexusHistory(packet,module,before,after);
const marker='export const plexusReviewAssets: Record<string,string> = ';
const assets=m=>JSON.parse(m.split(marker)[1].trim().replace(/;$/,''));

test('history guard binds the sole changed presentation input with exact packet/module inverses',()=>{
 const frozen=JSON.stringify(original),result=run();assert.equal(JSON.stringify(original),frozen);
 const expected=original.presentationInputs.map(r=>r.path==='lib/clinical-review-navigation-guard.ts'?{...r,sha256:historyPins.helperAfter}:r);
 assert.deepEqual(result.packet.presentationInputs,expected);
 for(const key of ['study','topologyInputs','packages'])assert.deepEqual(result.packet[key],original[key]);
 assert.deepEqual(result.packet.context.checklists,original.context.checklists);assert.equal(result.after.topologyHash,result.before.topologyHash);
 const inverse=structuredClone(result.packet);inverse.context=structuredClone(original.context);inverse.presentationInputs=structuredClone(original.presentationInputs);inverse.files=structuredClone(original.files);assert.deepEqual(inverse,original);
 const before=assets(moduleText),after=assets(result.moduleText);for(const name of Object.keys(before).filter(n=>n!=='index.html'))assert.equal(after[name],before[name],name);
 const oldHtml=Buffer.from(before['index.html'],'base64').toString(),newHtml=Buffer.from(after['index.html'],'base64').toString();
 assert.equal(newHtml.replaceAll(result.after.materialHash,result.before.materialHash),oldHtml);
 for(const row of result.packet.files){const bytes=Buffer.from(after[row.name],'base64');assert.equal(bytes.length,row.bytes);assert.equal(plexusHash(bytes),row.sha256);}
 const inversedAssets={...after,'index.html':before['index.html']};assert.equal(result.moduleText.slice(0,result.moduleText.indexOf(marker))+marker+JSON.stringify(inversedAssets)+';\n',moduleText);
 assert.equal(result.packet.admissions,0);assert.equal(result.packet.clinicalValidation,false);assert.equal(result.packet.context.clinicalApproved,false);assert.equal(result.packet.context.learnerCatalogAdmission,false);assert.equal(result.packet.context.frame.patientRegistration,false);
});

test('every prior and candidate Website input remains required, including the exact helper',()=>{
 for(const row of [...original.topologyInputs,...original.presentationInputs].filter(r=>r.kind==='website')){
  assert.throws(()=>run(original,moduleText,p=>p===row.path?Buffer.concat([readOriginal(p),Buffer.from('\n')]):readOriginal(p)),row.path+' old drift');
  assert.throws(()=>run(original,moduleText,readOriginal,p=>p===row.path?Buffer.concat([readCandidate(p),Buffer.from('\n')]):readCandidate(p)),row.path+' new drift');
 }
 assert.throws(()=>run(original,moduleText,readOriginal,p=>p==='lib/clinical-review-navigation-guard.ts'?readOriginal(p):readCandidate(p)),'stale click-only helper cannot pass');
});

test('forged packets, omitted/duplicate inputs, widened clearance and private module drift are refused',()=>{
 for(const mutate of [p=>p.study.parts.pop(),p=>p.packages.pop(),p=>p.presentationInputs.pop(),p=>p.presentationInputs.push(p.presentationInputs[0]),p=>p.topologyInputs.pop(),p=>p.context.checklists.presentation.pop(),p=>p.files.pop(),p=>p.admissions=1,p=>p.clinicalValidation=true,p=>p.patientDataIncluded=true,p=>p.context.clinicalApproved=true,p=>p.context.learnerCatalogAdmission=true,p=>p.context.frame.patientRegistration=true,p=>p.context.revisions.presentation='0'.repeat(64)]){const packet=structuredClone(original);mutate(packet);assert.throws(()=>run(packet));}
 assert.throws(()=>run(original,moduleText+'\n'));const result=run();assert.throws(()=>run(result.packet,result.moduleText),'not a general repinning API');
});

test('historical click-only binding contract remains complete outside its explicit source-role seam',()=>{
 if(sparse){assert.equal(plexusHash(readOriginal('tests/plexus-review-navigation-binding.test.mjs')),'f348dd25e815fafc9f37b10fc54a37fe5b6cafe9e4e500fcedb8d2c304ef662e');return;}
 const old=readFileSync(resolve(root,'tests/fixtures/review-history-navigation-binding.test.mjs.raw'));
 assert.equal(plexusHash(old),'f348dd25e815fafc9f37b10fc54a37fe5b6cafe9e4e500fcedb8d2c304ef662e');
 const before='const candidate=process.env.PLEXUS_NAVIGATION_WEBSITE||stage;',after="const candidate=process.env.PLEXUS_NAVIGATION_WEBSITE||'F:/VisibleMedicine/staging/20261021-imaging-comparison-label-candidate/website';";
 const current=readFileSync(resolve(root,'tests/plexus-review-navigation-binding.test.mjs'),'utf8');assert.equal(current.split(after).length,2);assert.equal(current.replace(after,before),old.toString(),'Every original body, refusal and source check remains exact');
});

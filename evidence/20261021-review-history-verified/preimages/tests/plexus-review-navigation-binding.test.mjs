// F-local, read-only integration of a pure transition. No generated assets copied.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const stage=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const canonical=process.env.PLEXUS_ORIGINAL_WEBSITE||'F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate/baseline-website';
const candidate=process.env.PLEXUS_NAVIGATION_WEBSITE||stage;
const sparseProposal=!existsSync(resolve(stage,'scripts/plexus-review-fingerprints.mjs'));
const fingerprintsURL=pathToFileURL(resolve(canonical,'scripts/plexus-review-fingerprints.mjs')).href;
const {plexusHash,plexusFingerprints}=await import(fingerprintsURL);
assert.equal(plexusHash(readFileSync(resolve(canonical,'scripts/plexus-review-fingerprints.mjs'))),'499649237cf340062f87b85e11e239cae7320423b8d84fb23a8f06fda1093972');
// Only adapt the sibling import location for this sparse, source-only proposal.
const source=readFileSync(resolve(stage,'scripts/rebind-plexus-review-navigation.mjs'),'utf8');
const transition=await import('data:text/javascript;base64,'+Buffer.from(source.replace("'./plexus-review-fingerprints.mjs'",JSON.stringify(fingerprintsURL))).toString('base64'));
const {rebindPlexusNavigation,navigationImporter,navigationWorksheet,navigationPins}=transition;
const original=JSON.parse(readFileSync(resolve(canonical,'lib/plexus-review-manifest.json')));
const moduleText=readFileSync(resolve(canonical,'.local/plexus-review/assets.ts'),'utf8');
const readOriginal=p=>readFileSync(resolve(canonical,p));
const readCandidate=p=>readFileSync(resolve(sparseProposal&&p==='scripts/import-plexus-review.mjs'?stage:candidate,p));
const run=(p=original,m=moduleText,old=readOriginal,next=readCandidate)=>rebindPlexusNavigation(p,m,old,next);
const marker='export const plexusReviewAssets: Record<string,string> = ';
const assets=m=>JSON.parse(m.split(marker)[1].trim().replace(/;$/,''));
test('exact importer sole dependency seam and entire worksheet two-seam preservation',()=>{
  assert.equal(navigationImporter(readOriginal('scripts/import-plexus-review.mjs')),readCandidate('scripts/import-plexus-review.mjs').toString());
  assert.equal(navigationWorksheet(readOriginal('components/PlexusReviewWorksheet.tsx')),readCandidate('components/PlexusReviewWorksheet.tsx').toString());
  for(const path of ['scripts/import-plexus-review.mjs','components/PlexusReviewWorksheet.tsx'])assert.throws(()=>path.startsWith('scripts')?navigationImporter(Buffer.concat([readOriginal(path),Buffer.from('\n')])):navigationWorksheet(Buffer.concat([readOriginal(path),Buffer.from('\n')])));
});
test('authentic full original packet/module transition preserves all non-HTML bytes and semantics',()=>{
  const frozen=JSON.stringify(original);const result=run();
  assert.equal(JSON.stringify(original),frozen);
  const beforeAssets=assets(moduleText),afterAssets=assets(result.moduleText);
  assert.equal(result.after.topologyHash,result.before.topologyHash);
  for(const name of Object.keys(beforeAssets).filter(n=>n!=='index.html'))assert.equal(afterAssets[name],beforeAssets[name]);
  for(const name of ['study','topologyInputs','packages'])assert.deepEqual(result.packet[name],original[name]);
  const context=structuredClone(result.packet.context);for(const key of ['materialHash','presentationHash'])context[key]=original.context[key];context.revisions.presentation=original.context.revisions.presentation;assert.deepEqual(context,original.context);
  const pins=result.packet.presentationInputs.filter(f=>f.path!=='lib/clinical-review-navigation-guard.ts').map(f=>({...f,sha256:f.path==='components/PlexusReviewWorksheet.tsx'?navigationPins.worksheetBefore:f.path==='scripts/import-plexus-review.mjs'?navigationPins.importerBefore:f.sha256}));assert.deepEqual(pins,original.presentationInputs);
  assert.equal(result.packet.presentationInputs.length,original.presentationInputs.length+1);
  const html=Buffer.from(afterAssets['index.html'],'base64').toString();
  assert.equal(html.replaceAll(result.after.materialHash,result.before.materialHash),Buffer.from(beforeAssets['index.html'],'base64').toString());
  for(const pin of result.packet.files){const bytes=Buffer.from(afterAssets[pin.name],'base64');assert.equal(bytes.length,pin.bytes);assert.equal(plexusHash(bytes),pin.sha256);}
  const p=result.packet;assert.deepEqual(plexusFingerprints({study:p.study,topologyInputs:p.topologyInputs,presentationInputs:p.presentationInputs,assets:p.files.filter(f=>f.name!=='index.html').map(({name,sha256})=>({name,sha256})),packages:p.packages,checklistVersion:p.context.checklistVersion,checklists:p.context.checklists}),result.after);
});
test('refuses packet forgery, omitted/duplicate inputs, admission and private module drift',()=>{
  const mutations=[p=>p.study.parts.pop(),p=>p.packages.pop(),p=>p.context.checklists.topology.pop(),p=>p.topologyInputs.pop(),p=>p.presentationInputs.pop(),p=>p.presentationInputs.push(p.presentationInputs[0]),p=>p.files.pop(),p=>p.admissions=1,p=>p.clinicalValidation=true,p=>p.patientDataIncluded=true,p=>p.context.clinicalApproved=true,p=>p.context.revisions.presentation='0'.repeat(64)];
  for(const mutate of mutations){const p=structuredClone(original);mutate(p);assert.throws(()=>run(p));}
  assert.throws(()=>run(original,moduleText+'\n'));
  const changed=assets(moduleText);changed['app.js']=Buffer.from('synthetic forged bytes').toString('base64');assert.throws(()=>run(original,moduleText.slice(0,moduleText.indexOf(marker))+marker+JSON.stringify(changed)+';\n'));
});
test('refuses every old Website input drift and every new candidate input drift',()=>{
  const paths=[...original.topologyInputs,...original.presentationInputs].filter(f=>f.kind==='website').map(f=>f.path);
  for(const path of paths){
    assert.throws(()=>run(original,moduleText,p=>p===path?Buffer.concat([readOriginal(p),Buffer.from('\n')]):readOriginal(p)),'Old input '+path);
    assert.throws(()=>run(original,moduleText,readOriginal,p=>p===path?Buffer.concat([readCandidate(p),Buffer.from('\n')]):readCandidate(p)),'Candidate input '+path);
  }
  assert.throws(()=>run(original,moduleText,readOriginal,p=>p==='lib/clinical-review-navigation-guard.ts'?Buffer.from(''):readCandidate(p)));
  assert.throws(()=>run(original,moduleText,readOriginal,p=>p==='scripts/import-plexus-review.mjs'?readOriginal(p):readCandidate(p)));
  assert.throws(()=>run(original,moduleText,readOriginal,p=>p==='components/PlexusReviewWorksheet.tsx'?readOriginal(p):readCandidate(p)));
  const next=run();assert.throws(()=>run(next.packet,next.moduleText));
});

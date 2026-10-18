import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {contentContext} from './content-contract-tools.mjs';
import {snapshot,hash} from './pin-pica-clinical.mjs';

const parentCommit='7b3e678ae4b8059aadb84459048ebd05f7abe7b9';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
const proposalPath='F:/VisibleMedicine/staging/20261018-deep-plantar-us-adapter-audit/STATIC_ADAPTER_PROPOSAL.json';
const proposalBytes=await readFile(proposalPath),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(proposalBytes),'47aaaca4ed0799bc3aec65ae579800e45c0497c11e406bd01c367b52f6c9196d');
const proposal=JSON.parse(proposalBytes);
for(const row of proposal.sourceFiles)assert.equal(sha(await readFile(row.path)),row.sha256,row.path);
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
assert.equal(display.structures.length,1104);assert.equal(api.contentTabs.length,9);
const entries=[];
for(const target of proposal.entries){
  const matches=display.structures.filter(s=>s.fmaId===target.fmaId);assert.equal(matches.length,1);
  const identity=matches[0];assert.deepEqual(identity,target.catalogIdentity);
  const previous=api.bodyLesson(identity,'ultrasound');assert.deepEqual(previous,target.priorLesson);assert.equal(previous.readiness,'pending');
  const packet=await api.bodyReviewMaterial(identity.id);assert.equal(packet.approval,false);
  entries.push({identity,previous,reviewFingerprint:{fingerprints:packet.fingerprints,materialHash:packet.materialHash}});
}
const bundles=display.bundles.filter(bundle=>entries.some(e=>e.identity.bundle===bundle.id));
assert.equal(bundles.length,1);
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);}
const pins={schema:'vm-deep-plantar-ultrasound-pins-1',parentCommit,sourceVersion:display.sourceVersion,coordinateSystem:display.coordinateSystem,license:display.license,bundles,
  previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries,
  sourceAssetsUnchanged:true,originalObjectBytesVerified:false,
  references:[{doi:'10.1016/S1078-5884(98)80086-5',url:'https://doi.org/10.1016/S1078-5884(98)80086-5',rights:'Reference only; no article, text, figures, scans or tables imported. Original factual editorial summary.'}],
  clinicalApproval:false,patientSpaceRegistration:false,newAssetAdmission:false};
assert.deepEqual(entries.map(e=>e.identity.fmaId),['FMA69514','FMA69515']);
const destination='content/deep-plantar-ultrasound-pins.json';
if(process.argv.includes('--record'))await writeFile(destination,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
else assert.deepEqual(JSON.parse(await readFile(destination)),pins);
console.log(JSON.stringify({recorded:process.argv.includes('--record'),entries:entries.length,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash,priorReview:entries.map(e=>e.reviewFingerprint)}));

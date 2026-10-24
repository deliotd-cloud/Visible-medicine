import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261024-right-gastric-eus-proposal',atlas=stage+'/atlas';
const parentReceipt='F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/SOURCE_BOUND.json';
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
assert(!fs.existsSync(stage));assert.equal(sha(read(parentReceipt)),'b7f04acd1800aa5a01712923159ea26638bdd63f35cb2c9f29ba8ac3ba120c71');
const source=JSON.parse(read(parentReceipt)),native='F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/atlas';
nativeAtlasEnvironment({atlas:native,revision:source.atlasHead,tree:source.atlasTree});
const rows=new Map(source.sourceRows.map(r=>[r.path,r]));
const files=['lib/abdominal-eus-orientation.ts','content/abdominal-eus-orientation.ts','lib/body-source-additions.ts','lib/body-presentation-parts.ts','content/abdominal-branch-imaging-pins.json','content/central-vessel-imaging-pins.json','scripts/workspace-test-build.mjs'];
const snapshots=[];for(const p of files){const bytes=read(native+'/'+p);assert.equal(sha(bytes),rows.get(p).sha256,p);for(const target of [atlas+'/'+p,stage+'/preimages/'+p+'.raw']){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});}snapshots.push({path:p,bytes:bytes.length,sha256:sha(bytes)});}
// Existing installed tool dependencies only. No npm install, network, source mutation or new package.
fs.symlinkSync(native+'/node_modules',atlas+'/node_modules','junction');
const pending=JSON.parse(read('F:/VisibleMedicine/staging/20261024-next-teaching-audit/PENDING.json'));
const targetId='vm:anatomy:body:abdomen:right:vessel:right-gastric-vein';
assert.equal(pending.evidence.sourceRevision,source.atlasHead);assert(pending.rows.some(r=>r.id===targetId&&r.topic==='ultrasound'&&r.readiness==='pending'));
const pins=JSON.parse(read(atlas+'/content/abdominal-branch-imaging-pins.json')),matches=pins.entries.filter(r=>r.identity.id===targetId);assert.equal(matches.length,1);
const identity=matches[0].identity;assert.equal(identity.fmaId,'FMA15400');assert.deepEqual(identity.sources,[{file:'FJ3595',sha256:'a2a2bd3aadf7027de43cb57c0a33b17b3ce3a35c9f495f5fc010486c2b39494d'}]);assert.deepEqual(identity.validation,{status:'unvalidated',anatomicalReview:false});
const preparation={at:new Date().toISOString(),kind:'partial-native-teaching-proposal-only',stage,atlas,parentNative:native,parentReceipt,parentReceiptSha256:sha(read(parentReceipt)),atlasHead:source.atlasHead,atlasTree:source.atlasTree,files:snapshots,targetId,targetIdentity:identity,pendingReport:'F:/VisibleMedicine/staging/20261024-next-teaching-audit/PENDING.json',pendingReportSha256:sha(read('F:/VisibleMedicine/staging/20261024-next-teaching-audit/PENDING.json')),primaryReference:{pmid:'24949362',pmcid:'PMC4062237',doi:'10.7178/eus.04.005',link:'https://pubmed.ncbi.nlm.nih.gov/24949362/',locator:'Left and Right Gastric Vein; Figure33B; discussion'},frozenNativeEdited:false,productionBuild:false,fullResolverCohortRun:false,clinicalApproval:false,patientSpaceRegistration:false,previewChanged:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(preparation,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({preparation:stage+'/PREPARATION.json',sha256:sha(read(stage+'/PREPARATION.json')),sourceFiles:files.length,target:targetId,partialOnly:true}));

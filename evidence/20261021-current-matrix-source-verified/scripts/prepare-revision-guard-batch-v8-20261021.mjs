import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v7',prep=json(previous+'/PREPARATION.json');
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v8';
const changes=[...prep.changes],receipts=[...prep.receipts];
for(const [root,label,count]of [
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-c-v4-native-proof','BATCH_C_V4_WHOLE_SOURCE',1],
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v5-native-proof','BATCH_E_V5_WHOLE_SOURCE',10],
]){
 const isolated=json(root+'/PREPARATION.json'),file=root+'/'+label+'.json',receipt=json(file);
 assert.equal(isolated.sourceSite,prep.site);assert.equal(isolated.proposed.length,18);assert.equal(receipt.code,0);
 assert.equal(sha(read(receipt.log)),receipt.logSha256);
 for(const entry of ['tests '+count,'pass '+count,'fail 0','cancelled 0','skipped 0','todo 0'])assert(receipt.footer.includes('ℹ '+entry));
 for(const row of isolated.proposed){assert.equal(sha(read(row.from)),row.sha256,row.path);assert.equal(sha(read(isolated.site+'/'+row.path)),row.sha256,row.path);changes.push(row);}
 receipts.push({file,sha256:sha(read(file)),label,footer:receipt.footer,logSha256:receipt.logSha256});
}
assert.equal(changes.length,74);assert.equal(new Set(changes.map(row=>row.path)).size,74);
for(const row of changes)assert.equal(row.beforeSha256?sha(read(prep.site+'/'+row.path)):fs.existsSync(prep.site+'/'+row.path),row.beforeSha256??false,row.path);
const actualCurrentModules=[
 'tests/atlas-spinal-muscle-xray.test.mjs','tests/clinical-review-elbow-arterial-tour.test.ts',
 'tests/clinical-review-elbow-us-followup.test.ts','tests/clinical-review-forearm-vascular-xray.test.ts',
 'tests/clinical-review-girdle-muscle-xray.test.ts','tests/clinical-review-orbital-sensory-mri.test.ts',
 'tests/clinical-review-pancreatic-vessel-teaching.test.ts',
 ...changes.filter(row=>row.from.startsWith('F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-c-v4/')&&row.path.endsWith('.test.ts')).map(row=>row.path),
 ...changes.filter(row=>row.from.startsWith('F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v5/')&&row.path.endsWith('.test.ts')).map(row=>row.path),
];
assert.equal(actualCurrentModules.length,20);assert.equal(new Set(actualCurrentModules).size,20);
const next={...prep,stage,at:new Date().toISOString(),supersedes:previous,changes,receipts,actualCurrentModules,
 proposedSourceInputs:prep.previousSourceInputs+changes.filter(row=>row.beforeSha256===null).length,
 scope:'74test-only proposal paths,35existing/39new,5146projected named inputs. 66outer native registrations across13 distinct successful runs plus4historical coverage children; C loop is one registration preserving8whole originals, not8executed teaching modules. E5 has10native guards/negatives after retained E4 9pass/1fail regex-witness error. Whole current teaching/Review modules have NOT run. Compact729B renderer binding reconstructs206963B exact history locally; no full renderer fixture included. Separate40-case review-return UI remains outside this test batch. No source installation/clinical/spatial/full-suite green claim.',
 requiredVerification:prep.requiredVerification.map(row=>row.label==='CLINICAL_CURRENT_EPOCH_BATCH'?{...row,reason:'Execute all20 explicit actualCurrentModules in the main-owned native matrix after the genuine full-suite terminal. Guards/metadata/source hashes are not these current teaching, emitted delivery, historical corpus, refusal and storage proofs.'}:row),
 admissionReady:false,candidateEdited:false,canonicalInstalled:false};
assert.equal(next.proposedSourceInputs,5146);assert(!fs.existsSync(stage));fs.mkdirSync(stage);
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(next,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,testOnlyPaths:74,actualCurrentModules:20,projectedSourceInputs:5146,boundedNativeRegistrations:66,admissionReady:false}));

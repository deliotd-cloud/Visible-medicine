import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v6';
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v7';
const prep=json(previous+'/PREPARATION.json');
const proofStage='F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-d-native-proof';
const isolated=json(proofStage+'/PREPARATION.json'),receiptPath=proofStage+'/BATCH_D_NATIVE_SOURCE_MODEL.json',receipt=json(receiptPath);
assert.equal(isolated.sourceSite,prep.site);assert.equal(receipt.code,0);assert.equal(sha(read(receipt.log)),receipt.logSha256);
assert(receipt.footer.includes('ℹ tests 5')&&receipt.footer.includes('ℹ pass 5')&&receipt.footer.includes('ℹ fail 0')&&receipt.footer.includes('ℹ skipped 0'));
const changes=[...prep.changes,...isolated.proposed.map(row=>({...row,bytes:read(row.from).length}))];
assert.equal(changes.length,38);assert.equal(new Set(changes.map(row=>row.path)).size,38);
for(const row of changes){assert.equal(sha(read(row.from)),row.sha256,row.path);assert.equal(row.beforeSha256?sha(read(prep.site+'/'+row.path)):fs.existsSync(prep.site+'/'+row.path),row.beforeSha256??false,row.path);}
const next={...prep,stage,at:new Date().toISOString(),supersedes:previous,changes,proposedSourceInputs:prep.previousSourceInputs+changes.filter(row=>row.beforeSha256===null).length,
 receipts:[...prep.receipts,{file:receiptPath,sha256:sha(read(receiptPath)),label:receipt.label,footer:receipt.footer,logSha256:receipt.logSha256}],
 scope:'Thirty-eight test-only proposal paths:22existing/16new, projected5123inputs from unchanged5107. Fifty-five outer native registrations across11 distinct successful runs,4 historical coverage children separately. New model-inspection router mock matches real interface and asserts no navigation; three whole-file inverses preserve all original assertions. Orbital sensory source split and pancreatic LF/CRLF transition are reviewed but their actual teaching modules remain UNRUN. No application/UI/runtime/geometry/access edits. Batches C/E still independent, unadmitted and incomplete.',
 requiredVerification:prep.requiredVerification.map(row=>row.label==='CLINICAL_CURRENT_EPOCH_BATCH'?{...row,reason:row.reason+' Also execute orbital sensory MRI and pancreatic vessel actual modules; their whole-source guards are not teaching proof.'}:row),admissionReady:false};
assert.equal(next.proposedSourceInputs,5123);assert(!fs.existsSync(stage));fs.mkdirSync(stage);
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(next,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,paths:changes.length,projectedInputs:next.proposedSourceInputs,boundedNativeRegistrations:55,admissionReady:false,canonicalInstalled:false}));

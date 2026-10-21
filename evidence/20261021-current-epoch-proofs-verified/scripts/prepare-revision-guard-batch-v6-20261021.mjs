import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v5';
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v6';
const prep=json(previous+'/PREPARATION.json');
const frozen=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
const frozenByPath=new Map(frozen.map(row=>[row.path,row.sha256]));
const added=[
 ...['clinical-review-desktop-layout.test.mjs','clinical-review-elbow-arterial-tour.test.ts','clinical-review-elbow-us-followup.test.ts','clinical-review-forearm-vascular-xray.test.ts'].map(name=>['F:/VisibleMedicine/staging/20261021-clinical-viewer-epoch-proposal','tests/'+name]),
 ...['tests/clinical-review-girdle-muscle-xray.test.ts','tests/clinical-review-git-root-preservation.test.mjs','tests/clinical-review-girdle-history-preservation.test.mjs','tests/fixtures/clinical-review-girdle-muscle-xray-original.ts.raw'].map(p=>['F:/VisibleMedicine/staging/20261021-clinical-girdle-history-epoch-proposal',p]),
];
const changes=[...prep.changes,...added.map(([root,path])=>{const from=root+'/'+path,bytes=read(from);return{path,from,beforeSha256:frozenByPath.get(path)??null,sha256:sha(bytes),bytes:bytes.length};})];
assert.equal(new Set(changes.map(row=>row.path)).size,changes.length);
for(const row of changes){
 assert(row.path.startsWith('tests/')&&!row.path.includes('..'));
 assert.equal(sha(read(row.from)),row.sha256,row.path);
 assert.equal(frozenByPath.get(row.path)??null,row.beforeSha256,row.path);
 assert.equal(row.beforeSha256?sha(read(prep.site+'/'+row.path)):fs.existsSync(prep.site+'/'+row.path),row.beforeSha256??false,row.path);
}
const receipts=[...prep.receipts];
for(const file of ['F:/VisibleMedicine/staging/20261021-clinical-girdle-history-native-proof/GIRDLE_GIT_WHOLE_SOURCE.json','F:/VisibleMedicine/staging/20261021-clinical-desktop-epoch-native-proof/DESKTOP_EPOCH_NATIVE.json']){
 const value=json(file);assert.equal(value.code,0);assert.equal(sha(read(value.log)),value.logSha256);assert(value.footer.includes('ℹ fail 0')&&value.footer.includes('ℹ skipped 0'));
 receipts.push({file,sha256:sha(read(file)),label:value.label,footer:value.footer,logSha256:value.logSha256});
}
const next={...prep,at:new Date().toISOString(),stage,supersedes:previous,changes,receipts,previousSourceInputs:frozen.length,proposedSourceInputs:frozen.length+changes.filter(row=>row.beforeSha256===null).length,
 scope:'Thirty-one test-only proposal paths:19existing/12new, projected5119inputs from unchanged5107. Fifty outer native registrations across10 distinct successful runs, with4 historical coverage children separately; no flat full-suite claim. Twelve newest checks cover seven desktop layout/current metadata and five whole-source historical inverses. Three TS viewer/current cases and the full girdle theorem remain UNRUN; desktop pass does not certify them. No application/UI/model/runtime/access change or source installation. Later batches C/D/E remain separate/unadmitted.',
 admissionReady:false,requiredVerification:[...prep.requiredVerification,{label:'CLINICAL_CURRENT_EPOCH_BATCH',status:'pending',receipt:null,reason:'Actual elbow arterial tour, elbow ultrasound, forearm vascular X-ray and current girdle TypeScript modules have not run after these proposals. Run once after full native suite releases; preserve all historical/current/refusal proofs.'}],
 candidateEdited:false,canonicalInstalled:false};
assert.equal(changes.length,31);assert.equal(next.proposedSourceInputs,5119);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(next,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,paths:changes.length,newPaths:12,projectedInputs:next.proposedSourceInputs,nativeBoundedRegistrations:50,admissionReady:false,sourceFrozen:true}));

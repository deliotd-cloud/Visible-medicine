import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const tenth=process.argv[2]==='v10';assert(process.argv.length===2||tenth);
const previous='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v'+(tenth?'9':'8'),prior=json(previous+'/PREPARATION.json');
const stage='F:/VisibleMedicine/staging/20261021-revision-guard-batch-v'+(tenth?'10':'9');
assert(!fs.existsSync(stage));
const rows=new Map(prior.changes.map(row=>[row.path,row])),receipts=[...prior.receipts];
const additions=tenth?[
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-c-v6-native-proof','BATCH_C_V6_WHOLE_SOURCE',1],
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v7-native-proof','BATCH_E_V7_WHOLE_SOURCE',10],
]:[
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-c-v5-native-proof','BATCH_C_V5_WHOLE_SOURCE',1],
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v6-native-proof','BATCH_E_V6_WHOLE_SOURCE',10],
 ['F:/VisibleMedicine/staging/20261021-head-neck-pilot-history-native-proof','HEAD_NECK_WHOLE_SOURCE',4],
 ['F:/VisibleMedicine/staging/20261021-specimen-playback-history-native-proof','SPECIMEN_WHOLE_SOURCE',1],
];
for(const [root,label,count]of additions){
 const prep=json(root+'/PREPARATION.json'),file=root+'/'+label+'.json',proof=json(file);
 assert.equal(prep.sourceSite,prior.site);assert.equal(proof.code,0);assert.equal(sha(read(proof.log)),proof.logSha256);
 for(const entry of ['tests '+count,'pass '+count,'fail 0','cancelled 0','skipped 0','todo 0'])assert(proof.footer.includes('ℹ '+entry));
 for(const row of prep.proposed){assert.equal(sha(read(row.from)),row.sha256);rows.set(row.path,row);}
 receipts.push({file,sha256:sha(read(file)),label,footer:proof.footer,logSha256:proof.logSha256});
}
if(!tenth){
const head='F:/VisibleMedicine/staging/20261021-head-specimen-actual-native/HEAD_PILOT_ACTUAL.json';
const headProof=json(head);assert.equal(headProof.code,0);assert.equal(sha(read(headProof.log)),headProof.logSha256);
assert.deepEqual(headProof.args,['--test','--experimental-strip-types','--test-concurrency=1','tests/head-neck-pilot.test.ts']);
assert(headProof.footer.includes('ℹ pass 4'));assert(headProof.footer.includes('ℹ fail 0'));
receipts.push({file:head,sha256:sha(read(head)),label:'HEAD_PILOT_ACTUAL',footer:headProof.footer,logSha256:headProof.logSha256});
}
const changes=[...rows.values()];assert.equal(changes.length,85);
for(const row of changes)assert.equal(row.beforeSha256?sha(read(prior.site+'/'+row.path)):fs.existsSync(prior.site+'/'+row.path),row.beforeSha256??false,row.path);
const next={...prior,stage,at:new Date().toISOString(),supersedes:previous,changes,receipts,
 proposedSourceInputs:prior.previousSourceInputs+changes.filter(row=>row.beforeSha256===null).length,
 actualCurrentModules:tenth?prior.actualCurrentModules:[...prior.actualCurrentModules,'tests/head-neck-pilot.test.ts','tests/clinical-review-specimen-continuous-playback.test.ts'],
 scope:tenth?'85test-only proposed paths,38existing/47new,5154projected named inputs. C6 uses genuine quiz introduction51de and independently bound628 introduction; E7 exact22-ID source probe distinguishes4tour-backed hash changes from18unchanged contexts. First33/28/5 and followup10/6/4 failures retained. Ring/head/specimen actual proofs pass separately. Four affected modules are pending genuine terminal. No source install, full-suite/clinical/spatial acceptance.':'85test-only proposal paths,38existing/47new,5154projected named inputs. C5/E6 replace current/history role mismatches and a verified SHA typo, retaining whole original inverses and first matrix33/28pass/5fail. Historical head/specimen original sources and six actual successful cases retained separately; first missing harness Git context remains explicit. Native focused followup5modules must genuinely finish; no full-suite/clinical/spatial approval or source installation.',
 admissionReady:false,candidateEdited:false,canonicalInstalled:false};
assert.equal(next.proposedSourceInputs,5154);assert.equal(next.actualCurrentModules.length,22);
fs.mkdirSync(stage);fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(next,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,paths:changes.length,existing:38,added:47,projectedNamedInputs:5154,boundedRegistrations:tenth?97:86,admissionReady:false}));

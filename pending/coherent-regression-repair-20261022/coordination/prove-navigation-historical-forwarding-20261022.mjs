// Exercise only the exact authored forwarding closure, with a recording stub.
// No validator, transpiler, website test or clinical payload is executed.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-navigation-historical-forwarding-proof';assert(!existsSync(root));
const queuePath='F:/VisibleMedicine/staging/20261022-regional-imaging-history-consolidated/QUEUE.json';assert.equal(sha(read(queuePath)),'69bf8a07fe2b7bee6357169d4ae03127c59958290784ec0de2588eb4795f602b');
const queue=json(queuePath),row=queue.repairs.find(item=>item.path==='tests/historical-navigation-43-epoch.mjs');assert(row);
const code=read(row.proposal);assert.equal(sha(code),row.proposalSha256);
const text=code.toString(),start='export function historicalNavigation43ValidateCurrentAtlasDelivery(options={}){',end='\n}\n\n/** Execute the exact original register43';
assert.equal(text.split(start).length,2);const at=text.indexOf(start),to=text.indexOf(end,at);assert(to>at);
const closure=text.slice(at,to+2).replace('export function','function');
const site=queue.website;
const archive=json(site+'/tests/fixtures/head-masks-before-salpingopharyngeus/manifest.json');
const raw=archive.records.find(item=>item.path==='tests/historical-head-mask-epoch.mjs');assert(raw);assert.equal(raw.sha256,'f5bca725b59483dcce95d71071b8be01653442eaa079b53f5a5b1eca98b8e22d');assert.equal(sha(read(site+'/'+raw.frozenPath)),raw.sha256);
const older=read(site+'/'+raw.frozenPath).toString();assert(older.includes('validateCurrentAtlasDelivery({...options,pin:options.pin??pin,read:readPath})'));
let calls=0;
const record=options=>{calls++;return options;};
const pin43={schema:'vm-current-atlas-test-delivery-1',source:'source43-synthetic-forwarding-only'};
const read43=path=>{assert.equal(path,'tests/fixtures/current-atlas-delivery.json');return Buffer.from(JSON.stringify(pin43));};
const forward=new Function('validateHistoricalAtlasDelivery','readPath',closure+';return historicalNavigation43ValidateCurrentAtlasDelivery;')(record,read43);
const ordinary=forward();assert.deepEqual(ordinary.pin,pin43);assert.equal(ordinary.read,read43);
for(const epoch of ['41','42']){
 const pin={schema:'vm-current-atlas-test-delivery-1',source:'synthetic-'+epoch},readAtEpoch=()=>Buffer.from(epoch);
 const result=forward({pin,read:readAtEpoch,proofFlag:epoch});
 assert.equal(result.pin,pin);assert.equal(result.read,readAtEpoch);assert.equal(result.proofFlag,epoch);
}
const customRead=()=>Buffer.alloc(0),partial=forward({read:customRead});assert.deepEqual(partial.pin,pin43);assert.equal(partial.read,customRead);assert.equal(calls,4);
const result={at:new Date().toISOString(),status:'PASS_PURE_FORWARDING_CLOSURE_ONLY',exactAuthoredCodeSha256:row.proposalSha256,syntheticRecordingStubOnly:true,cases:4,nestedArchivedHelperSha256:raw.sha256,archivedHelperUnchanged:true,schema1ValidatorExecuted:false,nativeTestsRun:false,realPinAccepted:false,ownerPreviewChanged:false};
mkdirSync(root);writeFileSync(root+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...result,receipt:root+'/RESULT.json',sha256:sha(read(root+'/RESULT.json'))}));

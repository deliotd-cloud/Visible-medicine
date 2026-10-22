import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {fullSourceInverse} from './review-source-packet-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261022-current-ui-final-closures',prepared=json(stage+'/PREPARED.json');
const website=prepared.website,base=pathToFileURL(website+'/').href;
const previousCwd=process.cwd();
process.chdir(website);
try {
assert.equal(prepared.sourceReceiptSha256,'d72789221c1cbdb0686e65a6316fe42c378f4cddc6e4adfd2b556ad7b79f2f8e');
assert.equal(sha(read(prepared.sourceReceipt)),prepared.sourceReceiptSha256);
const evidence=[];
for(const row of prepared.files){
 const raw=read(stage+'/RAW/'+row.path),code=read(stage+'/CODE/'+row.path);
 assert.equal(sha(raw),row.rawSha256);assert.deepEqual(raw,read(website+'/'+row.path));
 evidence.push({path:row.path,before:stage+'/RAW/'+row.path,beforeSha256:sha(raw),code:stage+'/CODE/'+row.path,sha256:sha(code),mechanicalWholeByteInverse:fullSourceInverse(raw,code)});
}
const helper='tests/plexus-presentation-18-history.mjs';
let text=read(stage+'/CODE/'+helper).toString();
for(const statement of ["import assert from 'node:assert/strict';","import {readFileSync} from 'node:fs';","import {plexusHash} from '../scripts/plexus-review-fingerprints.mjs';"]){assert.equal(text.split(statement).length,2);text=text.replace(statement,'');}
text=text.replaceAll('export function ','function ');
assert.equal(text.split("new URL('../'+relative,import.meta.url)").length,2);
text=text.replace("new URL('../'+relative,import.meta.url)","new URL(relative,siteUrl)");
const fp=await import(base+'scripts/plexus-review-fingerprints.mjs');
const history=new Function('assert','readFileSync','plexusHash','siteUrl',text+'\nreturn {readPlexusPresentation18,readPlexusBeforeHistory};')(assert,fs.readFileSync,fp.plexusHash,base);
for(const relative of ['../.env','.env','undeclared.ts'])assert.throws(()=>history.readPlexusPresentation18(relative));
const code=read(stage+'/CODE/tests/plexus-dependency-rebind.test.mjs').toString();
const first=code.indexOf("test('later 16-to-18 presentation dependency extension"),next=code.indexOf("\ntest('exact navigation and history transitions",first);
assert(first>0&&next>first);
const historical=await import(base+'tests/plexus-historical-source.mjs');
let oldCalls=0;
new Function('test','assert','readPostLockCheckpoint','plexusHash','readPlexusPresentation18',code.slice(first,next))((title,callback)=>{oldCalls++;callback();},assert,historical.readPostLockCheckpoint,fp.plexusHash,history.readPlexusPresentation18);
assert.equal(oldCalls,1,'Complete original16-to18 callback actually executes');
const {rebindPlexusNavigation}=await import(base+'scripts/rebind-plexus-review-navigation.mjs');
const {rebindPlexusHistory}=await import(base+'scripts/rebind-plexus-review-history.mjs');
const current=json(website+'/lib/plexus-review-manifest.json'),actual=read(website+'/.local/plexus-review/assets.ts').toString();
let newCalls=0;
new Function('test','assert','readPlexusPresentation18','readPlexusBeforeHistory','readFileSync','rebindPlexusNavigation','rebindPlexusHistory','current','actual',code.slice(next))(
 (title,callback)=>{newCalls++;callback();},assert,history.readPlexusPresentation18,history.readPlexusBeforeHistory,path=>read(website+'/'+path),rebindPlexusNavigation,rebindPlexusHistory,current,actual);
assert.equal(newCalls,1,'Exact two real presentation generators reproduce the complete current private packet');
const raw=read(stage+'/RAW/tests/plexus-dependency-rebind.test.mjs').toString();
let restored=code.slice(0,next);
for(const statement of [
 "import {readPlexusPresentation18,readPlexusBeforeHistory} from './plexus-presentation-18-history.mjs';\n",
 "import {rebindPlexusNavigation} from '../scripts/rebind-plexus-review-navigation.mjs';\n",
 "import {rebindPlexusHistory} from '../scripts/rebind-plexus-review-history.mjs';\n",
 " // Execute the complete original extension against its authenticated18-input\n // presentation, not a later navigation/history revision of the private packet.\n const readFileSync=readPlexusPresentation18;\n const current=JSON.parse(readFileSync('lib/plexus-review-manifest.json'));\n",
]){assert.equal(restored.split(statement).length,2);restored=restored.replace(statement,'');}
assert.equal(restored,raw,'Complete original Plexus test source restored, including every refusal');
evidence.push({path:helper,code:stage+'/CODE/'+helper,sha256:sha(read(stage+'/CODE/'+helper)),beforeSha256:null});
const result={at:new Date().toISOString(),sourceReceipt:prepared.sourceReceipt,sourceReceiptSha256:prepared.sourceReceiptSha256,
 rows:evidence,mechanicalInverseAloneIsNotAssertionAcceptance:true,originalPlexusCallbackExecuted:true,twoCurrentGeneratorsReplayedExactly:true,
 privatePacketAndAssetsWritten:false,unknownHistoricalReadsRefused:3,currentValidatorOrPinChanged:false,nativeAccepted:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/MAIN_SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceProof:stage+'/MAIN_SOURCE_PROOF.json',sha256:sha(read(stage+'/MAIN_SOURCE_PROOF.json')),paths:evidence.length,actualPlexusCallbacks:2,privateDataWritten:false}));
} finally { process.chdir(previousCwd); }

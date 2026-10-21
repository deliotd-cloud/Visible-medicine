// Repair only manual test resolution; load the real confirmation/autosave modules.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-';
const previous=base+'spinal-save-application',proposal=base+'head-review-grouped-harness';
const stage=base+'review-harness-and-elbow-application';
const prior=json(previous+'/RESULT.json');assert.equal(prior.code,0);assert.equal(prior.inputDrift,false);
const hip=json(base+'atlas-source-assembly/ACTUAL_COMBINED_HIP.json');assert.equal(hip.code,0);assert.equal(hip.signal,null);assert.equal(sha(read(hip.log)),hip.logSha256);
const player=json(base+'atlas-source-assembly/ACTUAL_COMBINED_TOUR_PLAYER.json');assert.equal(player.code,0);assert.equal(player.signal,null);assert.equal(sha(read(player.log)),player.logSha256);
const source=json(base+'after-suite-dental/state.json');assert.equal(source.currentSourcePaths.length,21);
for(const row of source.currentSourcePaths)assert.equal(sha(read(source.target+'/'+row.path)),row.sha256,'combined source unchanged: '+row.path);
const prep=json(previous+'/PREPARATION.json'),inputs=json(previous+'/source-inputs-after.json');assert.equal(inputs.length,5083);
for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' stable input');
const declarations=[
 ['head-cerebellar-review.test.ts','07359e77a1cdb9126d00a7264293a4e763ad3eb1a128dd0d6d43bae80bfdf1bc','e296846aea3e46e42c373d01ae3934c06adae223e7789f413b0b494ca8ffbdc8'],
 ['head-ct-facial-ui.test.mjs','6e8e413f7383f990e7d0b8d565ba815764d44a8cf3bb8c480605d21e0e322a64','b5ea302b03648b4af1f9e750c10ecf43fff0182c8dabe2ef241f6fda1fd47e57'],
 ['head-deep-grey-review.test.ts','a49b6655c34c65a92ce4eb01573995595e3b8251c4d0fea0dea3f6b3ff198921','bcf97aa6433919540e40960b65f4f7e069fb2cbb5a0573195c092e55d78e8915'],
 ['head-hippocampal-clinical.test.ts','3fe895d4de7edc027b1aab84acf7a5f25ccf9626c15bf874a3c4313127d67d5b','3866730ce1998d887379736e2ff5a922b89bbcbf59b770300e6dac7958d39f15'],
 ['head-lobar-review.test.ts','cd083c79e1bae558de0131cef6c6f215ca8888ecbf5ceaecf22afd6f1efdd521','478aa7bd74b9dabafc358b160002fe6fecf134954cd83243520977553f4fceb3'],
 ['head-mri-independent-review-ui.test.ts','1a68c885c6d1c03503b707631941bb137433dbfd402c1a89478ca31e7e9ef23d','ba1cb6a494877390ebea5420827ef6b2f01f97ed4ab1a7492a2c29c198df640c'],
 ['head-ventricular-review.test.ts','06b4d4f89c051860801dae5ffc2ad0abc2c63f52112dd28a602c9454bf86319d','a9ae1ea7a1770cf5c8a1a4fb3393f5bd3a1cb5d76412b59fab995eb218e54bec'],
];
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,'exact declared seam');return text.replace(from,to);};
const rows=declarations.map(([name,old,next])=>({path:'tests/'+name,beforeSha256:old,sha256:next}));
for(const row of rows){
 const original=read(prep.site+'/'+row.path),candidate=read(proposal+'/'+row.path);
 assert.equal(sha(original),row.beforeSha256);assert.equal(sha(candidate),row.sha256);
 assert.deepEqual(original,read(proposal+'/tests/fixtures/'+path.basename(row.path)+'.raw'));
 let text=once(candidate.toString(),"import {groupedReviewConfirmation} from './grouped-review-confirmation-harness.mjs';\n",'');
 const resolver=row.path==='tests/head-ct-facial-ui.test.mjs'
  ? "    if(id==='./GroupedReviewConfirmation')return groupedReviewConfirmation;\n"
  : "id==='./GroupedReviewConfirmation'?groupedReviewConfirmation:";
 text=once(text,resolver,'');
 const autosave="id==='../lib/review-draft-autosave'?require('../lib/review-draft-autosave.ts'):";
 if(text.includes(autosave))text=once(text,autosave,'');
 assert.deepEqual(Buffer.from(text),original,row.path+' complete original assertions restored');
}
const helper={path:'tests/grouped-review-confirmation-harness.mjs',beforeSha256:null,sha256:'93abee8a727e996385ca67fad498520aac94a2c58f650f4a9240dc83413b595c'};
assert(!fs.existsSync(prep.site+'/'+helper.path));assert.equal(sha(read(proposal+'/'+helper.path)),helper.sha256);rows.push(helper);
const elbowProposal=base+'elbow-later-xray-repair';
const elbowRows=[
 {path:'tests/clinical-review-elbow-us-followup.test.ts',beforeSha256:'9b0b950ead7cc57f0dfe069d1a359a65b96e15a51aa004dca536f52e0ed3b443',sha256:'cdd84bd2693941783da9f058cc4860ac7a32361913e687dab1699f66fa9a0f1f',origin:elbowProposal},
 {path:'tests/elbow-us-followup-preservation.test.mjs',beforeSha256:'00c2bbcf29ab8ad3dfa3f1032643e302a17bb4bf70e9fe59a12b7ed3dcd1b166',sha256:'7ca1c0796278bd08cc9c7d60493c2ff79202772f5dd38608666c8a0cf537c009',origin:elbowProposal},
];
for(const row of elbowRows){assert.equal(sha(read(prep.site+'/'+row.path)),row.beforeSha256);assert.equal(sha(read(row.origin+'/'+row.path)),row.sha256);rows.push(row);}
for(const [p,digest] of [['tests/elbow-admission-import-history.mjs','f994bb22c3e12330d82fe9c25d33e1a48a2bee8dd9ebf47a3b5d222ca004232d'],['tests/fixtures/clinical-review-elbow-us-followup.original.ts.raw','aad244f03fc81cec834dbed52eed7681f8a680f6d6d52cc82a9c17cde84fab0c']]){
 assert.equal(sha(read(prep.site+'/'+p)),digest);assert.deepEqual(read(elbowProposal+'/'+p),read(prep.site+'/'+p));
}
assert.equal(sha(read(prep.site+'/components/GroupedReviewConfirmation.tsx')),'b5c844502c8f44591a776d7abc1468b174af6529108576e13c944f36bebd51f4');
assert.equal(sha(read(prep.site+'/lib/review-draft-autosave.ts')),'9192c9af4dc0ad1c6bbe31eb762846dcf1d2af81753e9f6244fd4ea81c8249db');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const save=(relative,bytes)=>{const target=stage+'/'+relative;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});};
for(const row of rows)if(row.beforeSha256)save('originals/'+row.path,read(prep.site+'/'+row.path));
const attributes=read(prep.site+'/.gitattributes');save('originals/.gitattributes',attributes);
const rules=rows.map(row=>row.path+' text eol=lf').filter(rule=>!attributes.toString().split(/\r?\n/).includes(rule));
const newAttributes=Buffer.concat([attributes,Buffer.from((attributes.at(-1)===10?'':'\n')+rules.join('\n')+'\n')]);
for(const row of rows){fs.copyFileSync((row.origin??proposal)+'/'+row.path,prep.site+'/'+row.path);assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256);}
fs.writeFileSync(prep.site+'/.gitattributes',newAttributes);rows.push({path:'.gitattributes',beforeSha256:sha(attributes),sha256:sha(newAttributes)});
const all=new Map(inputs.map(row=>[row.path,row]));for(const row of rows)all.set(row.path,{path:row.path,bytes:read(prep.site+'/'+row.path).length,sha256:row.sha256});
const after=[...all.values()].sort((a,b)=>a.path.localeCompare(b.path));assert.equal(after.length,5084);
const verify=()=>{for(const row of after)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' current head test input');};verify();
save('source-inputs-after.json',Buffer.from(JSON.stringify(after,null,2)+'\n'));
save('PREPARATION.json',Buffer.from(JSON.stringify({...prep,stage,scope:'Seven actual head-review modules plus elbow whole-era/current X-ray lifecycle and inverse. Eight genuine grouped resolution errors; no production/clinical/auth changes.5084inputs guarded.'},null,2)+'\n'));
save('INVERSE.json',Buffer.from(JSON.stringify({at:new Date().toISOString(),wholeHeadOriginals:7,declaredResolverSeamsOnly:true,helper:helper.sha256,excludedMarker:2900,elbowInverseModule:'tests/elbow-us-followup-preservation.test.mjs',rawOriginalsLocation:'application originals/; not unused shipping fixtures'},null,2)+'\n'));
const args=['--test','--experimental-strip-types','--test-concurrency=1',...declarations.map(([name])=>'tests/'+name),...elbowRows.map(row=>row.path)];
const coordinator=path.dirname(fileURLToPath(import.meta.url));
const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,'ACTUAL_REVIEW_REPAIRS',process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
save('STARTED.json',Buffer.from(JSON.stringify({at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,args,files:rows,sourceInputs:5084,canonicalInstalled:false},null,2)+'\n'));
const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
const receipt=json(stage+'/ACTUAL_REVIEW_REPAIRS.json');assert.equal(receipt.code,done.code);assert.equal(receipt.signal,done.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
let inputDrift=false,error=null;try{verify();}catch(cause){inputDrift=true;error=String(cause);}
const result={at:new Date().toISOString(),...done,inputDrift,error,footer:receipt.footer,receiptSha256:sha(read(stage+'/ACTUAL_REVIEW_REPAIRS.json')),
 actualNineReviewModulesPass:done.code===0&&done.signal===null&&!inputDrift,wholeWebsiteSuitePass:false,canonicalInstalled:false,clinicalApproval:false};
save('RESULT.json',Buffer.from(JSON.stringify(result,null,2)+'\n'));console.log(JSON.stringify(result));process.exitCode=inputDrift?1:done.code??1;

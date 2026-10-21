import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',previous=base+'plexus-history-application',stage=base+'plexus-historical-eol-retry',helper='tests/plexus-historical-source.mjs';
const beforeSha='39ac1003c637bfcde874755e32736a8c35b09f722eb8aefba2cb61a27a218c49';
const save=(p,b)=>{const target=stage+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});};
if(process.argv[2]==='--prepare'){
 const r=json(previous+'/RESULT.json');assert.equal(r.code,1);assert.equal(r.inputDrift,false);assert(r.footer.some(line=>line.endsWith('fail 2')));
 const prep=json(previous+'/PREPARATION.json'),inputs=json(previous+'/source-inputs-after.json');assert.equal(inputs.length,5087);
 for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
 assert.equal(sha(read(prep.site+'/'+helper)),beforeSha);assert(!fs.existsSync(stage));fs.mkdirSync(stage);
 save('PREPARATION.json',Buffer.from(JSON.stringify({...prep,stage,scope:'One exact historical auth-source LF-to-CRLF representation; source bytes/pins/auth code unchanged. Actual7plexus provenance cases,5087inputs guarded.'},null,2)+'\n'));
 save('source-inputs-before.json',read(previous+'/source-inputs-after.json'));save('originals/'+helper,read(prep.site+'/'+helper));
 console.log(JSON.stringify({prepared:true,stage,helperBeforeSha256:beforeSha}));
}else{
 assert.equal(process.argv[2],'--run');const prep=json(stage+'/PREPARATION.json'),before=json(stage+'/source-inputs-before.json');
 const old=read(stage+'/originals/'+helper);assert.equal(sha(old),beforeSha);
 const seam=" assert.equal(plexusHash(bytes),historical.get(relative),`Historical source blob mismatch: ${relative}`);\n return bytes;";
 const replacement="  if(relative==='app/chatgpt-auth.ts'){\n    assert.equal(plexusHash(bytes),'4e88890c4371746be327cc0afbd6c2431bf14dd000fcedd2b804c30a6b879c57','Exact pinned Git LF auth source');\n    const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes);assert(!text.includes('\\r'));\n    const historicalBytes=Buffer.from(text.replaceAll('\\n','\\r\\n'));\n    assert.equal(plexusHash(historicalBytes),historical.get(relative),'Exact recorded historical CRLF auth bytes');\n    return historicalBytes;\n  }\n"+seam;
 assert.equal(old.toString().split(seam).length,2);const expected=Buffer.from(old.toString().replace(seam,replacement));
 assert.deepEqual(read(prep.site+'/'+helper),expected,'Only declared exact historical EOL reconstruction');
 const after=before.map(row=>row.path===helper?{path:helper,bytes:expected.length,sha256:sha(expected)}:row);
 const verify=()=>{for(const row of after)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path+' current source');};verify();
 save('source-inputs-after.json',Buffer.from(JSON.stringify(after,null,2)+'\n'));save('CHANGE.json',Buffer.from(JSON.stringify({path:helper,beforeSha256:beforeSha,sha256:sha(expected),exactHistoricalRows:23,unchangedGitByteRows:22,authCrLfRow:1,noPrivateArtifactCopied:true},null,2)+'\n'));
 const coordinator=path.dirname(fileURLToPath(import.meta.url)),args=['--test','--test-concurrency=1','tests/plexus-dependency-rebind.test.mjs','tests/plexus-presentation-rebind.test.mjs'];
 const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,'ACTUAL_PLEXUS_EOL',process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
 const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
 const receipt=json(stage+'/ACTUAL_PLEXUS_EOL.json');assert.equal(receipt.code,done.code);assert.equal(receipt.signal,done.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
 let inputDrift=false,error=null;try{verify();}catch(cause){inputDrift=true;error=String(cause);}
 const result={at:new Date().toISOString(),...done,inputDrift,error,footer:receipt.footer,receiptSha256:sha(read(stage+'/ACTUAL_PLEXUS_EOL.json')),actualPlexusHistoryPass:done.code===0&&done.signal===null&&!inputDrift,canonicalInstalled:false,fullWebsiteSuitePass:false,rightsApproval:false,clinicalApproval:false};
 save('RESULT.json',Buffer.from(JSON.stringify(result,null,2)+'\n'));console.log(JSON.stringify(result));process.exitCode=inputDrift?1:done.code??1;
}

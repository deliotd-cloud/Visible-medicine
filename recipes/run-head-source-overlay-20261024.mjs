import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>fs.readFileSync(file),json=file=>JSON.parse(read(file));
const website='F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const proposal='F:/VisibleMedicine/staging/20261024-head-comparison-harness-proposal';
const sourceReceipt=website+'/../SOURCE_BOUND.json',receipt=read(sourceReceipt);
assert.equal(sha(receipt),'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
const rows=new Map(JSON.parse(receipt).sourceRows.map(row=>[row.path,row]));
const folder=proposal+'/checks/runtime-overlay-v4-attempt-1';assert.ok(!fs.existsSync(folder),'one focused attempt after exact copy-epoch assertion correction, no automatic retries');
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',"$vmMemory=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory; [PSCustomObject]@{at=[DateTime]::UtcNow.ToString('o');availableMiB=$vmMemory.AvailableMBytes;committedPercent=$vmMemory.PercentCommittedBytesInUse} | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
const admitted=Number.isFinite(memory.availableMiB)&&memory.availableMiB>=1024&&Number.isFinite(memory.committedPercent)&&memory.committedPercent<=90;
const admissionPath=proposal+'/checks/admissions/'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';fs.mkdirSync(path.dirname(admissionPath),{recursive:true});fs.writeFileSync(admissionPath,JSON.stringify({admitted,memory,minimumMiB:1024},null,2)+'\n',{flag:'wx'});
if(!admitted){console.log(JSON.stringify({admitted:false,memory,admissionPath}));process.exitCode=2;}else{
 fs.mkdirSync(folder,{recursive:true});
 const save=(name,value)=>fs.writeFileSync(folder+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 save('ADMISSION.json',{minimumMiB:1024,memory});
 const names=['head-gap-concept-teaching.test.ts','head-guided-3d-fallback.test.ts','head-separate-comparison-test-source.ts','head-separate-comparison-test-source.test.ts'];
 const overrides=names.map(name=>{const relative='tests/'+name,file=proposal+'/candidate/'+relative,bytes=read(file);return {relative,proposal:file,sha256:sha(bytes),originalSha256:rows.get(relative)?.sha256??null};});
 // SOURCE_ROWS records original sources; HANDOFF records candidate bytes.
 // Pin the reviewed candidate identities independently, never substitute roles.
 const expectedCandidate=new Map([
  ['tests/head-gap-concept-teaching.test.ts','9ab90e22ade18a728d9a049566f5cecce2feeccb07b3cef254a957be6569c8c9'],
  ['tests/head-guided-3d-fallback.test.ts','e4cd6c0644e20544b4b92ce41d043b5c04d37182a0de30005e27db655133eafb'],
  ['tests/head-separate-comparison-test-source.ts','395b5006f811e5db7f7dff713985d2e67ded3dde8845ae40298af67affe826bb'],
  ['tests/head-separate-comparison-test-source.test.ts','17c0c682fde84804918b2f9c9eec8b5ac441ac9e26a235858bb6c47ec02dbc92'],
 ]);
 for(const row of overrides)assert.equal(row.sha256,expectedCandidate.get(row.relative),'reviewed proposal: '+row.relative);
 const guided='F:/VisibleMedicine/staging/20261024-head-guided-harness-proposal';
 const guidedBytes=read(guided+'/candidate/tests/head-guided-steps.test.ts');assert.equal(sha(guidedBytes),'c39a6845ded3b9ebcc12609c9ea2d75891178a54003224b5056272757c19073e');
 const originalGuided=read(website+'/tests/head-guided-steps.test.ts');assert.equal(sha(originalGuided),'82ed8fd5f9f162c72f339b099d6d6ea15c67816cb44de11a9f68d8cc709f6321');
 const extraLine="import {separateComparisonAwareRequire} from './head-separate-comparison-test-source.ts';";
 let inverse=guidedBytes.toString();const endings=[extraLine+'\n',extraLine+'\r\n'].filter(value=>inverse.includes(value));assert.equal(endings.length,1);inverse=inverse.replace(endings[0],'');
 const wrapped='const require=separateComparisonAwareRequire(createRequire(import.meta.url)),pin=links.HEAD_LINK_REVISION;';assert.equal(inverse.split(wrapped).length,2);inverse=inverse.replace(wrapped,'const require=createRequire(import.meta.url),pin=links.HEAD_LINK_REVISION;');assert.deepEqual(Buffer.from(inverse),originalGuided);assert.equal((guidedBytes.toString().match(/^test\(/mg)||[]).length,26);
 overrides.push({relative:'tests/head-guided-steps.test.ts',proposal:guided+'/candidate/tests/head-guided-steps.test.ts',sha256:sha(guidedBytes),originalSha256:sha(originalGuided)});
 const copyProposal='F:/VisibleMedicine/staging/20261024-guided-current-copy-proposal/candidate/tests/head-guided-steps.test.ts';
 assert.equal(sha(read(copyProposal)),'17af4dd8120925156c8fac0bdea086d19e7a28f2108fc5fd7cd31039874838ff');
 const guidedOverride=overrides.find(row=>row.relative==='tests/head-guided-steps.test.ts');guidedOverride.proposal=copyProposal;guidedOverride.sha256=sha(read(copyProposal));
 const membership='F:/VisibleMedicine/staging/20261024-studio-terminal-failure-audit';
 for(const [name,expected]of Object.entries({'studio-membership-pages.test.mjs':'687a9a848f51422e68e9a01036cf7314ea9c7fa345bd49fb38cf0d67526d8abc','studio-membership-source.mjs':'90ef0f9eb28850ebede5cb9e395eadaa6bf3c0b6d9f8694b83edc33ed7e02a1d'})){
  const relative='tests/'+name,file=membership+'/candidate/'+relative;assert.equal(sha(read(file)),expected);overrides.push({relative,proposal:file,sha256:expected,originalSha256:rows.get(relative)?.sha256??null});
 }
 const membershipRows=new Set(['app/studio/cohorts/page.tsx','app/studio/publishing/page.tsx','lib/studio-review-queue.ts']);
 const namedRows=[...rows.values()].filter(row=>membershipRows.has(row.path)||/^(lib\/(head-|lecture-)|components\/(Head|useVerifiedFacialTeaching))/.test(row.path)&&/\.(ts|tsx|mjs|json)$/.test(row.path));
 const fingerprint=()=>namedRows.map(row=>{const bytes=read(website+'/'+row.path);assert.equal(sha(bytes),row.sha256,row.path);assert.equal(bytes.length,row.bytes);return row;});
 const before=fingerprint();
 const config={website,sourceReceipt,sourceReceiptSha256:sha(receipt),overrides,evidenceDirectory:folder};save('CONFIG.json',config);save('NAMED_INPUTS.json',before);
 const loader=path.resolve('source-test-overlay-20261024.mjs');save('LOADER.json',{path:loader,sha256:sha(read(loader)),runtime:process.version});
 // Rerun only the changed 26-case module, not the 17 unchanged passing cases.
 const tests=[website+'/tests/head-guided-steps.test.ts'];
 const out=fs.openSync(folder+'/child.tap','wx'),err=fs.openSync(folder+'/stderr.log','wx');let result;const started=new Date().toISOString();
 try{result=spawnSync(process.execPath,['--max-old-space-size=128','--import',pathToFileURL(loader).href,'--test','--test-concurrency=1','--test-reporter=tap',...tests],{cwd:website,env:{...process.env,VM_TEST_SOURCE_OVERLAY:folder+'/CONFIG.json'},windowsHide:true,stdio:['ignore',out,err],timeout:60000});}finally{fs.closeSync(out);fs.closeSync(err);}
 assert.deepEqual(fingerprint(),before);for(const row of overrides)assert.equal(sha(read(row.proposal)),row.sha256);assert.equal(sha(read(sourceReceipt)),sha(receipt));
 const tap=read(folder+'/child.tap').toString(),count=name=>{const value=tap.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));return value?Number(value[1]):null;};
 const counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled','todo'].map(name=>[name,count(name)]));
 const moduleEvidence=fs.readdirSync(folder).filter(name=>/^loaded-\d+\.json$/.test(name));const moduleEvidenceComplete=moduleEvidence.length>=1;for(const file of moduleEvidence)assert.deepEqual(json(folder+'/'+file).sourceDrift,[]);
 const passing=result.status===0&&moduleEvidenceComplete&&counts.tests===26&&counts.pass===26&&['fail','skipped','cancelled','todo'].every(name=>counts[name]===0);
 save('TERMINAL.json',{started,ended:new Date().toISOString(),exitCode:result.status,signal:result.signal,error:result.error?.message??null,counts,passing,namedSourceDrift:[],overrideDrift:[],moduleEvidence,moduleEvidenceComplete,sourceReceiptSha256:sha(receipt),tapSha256:sha(read(folder+'/child.tap')),stderrSha256:sha(read(folder+'/stderr.log')),scope:'Focused rerun of26guided-step cases after one exact current-copy assertion and source-hash guard; all behavior assertions retained. Prior17passing cases are not rerun. No application file changed.',fullWebsiteAcceptance:false,browserAcceptance:false,previewChanged:false});
 console.log(JSON.stringify({folder,counts,passing,exitCode:result.status}));process.exitCode=passing?0:1;
}

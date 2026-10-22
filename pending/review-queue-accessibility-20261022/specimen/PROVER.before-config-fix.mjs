// Isolated synthetic inbox component/unit project, not an installed website.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-final-loading-history-closures/APPLIED_SOURCE.json';
const sourceReceiptSha256='f36f00858d80c83c4d0b39d8930d35a9c77e76d28613919f4d8d8de738feb096';
assert.equal(sha(read(sourceReceipt)),sourceReceiptSha256);const source=json(sourceReceipt);
const prior=json('F:/VisibleMedicine/staging/20261022-final-closure-verification/native-selected/TERMINAL.json');
assert.equal(prior.terminal,true);assert.equal(prior.counts.fail,2);assert.deepEqual(prior.sourceDrift,[]);
const stage='F:/VisibleMedicine/staging/20261022-inbox-ui-specimen',root=stage+'/project';assert(!fs.existsSync(stage));
const queue='F:/VisibleMedicine/staging/20261022-review-queue-accessible-context',adapters='F:/VisibleMedicine/staging/20261022-inbox-useid-test-adapters';
const evidence=json(queue+'/EVIDENCE.json'),component='components/ClinicalReviewInbox.tsx';
assert.equal(evidence.receiptSha256,sourceReceiptSha256);
assert.equal(sha(read(queue+'/CODE/'+component)),evidence.hashes.code);
assert.deepEqual(read(queue+'/RAW/'+component),read(source.website+'/'+component));
const binding=json(source.website+'/atlas-review/integration-inputs.json');assert(!binding.inputs.some(row=>row.path===component),'This UI proposal must not silently alter a bound Review renderer');
const tests=fs.readdirSync(adapters+'/CODE/tests').sort();assert.equal(tests.length,7);
const rows=[{path:component,from:queue+'/CODE/'+component},
 {path:'tests/clinical-review-inbox-link-context.test.mjs',from:queue+'/CODE/tests/clinical-review-inbox-link-context.test.mjs'},
 ...tests.map(name=>({path:'tests/'+name,from:adapters+'/CODE/tests/'+name})),
 ...['components/clinical-review-inbox.css','package.json'].map(path=>({path,from:source.website+'/'+path}))];
for(const name of tests){
 const relative='tests/'+name,raw=read(adapters+'/RAW/'+relative),code=read(adapters+'/CODE/'+relative).toString();
 assert.equal(sha(raw),source.sourceRows.find(row=>row.path===relative).sha256);assert.deepEqual(raw,read(source.website+'/'+relative));
 const lines=code.split('\n'),added=lines.filter(line=>/^\s*let nextId\s*=\s*0;\s*$/.test(line)||/^\s*useId\(\)\s*\{.*inbox-harness-.*\}\s*,\s*$/.test(line));
 assert.equal(added.length,2,'Only the counter and stable hook adapter: '+name);
 assert.deepEqual(Buffer.from(lines.filter(line=>!added.includes(line)).join('\n')),raw,'Complete original test preserved: '+name);
}
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
fs.mkdirSync(root,{recursive:true});
for(const row of rows){assert(!path.isAbsolute(row.path)&&!row.path.includes('..'));const to=root+'/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.from,to,fs.constants.COPYFILE_EXCL);row.sha256=sha(read(to));row.bytes=read(to).length;}
fs.symlinkSync(source.website+'/lib',root+'/lib','junction');
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',root+'/node_modules','junction');
const entrypoints=rows.filter(row=>row.path.startsWith('tests/')).map(row=>row.path);
const inputs={at:new Date().toISOString(),sourceReceipt,sourceReceiptSha256,root,rows,entrypoints,
 sourceOnlySpecimen:true,clinicalOrPrivateDataUsed:false,candidateChanged:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
const child=spawnSync(process.execPath,['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...entrypoints],
 {cwd:root,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,encoding:'utf8',maxBuffer:16e6});
fs.writeFileSync(stage+'/child.tap',child.stdout??'',{flag:'wx'});fs.writeFileSync(stage+'/child.stderr',child.stderr??'',{flag:'wx'});
const counts={};for(const key of ['tests','pass','fail','skipped','cancelled'])counts[key]=Number((child.stdout??'').match(new RegExp('^# '+key+' (\\d+)','m'))?.[1]??NaN);
const sourceDrift=source.sourceRows.filter(row=>sha(read(source.website+'/'+row.path))!==row.sha256).map(row=>row.path);
const result={at:new Date().toISOString(),terminal:true,code:child.status,signal:child.signal,counts,sourceReceiptSha256,sourceDrift,
 specimenInputsSha256:sha(read(stage+'/INPUTS.json')),tapSha256:sha(read(stage+'/child.tap')),stderrSha256:sha(read(stage+'/child.stderr')),
 originalTestCallbacksExpected:45,newTestCallbacksExpected:3,sourceOnlySpecimen:true,websiteBuilt:false,reviewRebound:false,browserOrAssistiveAcceptance:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
assert.equal(child.status,0);assert.equal(counts.tests,48);assert.equal(counts.pass,48);assert.equal(counts.fail+counts.skipped+counts.cancelled,0);assert.deepEqual(sourceDrift,[]);

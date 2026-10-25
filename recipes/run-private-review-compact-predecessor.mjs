#!/usr/bin/env node
// Candidate pass pending: run only the unchanged whole compact root in its authenticated predecessor.
// Earlier guarded successor run remains 4/5; this runner never writes to source checkouts.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync, createWriteStream} from 'node:fs';
import {basename, dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {spawn, execFileSync} from 'node:child_process';
import {finished} from 'node:stream/promises';

const sha = b => createHash('sha256').update(b).digest('hex');
const fail = m => { throw new Error(m); };
const eq = (a,b,m) => { if(a !== b) fail(`${m}: expected ${b}, actual ${a}`); };
const hex40 = /^[0-9a-f]{40}$/;
const hex64 = /^[0-9a-f]{64}$/;
const context = [{
  id:'compact', website:'F:/VisibleMedicine/staging/20261022-admission-importer-source-successor/website',
  atlas:'F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas',
  head:'389bd0ca846a42c7f21055f55904bcf5df81a09f', tree:'25acdee40ee57e0253cdcca924aa64b4b38586c8',
  receipt:'F:/VisibleMedicine/staging/20261022-admission-importer-source-successor/SOURCE.json', receiptSha:'fcccc077d15911a94d395832be0cfe28e8eb15e2b0d37e80f01463645e0c89f1',
  plan:'F:/VisibleMedicine/staging/20261022-admission-importer-source-successor/NATIVE_PLAN.json', planSha:'8d6b26cc26cfd88e2dd7ca864f1277628ed7cb898a082e27f545cd269f79e238',
  root:'tests/head-review-compact-preservation.test.mjs', rootSha:'46e360890cabd5e44ef89bb5aa4c3c8fd5a0a809832a275de966a0372bff4355', tests:5,
  inputs:1727, reviewFiles:1560, viewerFiles:46, viewerPackages:22,
  fixturePrefixes:['tests/fixtures/head-review-compact/','tests/fixtures/head-surface-before-20261022/','tests/fixtures/review-frame-history/'],
  sourcePaths:['tests/review-frame-history-inverse.mjs','tests/surface-binder-history-inverse.mjs','tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs','tests/fixtures/current-atlas-delivery.json','tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw','tests/fixtures/current-delivery-before-head-tools-20261022.json','tests/current-atlas-delivery.test.mjs','tests/review-navigation-delivery-preservation.test.mjs','tests/head-teaching-review-navigation.test.ts']
}];
function safe(base, path) {
  if(typeof path !== 'string' || !path || path.includes('\\') || path.startsWith('/') || path.split('/').some(x=>!x||x==='.'||x==='..') || /^[A-Za-z]:/.test(path)) fail(`unsafe relative path: ${path}`);
  const full=resolve(base,...path.split('/'));
  const rel=relative(resolve(base),full);
  if(rel.startsWith('..'+sep)||rel==='..'||isAbsolute(rel)) fail(`path escapes root: ${path}`);
  const actual=realpathSync(full);
  const realBase=realpathSync(base), realRel=relative(realBase,actual);
  if(realRel.startsWith('..'+sep)||realRel==='..'||isAbsolute(realRel)) fail(`symlink escapes root: ${path}`);
  return full;
}
function fileHash(full, expected, label=full) {
  if(!hex64.test(expected)) fail(`invalid expected SHA: ${label}`);
  const actual=sha(readFileSync(full)); eq(actual,expected,label); return actual;
}
function json(full) { return JSON.parse(readFileSync(full,'utf8')); }
function git(c,...args) {
  return execFileSync('git',['-C',c.atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
}
function gitState(c) {
  const top=realpathSync(git(c,'rev-parse','--show-toplevel'));
  eq(top,realpathSync(c.atlas),`${c.id} Atlas repository root`);
  const head=git(c,'rev-parse','HEAD'), tree=git(c,'rev-parse','HEAD^{tree}');
  const status=git(c,'status','--porcelain=v1','--untracked-files=all');
  eq(head,c.head,`${c.id} Atlas HEAD`); eq(tree,c.tree,`${c.id} Atlas tree`); eq(status,'',`${c.id} Atlas status`);
  return {head,tree,status};
}
function receipt(c) {
  fileHash('F:/VisibleMedicine/staging/20261025-private-review-historical-execution/RESULT.json','8b22fbb57d32a3db47df1e0e0b3f424f7a421d7ee63b5268bb87341dd3688053',`${c.id} preserved 4/5 result`);
  fileHash(c.receipt,c.receiptSha,`${c.id} source receipt`);
  const r=json(c.receipt);
  eq(realpathSync(r.website),realpathSync(c.website),`${c.id} website receipt`);
  eq(realpathSync(r.atlas),realpathSync(c.atlas),`${c.id} Atlas receipt`);
  eq(r.atlasHead,c.head,`${c.id} receipt HEAD`);eq(r.atlasTree,c.tree,`${c.id} receipt tree`);
  eq(r.previousSource,'F:/VisibleMedicine/staging/20261022-admission-dependent-source-successor/SOURCE.json',`${c.id} previous path`);
  eq(r.previousSourceSha256,'6a022d96197ea86b6fd8c32eed179b7619435c65066a8ff8a49257241434a190',`${c.id} previous hash`);
  fileHash(r.previousSource,r.previousSourceSha256,`${c.id} previous receipt`);
  fileHash(c.plan,c.planSha,`${c.id} native preparation plan`);
  const plan=json(c.plan);
  eq(plan.sourceReceipt,c.receipt,`${c.id} native plan source path`);
  eq(plan.sourceReceiptSha256,c.receiptSha,`${c.id} native plan source hash`);
  return r;
}
function rows(c,r,review) {
  if(!Array.isArray(r.sourceRows)) fail(`${c.id} missing source rows`);
  const map=new Map();
  for(const row of r.sourceRows) { if(map.has(row.path)) fail(`${c.id} duplicate source row ${row.path}`); map.set(row.path,row); }
  const selected=new Set([c.root,...c.sourcePaths,'atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
  for(const row of r.sourceRows) if(c.fixturePrefixes.some(p=>row.path.startsWith(p))) selected.add(row.path);
  for(const p of selected) {
    const row=map.get(p); if(!row) fail(`${c.id} source row missing: ${p}`);
    const full=safe(c.website,p), bytes=readFileSync(full);
    eq(bytes.length,row.bytes,`${c.id} source bytes ${p}`);eq(sha(bytes),row.sha256,`${c.id} source SHA ${p}`);
  }
  eq(map.get(c.root)?.sha256,c.rootSha,`${c.id} locked root SHA`);
  if(![...selected].some(p=>c.fixturePrefixes.some(prefix=>p.startsWith(prefix)))) fail(`${c.id} no fixtures selected`);
  const pin=json(safe(c.website,'tests/fixtures/current-atlas-delivery.json'));
  eq(pin.source,c.head,`${c.id} delivery pin source`);eq(pin.sourceTree,c.tree,`${c.id} delivery pin tree`);
  eq(pin.reviewIntegration,review.sha256,`${c.id} delivery pin digest`);
  eq(pin.reviewSourceFiles,c.reviewFiles,`${c.id} delivery pin file count`);
  eq(pin.viewerFiles,c.viewerFiles,`${c.id} delivery pin viewer files`);
  eq(pin.viewerPackages,c.viewerPackages,`${c.id} delivery pin viewer packages`);
  for(const [p,h] of Object.entries(pin.documents)) fileHash(safe(c.website,p),h,`${c.id} delivery document ${p}`);
  return {selectedSourceRows:selected.size,fixturePrefixes:c.fixturePrefixes};
}
function distinctSafeRows(base,list,key,label) {
  if(!Array.isArray(list)) fail(`${label} is not an array`);
  const seen=new Set();
  for(const row of list) {if(seen.has(row.path)) fail(`${label} duplicate path ${row.path}`);seen.add(row.path);fileHash(safe(base,row.path),row[key],`${label} ${row.path}`);}
}
function artifacts(c,r) {
  const review=json(safe(c.website,'atlas-review/integration-inputs.json'));
  eq(r.boundInputs,c.inputs,`${c.id} receipt Review count`);
  eq(review.sourceCommit,c.head,`${c.id} Review source`);
  eq(review.inputs?.length,c.inputs,`${c.id} Review input count`);
  eq(review.sha256,sha(Buffer.from(JSON.stringify(review.inputs))),`${c.id} Review canonical digest`);
  eq(review.sha256,r.review,`${c.id} source receipt Review digest`);
  distinctSafeRows(c.website,review.inputs,'sha256',`${c.id} Review input`);
  const manifest=json(safe(c.website,'atlas-review/manifest.json'));
  eq(manifest.revision,c.head,`${c.id} Review manifest source`);
  eq(manifest.websiteIntegrationSha256,review.sha256,`${c.id} Review manifest digest`);
  eq(manifest.files?.length,c.reviewFiles,`${c.id} Review manifest count`);
  distinctSafeRows(join(c.website,'atlas-review'),manifest.files,'importedSha256',`${c.id} Review emitted`);
  const viewer=json(safe(c.website,'public/atlas-review-viewer/manifest.json'));
  eq(viewer.sourceCommit,c.head,`${c.id} viewer source`);
  eq(viewer.websiteIntegrationSha256,review.sha256,`${c.id} viewer digest`);
  eq(viewer.mode,'production',`${c.id} viewer mode`);
  eq(viewer.personalRecordsIncluded,false,`${c.id} viewer personal records`);
  eq(viewer.modelDelivery,'existing-protected-inventory',`${c.id} viewer model policy`);
  eq(viewer.files?.length,c.viewerFiles,`${c.id} viewer files`);
  eq(viewer.packages?.length,c.viewerPackages,`${c.id} viewer packages`);
  if(!viewer.files.some(x=>x.path==='THIRD_PARTY_NOTICES.txt')) fail(`${c.id} missing viewer notices`);
  distinctSafeRows(join(c.website,'public/atlas-review-viewer'),viewer.files,'sha256',`${c.id} viewer emitted`);
  return {reviewDigest:review.sha256,inputs:review.inputs.length,reviewFiles:manifest.files.length,viewerFiles:viewer.files.length,viewerPackages:viewer.packages.length,...rows(c,r,review)};
}
function preflight(c) {const r=receipt(c);const atlas=gitState(c);const protectedBytes=artifacts(c,r);return {atlas,protectedBytes,sourceReceiptSha256:c.receiptSha,rootSha256:c.rootSha};}
function tapCheck(text,n,id) {
  const versions=[...text.matchAll(/^TAP version \d+\r?$/gm)];
  if(versions.length!==1||versions[0][0].trim()!=='TAP version 13')fail(`${id} requires one standalone TAP version 13`);
  if(/^\s*not ok\b/im.test(text))fail(`${id} failed root or nested point`);
  if(/^\s*(?:not )?ok\b[^\r\n]*#\s*(?:skip|todo)\b/im.test(text))fail(`${id} skipped or TODO point`);
  if(/^\s*Bail out!/im.test(text))fail(`${id} TAP bailout`);
  const counts={};
  for(const key of ['tests','pass','fail','cancelled','skipped','todo']) {
    const matches=[...text.matchAll(new RegExp(`^# ${key} (\\d+)\\r?$`,'gm'))];
    if(matches.length!==1)fail(`${id} requires one ${key} footer`);
    counts[key]=Number(matches[0][1]);
  }
  for(const [key,value] of Object.entries({tests:n,pass:n,fail:0,cancelled:0,skipped:0,todo:0}))eq(counts[key],value,`${id} TAP ${key}`);
  const plans=[...text.matchAll(/^1\.\.(\d+)\r?$/gm)];
  if(plans.length!==1)fail(`${id} requires one TAP plan`);
  eq(Number(plans[0][1]),n,`${id} TAP plan`);
  const points=[...text.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)];
  eq(points.length,n,`${id} root point count`);
  for(let i=0;i<n;i++)eq(Number(points[i][1]),i+1,`${id} ordered root point ${i+1}`);
  if(!(versions[0].index<points[0].index&&plans[0].index>points.at(-1).index))fail(`${id} TAP version/points/plan order`);
  for(const key of Object.keys(counts))if(text.lastIndexOf(`# ${key} `)<=plans[0].index)fail(`${id} ${key} footer before plan`);
  return counts;
}
function childEnv(c) {
  const e={};
  for(const k of ['SystemRoot','WINDIR','ComSpec','PATHEXT','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramFiles','ProgramFiles(x86)','ProgramW6432']) if(process.env[k]) e[k]=process.env[k];
  const nodeDir=dirname(process.execPath);
  const whereExe=join(process.env.SystemRoot||'C:/Windows','System32','where.exe');
  const gitDir=dirname(execFileSync(whereExe,['git'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/)[0]);
  e.Path=[nodeDir,gitDir].join(';');
  e.CI='1';e.GIT_NO_REPLACE_OBJECTS='1';e.GIT_OPTIONAL_LOCKS='0';
  e.VM_ATLAS_SOURCE_REPO=c.atlas;e.ATLAS_SOURCE_REPO=c.atlas;
  const folded=Object.keys(e).map(k=>k.toLowerCase());
  if(new Set(folded).size!==folded.length)fail(`${c.id} child environment has duplicate case-insensitive keys`);
  return e;
}
async function run(c,out) {
  const dir=join(out,c.id);mkdirSync(dir);
  const args=['--max-old-space-size=512','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',c.root];
  const stdout=join(dir,'stdout.tap'),stderr=join(dir,'stderr.txt');
  const outStream=createWriteStream(stdout,{flags:'wx'}),errStream=createWriteStream(stderr,{flags:'wx'});
  const startedAt=new Date().toISOString();
  const child=spawn(process.execPath,args,{cwd:c.website,env:childEnv(c),windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(outStream);child.stderr.pipe(errStream);
  const result=await new Promise(resolve=>{child.once('error',error=>resolve({error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});
  await Promise.all([finished(outStream),finished(errStream)]);
  const meta={command:[process.execPath,...args],cwd:c.website,pid:child.pid??null,startedAt,finishedAt:new Date().toISOString(),...result,stdoutSha256:sha(readFileSync(stdout)),stderrSha256:sha(readFileSync(stderr)),stdout,stderr};
  writeFileSync(join(dir,'process.json'),JSON.stringify(meta,null,2)+'\n',{flag:'wx'});
  return meta;
}
async function main() {
  const args=process.argv.slice(2);
  if(args.length!==2||args[0]!=='--output-root'||!args[1])fail('usage: node run-compact.mjs --output-root F:/VisibleMedicine/staging/NEW-DIR');
  const output=resolve(args[1]);
  const staging=realpathSync('F:/VisibleMedicine/staging');
  const rel=relative(staging,output);
  const parentRel=relative(staging,realpathSync(dirname(output)));
  if(!isAbsolute(args[1])||!/^F:[\\/]/i.test(args[1])||!rel||rel.startsWith('..')||isAbsolute(rel)||parentRel.startsWith('..')||isAbsolute(parentRel)||existsSync(output))fail('output root must be a fresh absolute child of F:/VisibleMedicine/staging');
  mkdirSync(output,{recursive:false});
  const report={schema:'vm-private-review-compact-predecessor-execution/1',candidatePassPending:true,earlierSuccessorResult:{pass:4,fail:1,result:'F:/VisibleMedicine/staging/20261025-private-review-historical-execution/RESULT.json',sha256:'8b22fbb57d32a3db47df1e0e0b3f424f7a421d7ee63b5268bb87341dd3688053'},startedAt:new Date().toISOString(),scriptSha256:sha(readFileSync(new URL(import.meta.url))),roots:[]};
  const save=()=>writeFileSync(join(output,'RESULT.json'),JSON.stringify(report,null,2)+'\n');
  try {
    for(const c of context) {
      const row={id:c.id,root:c.root,expectedTests:c.tests};report.roots.push(row);
      row.before=preflight(c);save();
      row.child=await run(c,output);save();
      row.after=preflight(c);save();
      if(row.child.error||row.child.code!==0||row.child.signal) fail(`${c.id} child failed; see ${output}/${c.id}/process.json`);
      row.tap=tapCheck(readFileSync(row.child.stdout,'utf8'),c.tests,c.id);save();
    }
    report.status='passed';report.candidatePassPending=false;report.finishedAt=new Date().toISOString();save();
  } catch(e) {report.status='failed';report.error=String(e?.stack||e);report.finishedAt=new Date().toISOString();save();throw e;}
}
main().catch(e=>{console.error(e?.stack||e);process.exitCode=1;});

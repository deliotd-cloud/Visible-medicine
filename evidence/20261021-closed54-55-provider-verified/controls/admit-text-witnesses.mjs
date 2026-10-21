// Main-owned exact admission: source code uses apply_patch; already authenticated
// compressed historical text witnesses are copied mechanically without rewriting.
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import{spawnSync}from'node:child_process';
import{read,json,sha,runGit}from'./source-only-backup-20261019.mjs';
const mode=process.argv[2],c=json(process.argv[3]),site='F:/VisibleMedicine/website';
assert(['emit','copy'].includes(mode));
const plan=json(c.stage+'/PREPARATION.json'),proposal=json(c.proposal+'/PROPOSAL.json');
assert.equal(sha(read(c.proposal+'/PROPOSAL.json')),c.manifestSha256);assert.equal(plan.manifestSha256,c.manifestSha256);
assert.deepEqual(plan.paths,proposal.proposedPaths);
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),proposal.websiteHeadAtObservation);
const closedProvider=c.proposal==='F:/VisibleMedicine/staging/20261021-closed54-55-provider-proposal';
const prefix='tests/fixtures/head-binding-before-role-batch-20261021/';
const mechanical=closedProvider?['tests/fixtures/closed54-55-provider/anatomy-coverage-index-55.json.raw']:
 ['practice-inputs-before-keyboard.json','practice-inputs-after-keyboard.json','practice-manifest-before-keyboard.json','practice-body-before-keyboard.json','practice-revisions-before-keyboard.json'].map(n=>prefix+n+'.deflate-base64.raw');
if(!closedProvider)assert.equal(c.proposal,'F:/VisibleMedicine/staging/20261021-head-binding-role-proposal-v2');
const selected=plan.paths.filter(r=>mechanical.includes(r.path));assert.equal(selected.length,mechanical.length);
const target=p=>{const absolute=path.resolve(site,p);assert(absolute.startsWith(path.resolve(site)+path.sep));return absolute;};
for(const r of plan.paths){assert(!r.path.includes('..'));const b=read(c.proposal+'/'+r.path);assert.equal(b.length,r.candidateBytes);assert.equal(sha(b),r.candidateSha256);}
if(mode==='emit'){
 const patch=['*** Begin Patch'];
 for(const r of plan.paths){
  if(mechanical.includes(r.path)){assert.equal(r.preimageSha256,null);assert(!fs.existsSync(target(r.path)));continue;}
  if(r.preimageSha256){
   assert.equal(sha(read(target(r.path))),r.preimageSha256);
   const result=spawnSync('git',['diff','--no-index','--no-ext-diff','--text',target(r.path),c.proposal+'/'+r.path],{encoding:'utf8',windowsHide:true,maxBuffer:2e6});assert.equal(result.status,1);
   const lines=result.stdout.replaceAll('\r\n','\n').split('\n'),start=lines.findIndex(l=>l.startsWith('@@'));assert(start>=0);
   patch.push('*** Update File: '+target(r.path).replaceAll('\\','/'),...lines.slice(start).filter(l=>!l.startsWith('\\ No newline')).map(l=>l.startsWith('@@')?'@@':l).filter((l,i,a)=>i<a.length-1||l!==''));
  }else{
   assert(!fs.existsSync(target(r.path)));const text=read(c.proposal+'/'+r.path).toString();assert(text.endsWith('\n'));
   patch.push('*** Add File: '+target(r.path).replaceAll('\\','/'),...text.slice(0,-1).split('\n').map(l=>'+'+l));
  }
 }
 patch.push('*** End Patch');console.log(patch.join('\n'));
}else{
 const candidates=new Map(plan.paths.map(r=>[r.path,r]));
 // Apart from the exact source patch just installed, all previous named source
 // and preserved inputs must still match before copying any new text witness.
 for(const r of [...json(plan.priorSourceSnapshot),...plan.preserved])assert.equal(sha(read(target(r.path))),candidates.get(r.path)?.candidateSha256??r.sha256,r.path);
 for(const r of plan.paths.filter(r=>!mechanical.includes(r.path)))assert.equal(sha(read(target(r.path))),r.candidateSha256,r.path);
 for(const r of selected){
  assert.equal(r.preimageSha256,null);assert(!fs.existsSync(target(r.path)));
  const b=read(c.proposal+'/'+r.path);assert(b.length<250000);const text=new TextDecoder('utf-8',{fatal:true}).decode(b);
  if(closedProvider)assert(JSON.parse(text)&&text.endsWith('\n'));else assert.match(text,/^[A-Za-z0-9+/]+={0,2}\n$/);
 }
 for(const r of selected){fs.mkdirSync(path.dirname(target(r.path)),{recursive:true});fs.copyFileSync(c.proposal+'/'+r.path,target(r.path),fs.constants.COPYFILE_EXCL);assert.equal(sha(read(target(r.path))),r.candidateSha256);}
 const receipt={at:new Date().toISOString(),mechanicalSourceOnlyCopies:true,proposal:c.proposal,manifestSha256:c.manifestSha256,files:selected,overwrite:false,privateDataCopied:false};
 fs.writeFileSync(c.stage+'/MECHANICAL_WITNESS_COPY.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({copied:selected.length,bytes:selected.reduce((n,r)=>n+r.candidateBytes,0),exactHashes:true,overwrites:0}));
}

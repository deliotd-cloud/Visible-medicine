import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';

const stage='F:/VisibleMedicine/staging/20261026-review-count-website';
const proposalFile='F:/VisibleMedicine/staging/20261026-review-count-proposal/PROPOSAL.json';
const proposal=json(proposalFile),verificationFile='F:/VisibleMedicine/staging/20261026-review-count-proposal/checks-after/RESULT.json';
const costDir='F:/VisibleMedicine/staging/20261026-glottic-cost-proposal';
assert.equal(hash(costDir+'/edits.json'),'5a4aecaaa5a2794ddcbac7680ef43ffbe0638b6c1df2eca85d922bd491185dd3');
assert.equal(hash(costDir+'/original.raw'),'57eb82f8a004db422302f1888888e7ad124fe9777694d0a044220fd738490a13');
assert.equal(hash(costDir+'/proposed.mjs'),'a982dbd8f94f5cfdf3eef133a1a4f0b294e4c21853a5cf574619047b840c2be8');
const costEdits=json(costDir+'/edits.json'),costText=fs.readFileSync(costDir+'/proposed.mjs','utf8');
assert.equal(costText.split(costEdits.inverse.findExactlyOnce).length,2);
assert.equal(costText.replace(costEdits.inverse.findExactlyOnce,costEdits.inverse.replaceWith),fs.readFileSync(costDir+'/original.raw','utf8'));
assert.equal(hash(verificationFile),'7af7fbc5f112a922f1e36016258c7e654bb2b8e3e540f3c47d82bff6dc9ed218');
assert(json(verificationFile).passing);
const terminalFile='F:/VisibleMedicine/staging/20261026-release-stock-campaign/guard-1/RESULT.json';
const terminal=json(terminalFile);
assert(terminal.run.process?.terminalObserved,'Original diagnostic must be terminal before integration');
assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
assert.equal(hash(proposal.proposal.path),proposal.proposal.sha256);
assert.equal(hash(proposal.original.path),proposal.original.sha256);
let inverse=fs.readFileSync(proposal.proposal.path,'utf8');
for(const [from,to]of [...proposal.edits].reverse()){
  assert.equal(inverse.split(to).length,2,'Exact approved inverse required');
  inverse=inverse.replace(to,from);
}
assert.equal(inverse,fs.readFileSync(proposal.original.path,'utf8'));
const {parent,site}=clonePinnedWebsite({stage,parentFile:proposal.source.path,parentSha256:proposal.source.sha256});
const changed='tests/clinical-review-integration.test.ts';
assert.equal(hash(site+'/'+changed),proposal.original.sha256);
fs.copyFileSync(proposal.proposal.path,site+'/'+changed);
const costPath='tests/atlas-glottic-muscle-imaging.test.mjs';
assert.equal(hash(site+'/'+costPath),hash(costDir+'/original.raw'));
fs.copyFileSync(costDir+'/proposed.mjs',site+'/'+costPath);
const changedHashes=new Map([[changed,proposal.proposal.sha256],[costPath,hash(costDir+'/proposed.mjs')]]);
// A previous actual build generated these declaration bytes. Retain the exact
// declarations for full configured type checking; no route is added or removed.
for(const p of ['next-env.d.ts','.next/types/routes.d.ts']){
  const from='F:/VisibleMedicine/staging/20261026-surface-recovery-website/website/'+p,to=site+'/'+p;
  if(!fs.existsSync(to)){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);}
  assert.equal(hash(to),hash(from));
}
const rows=parent.sourceRows.map(r=>{
  const actual=hash(site+'/'+r.path);
  assert.equal(actual,changedHashes.get(r.path)??r.sha256,r.path);
  return {...r,sha256:actual,bytes:fs.statSync(site+'/'+r.path).size};
});
const receipt={schema:'vm-review-count-test-successor/1',at:new Date().toISOString(),website:site,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,parent:proposal.source.path,parentSha256:proposal.source.sha256,sourceRows:rows,sourcePaths:rows.length,changedPaths:[...changedHashes.keys()],dependencies:parent.dependencies,reviewBindingSha256:parent.reviewBindingSha256,proposal:{path:proposalFile,sha256:hash(proposalFile)},costProposal:{path:costDir+'/edits.json',sha256:hash(costDir+'/edits.json')},precedingDiagnostic:{path:terminalFile,sha256:hash(terminalFile)},applicationNativeRuntimeReviewLicencesUnchanged:true,exactOriginalAssertionsInverse:true,normalPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),changed}));

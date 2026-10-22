import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';

const previous='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sourcePath=previous+'/PRODUCT_SOURCE_V6.json';
assert.equal(sha(read(sourcePath)),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c');
const source=json(sourcePath),terminalPath=previous+'/native-terminal-followups-v6/TERMINAL.json';
const terminal=json(terminalPath);assert.equal(terminal.terminal,true);assert.equal(terminal.code,1);
assert.deepEqual(terminal.sourceDrift,[]);assert.equal(terminal.entryFiles,101);
assert.deepEqual(terminal.counts,{tests:329,pass:300,fail:29,cancelled:0,skipped:0,todo:0});
assert.equal(terminal.sourceReceiptSha256,sha(read(sourcePath)));
const tap=read(previous+'/native-terminal-followups-v6/child.tap');assert.equal(sha(tap),terminal.tapSha256);
const failures=tap.toString().split(/(?=^not ok \d+ - )/m).filter(b=>b.startsWith('not ok ')).map(block=>{
 const [,id,title]=/^not ok (\d+) - (.+)/.exec(block);
 const location=/^\s*location: '([^']+)'/m.exec(block)?.[1]?.replace(/\\+/g,'/');
 const file=/\/(tests\/.+?):\d+:\d+$/.exec(location??'')?.[1];assert(file);
 return {id:Number(id),title,path:file,acceptancePending:true};
});
assert.equal(failures.length,29);
const proposalPath='F:/VisibleMedicine/staging/20261022-review-loading-binding-repair/PROPOSED_BINDING.json';
assert.equal(sha(read(proposalPath)),'a618409986104b768880935e61dde10f7dc130bb83805380f5690c177dff3322');
const proposal=json(proposalPath);assert.equal(proposal.applied,false);
const canonical='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
const root='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor',website=root+'/website';
assert(!fs.existsSync(root));assert.equal(source.sourceRows.length,6049);
// Preserve only these already controlled, held review source assets locally.
// No other .local path, runtime record, database or scan may be copied.
const heldAssets=new Map([
 ['.local/disc-review/assets.ts','3355c0fdb96c189f6aa9e4e49975f701ab1e2255a194334c1d9f015df3c9ef77'],
 ['.local/optic-review/assets.ts','9a1f3ec4bc5fef227315be9599b7215d4f1746fdbc9f4e258b511776df41d58e'],
 ['.local/plexus-review/assets.ts','d631e8bd2bc26f8dd9973dd08a27bb8205e007cfbbccacdeefc22d83320c92ac'],
]);
for(const row of source.sourceRows){
 containedTarget(website,row.path);
 if(heldAssets.has(row.path))assert.equal(row.sha256,heldAssets.get(row.path),'Only exact existing held review source assets');
 else assert(!/(^|\/)(?:\.local|\.env(?:\.[^/]*)?|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path),'No private runtime state is copied: '+row.path);
 assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
}
fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout',canonical,website]);runGit(['-C',website,'read-tree','HEAD']);
for(const row of source.sourceRows){const target=containedTarget(website,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source.website+'/'+row.path,target,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(target)),row.sha256);}
fs.symlinkSync(canonical+'/node_modules',website+'/node_modules','junction');fs.symlinkSync(atlas,root+'/atlas','junction');
const result={at:new Date().toISOString(),root,website,previousSource:sourcePath,previousSourceSha256:sha(read(sourcePath)),
 sourceRows:source.sourceRows,sourcePaths:source.sourceRows.length,priorTerminal:terminalPath,priorTerminalSha256:sha(read(terminalPath)),
 actualPriorFailures:failures,priorFailuresNotDismissed:true,
 bindingProposal:proposalPath,bindingProposalSha256:sha(read(proposalPath)),
 intendedChange:'Run the unchanged real binder so the existing generic Review loading screen becomes an exact bound input; rebuild the generated viewer and website coherently.',
 candidateReady:false,clinicalApproval:false,ownerPreviewChanged:false,canonicalChanged:false,privateRuntimeRecordsCopied:false,
 controlledHeldSourceAssetsPreservedLocally:[...heldAssets].map(([path,sha256])=>({path,sha256})),
 heldSourceAssetsRemainExcludedFromHostedBackup:true,publicDeployment:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');
pointer.activeWork.current.nativeRun={...pointer.activeWork.current.nativeRun,...terminal,pid:null,session:87389,result:terminalPath};
pointer.activeWork.current.bindingRepair={stage:root,prepared:root+'/PREPARED.json',preparedSha256:sha(read(root+'/PREPARED.json')),
 oldReview:proposal.priorReview,proposedReview:proposal.proposedReview,addedInput:proposal.loader.path,applied:false,
 priority:'Genuine producer idempotence defect. Keep original failing test; repair/rebuild product source bindings before final native acceptance.'};
pointer.activeWork.current.beforeFurtherWork='V6 is terminal329/300/29, no drift; session87389 finished. The new loading-bound successor is an isolated source copy, not a built/admitted/installed candidate. Finish actual bind/viewer/types/website gates and exact current pin, retain all29 failures and complete their source closures. No owner preview changes.';
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({prepared:root+'/PREPARED.json',sha256:sha(read(root+'/PREPARED.json')),sourcePaths:6049,retainedActualFailures:29,ownerPreviewChanged:false}));

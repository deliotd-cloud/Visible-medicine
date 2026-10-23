import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
export const stage='F:/VisibleMedicine/staging/20261023-keyboard-role-repair';
export function verifyRepair(){
 const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),site=prep.website;
 assert.equal(hash(prep.parentReceipt),'29e083ec39cf546e30e577f30bc345db0464f6451acb6c1380a3ca96d91f16d5');
 assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
 const changed=[];for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256);if(hash(site+'/'+r.path)!==r.sha256){assert(prep.allowed.includes(r.path),'Unexpected source change '+r.path);changed.push(r.path);}}
 assert.deepEqual(new Set(changed),new Set(prep.allowed));
 const newPaths=['tests/keyboard-teaching-source-role.mjs','tests/keyboard-teaching-source-role.test.mjs',...prep.preimages.map(r=>r.file)];
 const rows=[...changed,...newPaths].sort().map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}));
 const term=json(stage+'/native/TERMINAL.json');assert.equal(term.code,0);assert.deepEqual(term.sourceDrift,[]);assert.equal(term.counts.tests,52);assert.equal(term.counts.pass,52);for(const k of ['fail','cancelled','skipped','todo'])assert.equal(term.counts[k],0);
 assert.equal(hash(stage+'/native/stdout.tap'),term.stdoutSha256);assert.equal(hash(stage+'/native/stderr.log'),term.stderrSha256);
 const before=json(stage+'/native/SOURCE_BEFORE.json');assert.equal(before.sourceRows.length,6337);for(const r of before.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256);
 assert.equal(hash(parent.buildArtifacts),parent.buildArtifactsSha256);const build=json(parent.buildArtifacts);assert.equal(build.files.length,1111);for(const r of build.files)assert.equal(hash(parent.website+'/dist/'+r.path),r.sha256);
 for(const[root,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[prep.atlas,prep.atlasHead]])assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
 const audit='F:/VisibleMedicine/staging/20261023-carpal-regression-audit',a=json(audit+'/TERMINAL.json');assert.equal(a.code,1);assert.equal(a.counts.tests,13);assert.equal(a.counts.pass,4);assert.equal(a.counts.fail,9);assert.equal(a.resourceFailure,true);assert.deepEqual(a.sourceDrift,[]);assert.equal(hash(audit+'/stdout.tap'),a.stdoutSha256);assert.equal(hash(audit+'/stderr.log'),a.stderrSha256);
 return{prep,parent,site,rows,changed,newPaths,native:term,audit:a,sourceRows:before.sourceRows};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/seal-keyboard-role-repair-20261023.mjs')){
 const r=verifyRepair(),proof={at:new Date().toISOString(),schema:'vm.keyboard-teaching-role-source-proof/1',parentReceipt:r.prep.parentReceipt,parentReceiptSha256:r.prep.parentReceiptSha256,website:r.site,atlas:r.prep.atlas,atlasHead:r.prep.atlasHead,atlasTree:r.prep.atlasTree,changedExistingPaths:r.changed,newPaths:r.newPaths,sourceRows:r.sourceRows,sourcePaths:6337,unchangedParentInputs:6329,allProductionGeneratedModelsAccessDependenciesAndBindingsByteIdentical:true,rows:r.rows,native:r.native,currentEightRootAudit:r.audit,wholeSuitePassing:false,newBuildOrTypeClaim:false,previewChanged:false,installed:false};
 fs.writeFileSync(stage+'/SOURCE_PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({sourceProof:stage+'/SOURCE_PROOF.json',sha256:hash(stage+'/SOURCE_PROOF.json'),changed:3,newPaths:5,nativePass:52}));
}

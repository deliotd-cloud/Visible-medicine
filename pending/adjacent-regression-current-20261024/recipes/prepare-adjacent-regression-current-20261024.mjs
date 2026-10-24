// Parallel test-only batch based on the completely sealed lower-limb proof.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const stage='F:/VisibleMedicine/staging/20261024-adjacent-regression-current',site=stage+'/website';
const parentFile='F:/VisibleMedicine/staging/20261024-lower-limb-regression-current/PROOF_BOUND.json';
assert.equal(hash(parentFile),'11adb4df96f62ad19a9afcf7941b0e939ec32d7b317fe640342603aa12d3d251');const p=json(parentFile);
assert(!fs.existsSync(stage));assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(execFileSync('git',['-C',p.atlas,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),p.atlasHead);
fs.mkdirSync(site,{recursive:true});
for(const r of p.sourceRows){assert.equal(hash(p.website+'/'+r.path),r.sha256,r.path);const to=containedTarget(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(p.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(p.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(p.atlas,stage+'/atlas','junction');
const audited=json('F:/VisibleMedicine/staging/20261024-adjacent-native-execution/RECEIPT.json');
const names=[...new Set([...audited.files.map(r=>r.path),'tests/tour-playback-source-role.test.mjs'])].filter(p=>fs.existsSync(site+'/'+p));
const preimages=names.map(name=>{const out='tests/fixtures/adjacent-b79-preimage/'+path.basename(name)+'.raw';const to=site+'/'+out;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+name,to,fs.constants.COPYFILE_EXCL);return{path:name,preimage:out,sha256:hash(to)};});
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),website:site,atlas:p.atlas,atlasHead:p.atlasHead,atlasTree:p.atlasTree,parentReceipt:parentFile,parentReceiptSha256:hash(parentFile),sourcePaths:p.sourcePaths,preimages,auditedHistoricalProposal:'F:/VisibleMedicine/staging/20261024-adjacent-native-execution/RECEIPT.json',auditedHistoricalProposalSha256:hash('F:/VisibleMedicine/staging/20261024-adjacent-native-execution/RECEIPT.json'),testOnly:true,previewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,sourcePaths:p.sourcePaths,preimages:preimages.length,previewChanged:false}));

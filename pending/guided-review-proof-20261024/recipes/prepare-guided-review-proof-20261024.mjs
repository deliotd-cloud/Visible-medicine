import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const stage='F:/VisibleMedicine/staging/20261024-guided-review-completeness';
const receipt='F:/VisibleMedicine/staging/20261024-upper-vascular-website/SOURCE_BOUND.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(fs.readFileSync(receipt)),'40fd40cba3b6f75253e0f3b825bd02d6a94e876e6d8aafedb5e8a043ce1ed8e2');
const parent=JSON.parse(fs.readFileSync(receipt));
assert.equal(parent.atlasHead,'5f3c0a9518b03ae23f3992129a09c4b6edeeda2b');
assert.equal(parent.sourceRows.length,6496);
assert(!fs.existsSync(stage));
fs.mkdirSync(stage);
const site=stage+'/website';fs.mkdirSync(site);
for(const row of parent.sourceRows){
 assert(!path.isAbsolute(row.path)&&!row.path.split(/[\\/]/).some(p=>!p||p==='.'||p==='..'));
 const from=parent.website+'/'+row.path,to=site+'/'+row.path;
 const b=fs.readFileSync(from);assert.equal(b.length,row.bytes,row.path);assert.equal(sha(b),row.sha256,row.path);
 fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
 assert.equal(sha(fs.readFileSync(to)),row.sha256,row.path);
}
fs.symlinkSync(parent.website+'/node_modules',site+'/node_modules','junction');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
assert.equal(git(parent.atlas,'rev-parse','HEAD'),parent.atlasHead);
assert.equal(git(parent.atlas,'rev-parse','HEAD^{tree}'),parent.atlasTree);
assert.equal(git(parent.atlas,'status','--porcelain'),'');
const value={at:new Date().toISOString(),stage,website:site,parentReceipt:receipt,parentReceiptSha256:sha(fs.readFileSync(receipt)),
 parentWebsite:parent.website,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,
 inheritedRows:parent.sourceRows.length,plannedNewPaths:['tests/guided-review-completeness.mjs','tests/guided-review-completeness.test.mjs'],
 productSourceChanged:false,generatedFilesChanged:false,previewChanged:false,installed:false};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(value));

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { hash,json } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition9-title-ready',site=root+'/website';
const pin='G:/VisibleMedicine-temp/staging/20261031-review-shared-filters-ready/SOURCE.json';
const proposal='G:/VisibleMedicine-temp/proposals/20261031-release-partition9-repair';
assert.equal(hash(pin),'4a0db69ce9d84d24da84bff5aeed8da5ea65c750d09bc8de6543dadf97961700');
const parent=json(pin),changes={
 'tests/clinical-review-hepatic-arterial-xray.test.ts':['7ccc686e240ad9b77794047bcb952c14526195d574e3569465bbc53a642a74c4','80a610d494949b964ad4be4fbc29cd14e313cd22a8d0618dee6f83108fdf794b'],
 'tests/clinical-review-navigation-preservation.test.mjs':['e6c7c60f522877d6954e5bbb901ec24663f52d56a704768d47205d485183eaed','d858b5521eba4d436198a0f3a585153bcafaa717e011a98149014f67a0cc4d48'],
 'tests/head-epoch-projections.test.mjs':['1f3e7db99b473eb0fd8bdda7bc283ed4a0971a8f3b0888202fc40cd40ca7ac61','47130af0e55544dfa58a8abdace6597a13c245be2790fabf4749b29aae7da7cc'],
 'tests/head-epoch-projections.mjs':['c4e93356fdd99e3228bcb2e69e9bd7f23e74cdb3dc577e5c88b491070246cf67','da9152112e2a8909bb5e6b229e05072920dba6a3ed104c92d5aa6584f93e9af5'],
};
for(const [p,[before,after]]of Object.entries(changes)){assert.equal(hash(parent.website+'/'+p),before);assert.equal(hash(proposal+'/'+p),after);}
assert(!fs.existsSync(site));
for(const row of parent.sourceRows){assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(parent.website+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);}
for(const p of Object.keys(changes))fs.copyFileSync(proposal+'/'+p,site+'/'+p);
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp',{recursive:true});
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
fs.writeFileSync(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8'}).trim().replaceAll('\\','/')+'\n',{flag:'wx'});git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const inputs=json(site+'/atlas-review/integration-inputs.json');assert.equal(inputs.sha256,parent.review);for(const row of inputs.inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
for(const row of parent.sourceRows)if(!changes[row.path])assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const source={...parent,schema:'vm-release-partition9-source/1',at:new Date().toISOString(),parent:{path:pin,sha256:hash(pin)},website:site,
 sourceRows:parent.sourceRows.map(row=>changes[row.path]?{path:row.path,sha256:hash(site+'/'+row.path),bytes:fs.statSync(site+'/'+row.path).size}:row),currentChanges:Object.keys(changes),authoredPaths:[...new Set([...parent.authoredPaths,...Object.keys(changes)])],runtimeUnchangedFromParent:true,installed:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(root+'/COMPOSITION.json',JSON.stringify({at:new Date().toISOString(),source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},changed:changes,allProductBytesUnchanged:true,protectedInputsUnchanged:true,installed:false,wholeSuitePassing:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:hash(root+'/SOURCE.json'),sourceRows:source.sourceRows.length,changes:Object.keys(changes),review:source.review}));

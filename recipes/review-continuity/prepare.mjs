import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-review-continuity-ready',site=root+'/website';
const sourcePath='G:/VisibleMedicine-temp/staging/20261031-website-notices-final/SOURCE_BUILD.json';
assert.equal(hash(sourcePath),'f96013bfd51a117839c39a558c74504ed0f3e2d60a1655a394af13aee4806cb4');
const parent=json(sourcePath);assert(!fs.existsSync(site));
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp',{recursive:true});
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
fs.writeFileSync(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/')+'\n',{flag:'wx'});
git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const proposal='G:/VisibleMedicine-temp/proposals/20261031-native-release-inverses',manifest=json(proposal+'/MANIFEST.json');
assert.equal(manifest.candidateSourceSha256,parent.parent.sha256);
for(const r of manifest.files){assert.equal(hash(site+'/'+r.path),r.baseSha256,r.path);assert.equal(hash(proposal+'/website/'+r.path),r.sha256,r.path);fs.copyFileSync(proposal+'/website/'+r.path,site+'/'+r.path);}
const record={at:new Date().toISOString(),parent:{path:sourcePath,sha256:hash(sourcePath)},website:site,atlas:parent.atlas,websiteHead:parent.websiteHead,sourceFiles:parent.sourceRows.length,testProposal:{path:proposal+'/MANIFEST.json',sha256:hash(proposal+'/MANIFEST.json')},changedTestPaths:manifest.files.filter(r=>r.baseSha256!==r.sha256).map(r=>r.path),installed:false,sourceSealed:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({prepared:site,files:record.sourceFiles,changedTests:record.changedTestPaths.length}));

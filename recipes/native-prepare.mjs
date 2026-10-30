import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261029-native-regression-repair',site=root+'/website';
const parentPath='G:/VisibleMedicine-temp/staging/20261029-foot-view-context/SOURCE_CANDIDATE.json',parentSha='6e1d6683f93565475937737d12f0e44c306d28f4f55751de0099bc4c93ce34a2';
assert.equal(hash(parentPath),parentSha);const parent=json(parentPath);
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
assert(!fs.existsSync(site));fs.mkdirSync(site);
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
const git=(...a)=>execFileSync('git',['-C',site,...a],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
write(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/')+'\n');git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const proposals=[['G:/VisibleMedicine-temp/proposals/20261029-native-current-regression',[
 'tests/native-focus-review-binding.test.mjs','tests/native-head-toolbar-compact.test.mjs','tests/native-locate-composed.test.mjs','tests/neonatal-review-input-path.test.mjs','tests/fixtures/native-current-regression-before/current-atlas-delivery-a28.json']],
 ['G:/VisibleMedicine-temp/proposals/20261029-native-historical-regression',['tests/native-slice-commit-scope.test.mjs','tests/native-slice-display-epoch.test.mjs','tests/native-slice-historical-tour-bridge.mjs']]];
const authored=[];
for(const [dir,files]of proposals)for(const p of files){const before=parent.sourceRows.find(r=>r.path===p);if(before)write(root+'/before/'+p,fs.readFileSync(site+'/'+p));fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});fs.copyFileSync(dir+'/'+p,site+'/'+p);authored.push({path:p,beforeSha256:before?.sha256??null,proposalSha256:hash(dir+'/'+p)});}
// The frozen helper's default reads the current-process Atlas environment. Give
// it its receipt-authenticated historical root explicitly; never mutate globals.
const bridge=site+'/tests/native-slice-historical-tour-bridge.mjs';let code=fs.readFileSync(bridge,'utf8');
const replace=(a,b)=>{assert.equal(code.split(a).length,2,a);code=code.replace(a,b);};
replace("import {historicalWebsiteRoot,readHistoricalSource} from './head-study-set-historical-source.mjs';","import {readFileSync} from 'node:fs';\nimport {historicalWebsiteRoot,historicalReceiptPath,validateHistoricalReceiptBytes,readHistoricalSource} from './head-study-set-historical-source.mjs';");
replace('  const historical=await import(',"  const receipt=validateHistoricalReceiptBytes(readFileSync(historicalReceiptPath));\n  assert.equal(receipt.atlasHead,sourceCommit);\n  assert.equal(receipt.atlasTree,'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');\n  const atlasRoot=receipt.atlas;\n  const historical=await import(");
replace('historical.assertCurrentTourSource({sourceCommit});','historical.assertCurrentTourSource({atlasRoot,sourceCommit});');
replace("historical.assertCurrentTourSource({sourceCommit:'9cef", "historical.assertCurrentTourSource({atlasRoot,sourceCommit:'9cef");
fs.writeFileSync(bridge,code);
for(const row of authored){row.sha256=hash(site+'/'+row.path);row.bytes=fs.statSync(site+'/'+row.path).size;if(row.path.endsWith('.mjs'))execFileSync(process.execPath,['--check',site+'/'+row.path],{windowsHide:true,stdio:'pipe'});}
const rows=new Map(parent.sourceRows.map(r=>[r.path,{...r}]));for(const r of authored)rows.set(r.path,{path:r.path,bytes:r.bytes,sha256:r.sha256});
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Parent: '+r.path);if(!authored.some(a=>a.path===r.path))assert.equal(hash(site+'/'+r.path),r.sha256,'Unrelated: '+r.path);}
for(const r of parent.dependencies){assert.equal(hash(r.file),r.sha256);assert.equal(hash(r.entry),r.entrySha256);}
const privateAssetRoot=parent.website+'/.local/foot-review';for(const r of json(site+'/lib/foot-comparison-manifest.json').files)assert.equal(hash(privateAssetRoot+'/'+r.name),r.sha256,r.name);
const source={...parent,schema:'vm-native-regression-repair-source/1',at:new Date().toISOString(),website:site,parent:{path:parentPath,sha256:parentSha},sourceRows:[...rows.values()],sourcePaths:[...rows.keys()],changedPaths:authored.filter(r=>r.beforeSha256).map(r=>r.path),addedPaths:authored.filter(r=>!r.beforeSha256).map(r=>r.path),removedPaths:[],wholeSuitePassing:false,installed:false};
write(root+'/PREPARED.json',{at:source.at,site,parent:source.parent,authored,privateAssetRoot,productBytesIdenticalToParent:true,mainReview:'Explicit receipt-bound historical Atlas root added; no global environment override or theorem weakening.',normalPreviewChanged:false});write(root+'/SOURCE_CANDIDATE.json',source);
console.log(JSON.stringify({site,files:rows.size,authored:authored.length,sourceSha256:hash(root+'/SOURCE_CANDIDATE.json'),testsPending:true}));

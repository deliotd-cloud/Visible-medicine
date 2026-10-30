import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261029-foot-view-context',site=root+'/website',parentFile='G:/VisibleMedicine-temp/staging/20261029-lecture-regression-repair/SOURCE_CANDIDATE.json';
const proposal='G:/VisibleMedicine-temp/proposals/20261029-foot-view-context/website';
assert.equal(hash(parentFile),'fe890a6882d27348c20baddc36563a196476b3ff2ad33f80ccb9cd7dd79b253d');const parent=json(parentFile);
const write=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof b==='string'||Buffer.isBuffer(b)?b:JSON.stringify(b,null,2)+'\n',{flag:'wx'});};
assert(!fs.existsSync(site));fs.mkdirSync(site);for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
const git=(...a)=>execFileSync('git',['-C',site,...a],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');write(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/')+'\n');git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const paths=['scripts/prepare-foot-comparison-local.mjs','tests/foot-view-context.test.mjs','lib/foot-comparison-manifest.json','.local/foot-review/assets.ts'];
for(const p of paths)if(fs.existsSync(site+'/'+p))write(root+'/before/'+p,fs.readFileSync(site+'/'+p));
for(const p of paths.slice(0,2))fs.copyFileSync(proposal+'/'+p,site+'/'+p);
execFileSync(process.execPath,[site+'/'+paths[0]],{cwd:site,windowsHide:true,stdio:'inherit'});git('check-ignore','.local/foot-review/assets.ts','.local/foot-review/model-95.json');
const authored=paths.map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p),beforeSha256:parent.sourceRows.find(r=>r.path===p)?.sha256??null,privateAsset:p.startsWith('.local/')}));
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Parent: '+r.path);if(!paths.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,'Unrelated: '+r.path);}
const old=json(parent.website+'/lib/foot-comparison-manifest.json'),manifest=json(site+'/lib/foot-comparison-manifest.json');assert.notEqual(old.revision,manifest.revision);for(const name of ['model-99.json','model-95.json'])assert.deepEqual(manifest.files.find(r=>r.name===name),old.files.find(r=>r.name===name));
write(root+'/PREPARED.json',{at:new Date().toISOString(),site,parent:{path:parentFile,sha256:hash(parentFile)},authored,privateAssetRoot:site+'/.local/foot-review',geometryBytesUnchanged:true,normalPreviewChanged:false});
console.log(JSON.stringify({site,revision:manifest.revision,authored:authored.length}));

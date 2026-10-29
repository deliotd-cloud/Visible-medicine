import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261029-foot-review-integration',site=root+'/website',proposal='G:/VisibleMedicine-temp/staging/20261029-foot-private-review-proposal';
const parentFile='G:/VisibleMedicine-temp/staging/20261029-partition1-completed/SOURCE_CANDIDATE.json';
const pinned=json('F:/VisibleMedicine/recovery/checkpoints/20261029-partition1-final-replay-started/OBSERVATION.json').source;
assert.equal(hash(parentFile),pinned.sha256);
const parent=json(parentFile),write=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof b==='string'||Buffer.isBuffer(b)?b:JSON.stringify(b,null,2)+'\n',{flag:'wx'});};
assert(!fs.existsSync(root+'/PREPARED.json'));
if(!fs.existsSync(site))fs.mkdirSync(site);
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});if(fs.existsSync(site+'/'+r.path))assert.equal(hash(site+'/'+r.path),r.sha256,'Only unchanged partial preparation may resume');else fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
if(!fs.existsSync(site+'/node_modules'))fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
const git=(...a)=>execFileSync('git',['-C',site,...a],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
// Point at the authoritative object store instead of chaining staged checkouts.
fs.writeFileSync(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/')+'\n');git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const paths=['app/workspace/atlas-review/source-comparisons/foot/page.tsx','app/api/atlas-review/source-comparisons/foot/[asset]/route.ts','lib/foot-comparison-delivery.ts','lib/foot-comparison-manifest.json','scripts/prepare-foot-comparison-local.mjs','tests/foot-comparison.test.ts','tests/foot-comparison-stream-bounds.test.ts','app/workspace/atlas-review/source-comparisons/page.tsx','lib/clinical-review-extra-inbox.ts','lib/clinical-review-inbox-contract.ts'];
const authored=[];
function add(p,bytes,privateAsset=false){const before=parent.sourceRows.find(r=>r.path===p);if(before)write(root+'/before/'+p,fs.readFileSync(site+'/'+p));fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});fs.writeFileSync(site+'/'+p,bytes);authored.push({path:p,bytes:bytes.length,sha256:hash(site+'/'+p),beforeSha256:before?.sha256??null,privateAsset});}
for(const p of paths)add(p,fs.readFileSync(proposal+'/'+p));
add('tests/renal-tour-epoch-admission.test.mjs',fs.readFileSync('G:/VisibleMedicine-temp/staging/20261029-renal-current-test-proposal/tests/renal-tour-epoch-admission.test.mjs'));
let extra=fs.readFileSync(site+'/tests/clinical-review-extra-inbox.test.ts','utf8');
for(const [old,next] of [["item.area!=='regional-learning').length,57","item.area!=='regional-learning').length,58"],['assert.equal(catalog.length,62)','assert.equal(catalog.length,63)'],["item.area==='source-comparisons').length,4","item.area==='source-comparisons').length,5"]]){assert.equal(extra.split(old).length,2);extra=extra.replace(old,next);}
const anchor=" assert.equal(catalog.filter(item=>item.area==='source-comparisons').length,5);";assert.equal(extra.split(anchor).length,2);
extra=extra.replace(anchor,anchor+"\n const foot=catalog.find(item=>item.key==='source:foot');assert(foot);\n assert.equal(foot.capability,'inspection-only');assert.equal(foot.href,'/workspace/atlas-review/source-comparisons/foot');\n assert.equal(foot.revision,JSON.parse(readFileSync('lib/foot-comparison-manifest.json','utf8')).revision);\n assert.equal(await one(catalog,'source:foot',{prepare(){throw Error('Inspection must not access decision storage');}}),'inspection-required');");
add('tests/clinical-review-extra-inbox.test.ts',Buffer.from(extra));
add('.local/foot-review/assets.ts',fs.readFileSync(proposal+'/private-assets/assets.ts'),true);git('check-ignore','.local/foot-review/assets.ts');
const manifest=json(site+'/lib/foot-comparison-manifest.json');for(const r of manifest.files){assert.equal(hash(proposal+'/private-assets/'+r.name),r.sha256,r.name);assert.equal(fs.statSync(proposal+'/private-assets/'+r.name).size,r.bytes);}
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Parent preserved: '+r.path);if(!authored.some(a=>a.path===r.path))assert.equal(hash(site+'/'+r.path),r.sha256,'Undeclared edit: '+r.path);}
write(root+'/PREPARED.json',{at:new Date().toISOString(),parent:{path:parentFile,sha256:hash(parentFile)},site,authored,privateAssetRoot:proposal+'/private-assets',privateAssetModuleIncludedLocallyOnly:true,ownerPreviewChanged:false});
console.log(JSON.stringify({site,authored:authored.length,privateAssets:manifest.files.length}));

// Read-only product admission; writes only create-only scoped local recovery.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/local-cutover/20261021-coherent-ui',stage='F:/VisibleMedicine/staging/20261021-head-review-compact-candidate',site='F:/VisibleMedicine/website',source=stage+'/website';
const verified=json(stage+'/VERIFIED.json'),prep=json(stage+'/PREPARATION.json'),rows=json(verified.sourceSnapshot),pointer=json('CURRENT_CHECKPOINT.json');
assert.equal(sha(read(verified.sourceSnapshot)),verified.sourceSnapshotSha256);assert.equal(rows.length,5479);assert(verified.fullProjectTypesPassed&&verified.fullLocalBuildPassed&&verified.stockReviewPassed);assert.equal(verified.actualNativeCounts.pass,65);assert(!fs.existsSync(root));
const preserved=pointer.activeWork.preservedSourcePaths.map(path=>({path,bytes:read(site+'/'+path).length,sha256:sha(read(site+'/'+path))})),canonicalRows=json(prep.canonicalSnapshot),canonical=new Map([...canonicalRows,...preserved].map(r=>[r.path,r]));
const safe=(base,p)=>{assert(!path.isAbsolute(p)&&!/[\\\x00-\x1f]/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..'));const resolved=path.resolve(base,p);assert(resolved.startsWith(path.resolve(base)+path.sep));let cursor=path.resolve(base);for(const part of p.split('/')){cursor=path.join(cursor,part);if(fs.existsSync(cursor))assert(!fs.lstatSync(cursor).isSymbolicLink(),p);}return resolved;};
for(const row of [...canonicalRows,...preserved])assert.equal(sha(read(safe(site,row.path))),row.sha256,row.path);
for(const row of rows)assert.equal(sha(read(safe(source,row.path))),row.sha256,row.path);
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),verified.source);assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
const oldHelper=read('F:/VisibleMedicine/staging/20261021-review-history-candidate/preimages/lib/clinical-review-navigation-guard.ts');
const intermediate=p=>p==='lib/clinical-review-navigation-guard.ts'?oldHelper:read(source+'/'+p);
const {rebindPlexusNavigation}=await import(pathToFileURL(source+'/scripts/rebind-plexus-review-navigation.mjs'));
const nav=rebindPlexusNavigation(json(site+'/lib/plexus-review-manifest.json'),read(site+'/.local/plexus-review/assets.ts').toString(),p=>read(site+'/'+p),intermediate);
const {rebindPlexusHistory}=await import(pathToFileURL(source+'/scripts/rebind-plexus-review-history.mjs'));
const history=rebindPlexusHistory(nav.packet,nav.moduleText,intermediate,p=>read(source+'/'+p));
assert.equal(sha(JSON.stringify(history.packet,null,2)+'\n'),sha(read(source+'/lib/plexus-review-manifest.json')));assert.equal(sha(history.moduleText),sha(read(source+'/.local/plexus-review/assets.ts')));
assert.equal(history.before.topologyHash,history.after.topologyHash);
const generated=new Set(['atlas-review/integration-inputs.json','atlas-review/manifest.json','atlas-review/content/body-renderer-revision.json','atlas-review/content/review-revisions.json','lib/plexus-review-manifest.json','.local/plexus-review/assets.ts']);
const operations=[],identical=[],preserve=[];
for(const r of rows){const current=safe(site,r.path),exists=fs.existsSync(current),old=exists?read(current):null,beforeSha256=old?sha(old):null;
 if(preserved.some(v=>v.path===r.path)||r.path==='docs/master-plan.md'){preserve.push({path:r.path,sha256:beforeSha256,bytes:old.length});continue;}
 if(beforeSha256===r.sha256){identical.push(r.path);continue;}
 if(exists&&!canonical.has(r.path))assert.equal(r.path,'.local/plexus-review/assets.ts','Unowned differing existing path');
 if(canonical.has(r.path))assert.equal(beforeSha256,canonical.get(r.path).sha256,'Preimage drift');
 operations.push({...r,beforeSha256,beforeBytes:old?.length??null,kind:r.path.startsWith('public/atlas-review-viewer/')?'generated-viewer':generated.has(r.path)?'generated-exact':r.path.startsWith('tests/')?'source-test':'source-product'});
}
const dropped=[...canonical.values()].filter(r=>!rows.some(v=>v.path===r.path));assert.equal(dropped.length,18);assert(dropped.every(r=>/^public\/atlas-review-viewer\/assets\/[^/]+\.js$/.test(r.path)));
const walk=(base,p)=>{const f=safe(base,p),s=fs.lstatSync(f);return s.isDirectory()?fs.readdirSync(f).sort().flatMap(n=>walk(base,p+'/'+n)):[{path:p,bytes:s.size,sha256:sha(read(f))}];};
const viewerBefore=walk(site,'public/atlas-review-viewer'),viewerAfter=walk(source,'public/atlas-review-viewer');assert.equal(viewerBefore.length,47);assert.equal(viewerAfter.length,47);
const untouchedPrivate=['.env.local','.dev.vars','.openai/hosting.json','lib/clinical-review-server.ts','lib/head-atlas-import.ts'].filter(p=>fs.existsSync(safe(site,p))).map(p=>({path:p,sha256:sha(read(safe(site,p)))}));
assert(fs.statfsSync('F:/').bavail*fs.statfsSync('F:/').bsize>2*1024**3);fs.mkdirSync(root,{recursive:true});
const save=(name,value)=>fs.writeFileSync(root+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
for(const r of operations.filter(r=>r.beforeSha256)){const to=safe(root,'preimages/'+r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(safe(site,r.path),to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),r.beforeSha256);}
save('PLAN.json',{at:new Date().toISOString(),root,site,source,stage,sourceSnapshot:verified.sourceSnapshot,sourceSnapshotSha256:verified.sourceSnapshotSha256,canonicalSnapshot:prep.canonicalSnapshot,canonicalSnapshotSha256:prep.canonicalSnapshotSha256,canonicalRows,preserved,sourceRevision:verified.source,reviewBefore:json(site+'/atlas-review/integration-inputs.json').sha256,reviewAfter:verified.review,operations,identical:identical.length,preserve,viewerBefore,viewerAfter,dropped,untouchedPrivate,plexusExactTwoStepPureRebindProved:true,sourceOnlyBackupVerified:json('F:/VisibleMedicine/recovery/checkpoints/20261021-head-review-compact-verified-backup/github-backup.json').sourceBackupVerified,ownerPreviewStopped:false,installed:false});
const previous=json('F:/VisibleMedicine/staging/20261021-review-history-candidate/VERIFIED.json');
const roots=[...new Set([...previous.nativeRoots,...verified.nativeRoots,'tests/studio-workbook-table.test.mjs','tests/studio-workbook-table-preservation.test.mjs'])].filter(p=>fs.existsSync(source+'/'+p));
const fd=fs.openSync(root+'/combined-native.log','wx'),args=['--test','--experimental-strip-types','--test-reporter=tap','--test-concurrency=1',...roots],result=spawnSync(process.execPath,args,{cwd:source,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});fs.closeSync(fd);
const counts={};for(const m of read(root+'/combined-native.log').toString().matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm))counts[m[1]]=Number(m[2]);save('COMBINED_NATIVE.json',{at:new Date().toISOString(),args,code:result.status,counts,logSha256:sha(read(root+'/combined-native.log')),sourceSnapshotSha256:verified.sourceSnapshotSha256});assert.equal(result.status,0);for(const key of ['fail','skipped','cancelled'])assert.equal(counts[key],0);assert(counts.pass>=181);
for(const r of rows)assert.equal(sha(read(safe(source,r.path))),r.sha256,r.path);for(const r of [...canonicalRows,...preserved])assert.equal(sha(read(safe(site,r.path))),r.sha256,r.path);
save('PREPARED.json',{at:new Date().toISOString(),plan:root+'/PLAN.json',planSha256:sha(read(root+'/PLAN.json')),changes:operations.length,preimages:operations.filter(r=>r.beforeSha256).length,nativeCounts:counts,combinedNativeRoots:roots.length,exactPlexusTwoStepPureRebind:true,canonicalUnchanged:true,previewStopped:false,publicDeployment:false});console.log(JSON.stringify({prepared:root+'/PREPARED.json',changes:operations.length,native:counts,canonicalUnchanged:true}));

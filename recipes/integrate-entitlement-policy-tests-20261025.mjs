import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
memoryGate(2048);
const stage='F:/VisibleMedicine/staging/20261025-effective-entitlement-website',oldFile=stage+'/SOURCE_CANDIDATE.json',old=json(oldFile),site=old.website;
assert.equal(hash(oldFile),'8f0da25aa0ce1acbc0c7a6658b5163bbdc4b4592bfe610cfd0da2b29dd6add7c');
for(const r of old.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
const proposals=[['20261025-atlas-access-sql-proposal','c4bc677e9a699bb97f855094fe8fa0e259cba8a65fbc97a5377f21607fc7ed37',[['tests/atlas-delivery-access-sql-source.mjs','40dde351a0558b4f0a746b1a380ac2a6281ee9c9dceff995dd8041e355b7511d'],['tests/atlas-delivery-access-sql.test.mjs','bbb370b38f5c8ad31ac69deef99fae39d3fe4715b6989b6cc7085fcb4d2b1277']]],['20261025-clinical-review-principal-proposal','2dd0d6df77ecd1c853b3a38f70674db60ee27af006f58f33d75446ea737d8b92',[['tests/clinical-review-principal-policy.test.mjs','cf0b40f57a74aa40675926a71d3ce9926b134932f50d35a26953da51cf63ac45']]]];
const rows=new Map(old.sourceRows.map(r=>[r.path,r])),added=[];
for(const [dir,patchHash,files]of proposals){const root='F:/VisibleMedicine/staging/'+dir;assert.equal(hash(root+'/PATCHSET.json'),patchHash);for(const [p,h]of files){assert.equal(hash(root+'/candidate/'+p),h);assert(!fs.existsSync(site+'/'+p));fs.copyFileSync(root+'/candidate/'+p,site+'/'+p,fs.constants.COPYFILE_EXCL);rows.set(p,{path:p,bytes:fs.statSync(site+'/'+p).size,sha256:h});added.push(p);}}
const beforeDir=stage+'/policy-refinement-before';fs.mkdirSync(beforeDir);
for(const p of ['db/platform.ts','tests/platform-effective-entitlements.test.mjs']){fs.mkdirSync(path.dirname(beforeDir+'/'+p),{recursive:true});fs.copyFileSync(site+'/'+p,beforeDir+'/'+p,fs.constants.COPYFILE_EXCL);}
const dbFile=site+'/db/platform.ts';let db=fs.readFileSync(dbFile,'utf8');
for(const field of ['atlas_access','studio_access','reporting_access','embeds_access']){const before='entitlementCurrent && Boolean(entitlement.'+field+')';assert.equal(db.split(before).length,2);db=db.replace(before,'entitlementCurrent && entitlement.'+field+' === 1');}
fs.writeFileSync(dbFile,db);
const testFile=site+'/tests/platform-effective-entitlements.test.mjs';fs.appendFileSync(testFile,`\n\ntest('non-one stored feature values cannot become effective grants',{concurrency:false},async()=>{\n const f=await fixture();try{\n  for(const value of [0,2,-1,'true']){\n   f.sqlite.prepare('UPDATE organization_entitlements SET status=?,valid_until=NULL,atlas_access=?,studio_access=?,reporting_access=?,embeds_access=?').run('active',value,value,value,value);\n   assert.deepEqual(featureFlags(await f.snapshot()),[false,false,false,false],String(value));\n  }\n  f.sqlite.prepare('UPDATE organization_entitlements SET atlas_access=1,studio_access=1,reporting_access=1,embeds_access=1').run();\n  assert.deepEqual(featureFlags(await f.snapshot()),[true,true,true,true]);\n }finally{f.close();}\n});\n`);
for(const p of ['db/platform.ts','tests/platform-effective-entitlements.test.mjs'])rows.set(p,{path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)});
for(const r of rows.values())assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const r of old.dependencies){assert.equal(hash(r.file),r.sha256);assert.equal(hash(r.entry),r.entrySha256);}
const actual=[];function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix+e.name;if(['.git','node_modules','.next','dist','.wrangler'].includes(p))continue;assert(!e.isSymbolicLink(),p);if(e.isDirectory())walk(dir+'/'+e.name,p+'/');else actual.push(p);}}walk(site);assert.deepEqual(actual.sort(),[...rows.keys()].sort());
const file=stage+'/SOURCE_CANDIDATE_V2.json';fs.writeFileSync(file,JSON.stringify({...old,at:new Date().toISOString(),authoringPreimage:oldFile,authoringPreimageSha256:hash(oldFile),sourceRows:[...rows.values()].sort((a,b)=>a.path<b.path?-1:1),sourcePaths:rows.size,addedPaths:[...old.addedPaths,...added],policyRefinement:'Only integer 1 is a declared effective feature, matching protected Atlas SQL; valid 0/1 grants and global staff policy unchanged.',privateStateCopied:false,installed:false},null,2)+'\n',{flag:'wx'});
const index=json('CURRENT_CHECKPOINT.json');index.activeWork.current.pendingEffectiveEntitlements={stage,source:file,sha256:hash(file),phase:'source-candidate-v2',sourcePaths:rows.size,prior59ConsumerCasesPassed:true,workerPolicyCasesPendingMain:true,installed:false,ownerPreviewChanged:false};
const b=Buffer.from(JSON.stringify(index,null,2)+'\n');assert(b.length<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',b);console.log(JSON.stringify({source:file,sha256:hash(file),paths:rows.size,added:added.length}));

import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-native-production';
const result=json(root+'/RESULT.json');assert(result.passing);assert.deepEqual(result.sourceDifferences,[]);assert.equal(hash(result.source.path),result.source.sha256);
const source=json(result.source.path);for(const r of source.sourceRows??source.files)assert.equal(hash(result.site+'/'+r.path),r.sha256,r.path);
const typesPath='F:/VisibleMedicine/recovery/checkpoints/20261029-combined-types-review-verified/native-types/FULL_TYPE_RESULT.json';
assert.equal(hash(typesPath),'a127d78b0e28d116a6ef459f882992adced9be768fbc58ac99337ffafbc4b21c');
const types=json(typesPath);assert.equal(types.diagnosticCount,0);for(const r of types.sourceFiles)assert.equal(hash(r.path),r.sha256,r.path);
const files=[];function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){assert(!e.isSymbolicLink());const p=prefix+e.name;if(e.isDirectory())walk(dir+'/'+e.name,p+'/');else if(e.isFile())files.push({path:p,bytes:fs.statSync(dir+'/'+e.name).size,sha256:hash(dir+'/'+e.name)});else throw Error('Unsupported build entry '+p);}}
walk(result.site+'/dist');files.sort((a,b)=>a.path.localeCompare(b.path));assert(files.length>0);
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
write(root+'/BUILD_ARTIFACTS.json',{root:result.site+'/dist',source:result.source,files,localOnly:true});
write(root+'/BUILD_VERIFIED.json',{at:new Date().toISOString(),source:result.source,result:{path:root+'/RESULT.json',sha256:hash(root+'/RESULT.json')},fullNativeBuildPassed:true,sourceExactAfter:true,typeGraphStillExact:true,types:{path:typesPath,sha256:hash(typesPath)},artifacts:{path:root+'/BUILD_ARTIFACTS.json',sha256:hash(root+'/BUILD_ARTIFACTS.json')},artifactFiles:files.length,artifactBytes:files.reduce((n,r)=>n+r.bytes,0),websiteImportPending:true,installed:false,clinicalApproval:false,ownerPreviewChanged:false});
// A separately staged one-file correction; preserve the sealed website candidate.
const website='G:/VisibleMedicine-temp/staging/20261030-foot-context-layout/website';
const relative='public/media/atlas/NOTICES.md',before=fs.readFileSync(website+'/'+relative,'utf8');assert.equal(hash(website+'/'+relative),'55f0d74ecb7d0a110c901f97e59a3522c9ed27c781f86e6cf65406a264a3c5bd');
const old='also used in the preceding private website. The earlier `3d-preview.png` is\nretained as a legacy capture from private version 61.';
assert.equal(before.split(old).length,2);assert(!fs.existsSync(website+'/public/media/atlas/3d-preview.png'));
const changed=before.replace(old,'also used in the preceding private website. This distribution includes\n`3d-detail-preview.jpg`; the earlier `3d-preview.png` is not included.');
const proposed=root+'/notice-proposal/'+relative;write(proposed,changed);
const manifest=json(website+'/public/media/atlas/manifest.json');assert.equal(manifest.images.length,5);for(const r of manifest.images){const p=website+'/public/media/atlas/'+r.file;assert.equal(hash(p),r.sha256);assert.equal(fs.statSync(p).size,r.bytes);}
for(const [p,expected]of [['public/fonts/geist-mono-latin.woff2','5f3d6ad60f29d6cb708414ec6887163d63bf197377ef5417d2483ff31ace6c3b']])assert.equal(hash(website+'/'+p),expected);
assert.equal(hash(website+'/'+relative),'55f0d74ecb7d0a110c901f97e59a3522c9ed27c781f86e6cf65406a264a3c5bd');
write(root+'/NOTICE_VERIFIED.json',{at:new Date().toISOString(),path:relative,beforeSha256:hash(website+'/'+relative),proposal:{path:proposed,sha256:hash(proposed)},previewManifest:{path:website+'/public/media/atlas/manifest.json',sha256:hash(website+'/public/media/atlas/manifest.json')},previewCount:5,allPreviewSizesAndHashesMatch:true,legacyCaptureAbsent:true,change:'Correct distribution contents; retains attribution and source terms.',integrated:false,originalSourceChanged:false,wholeRightsAuditComplete:false,ownerPreviewChanged:false});
console.log(JSON.stringify({buildPassed:true,artifacts:files.length,bytes:files.reduce((n,r)=>n+r.bytes,0),typeGraphStillExact:true,noticeProposal:proposed,previewsChecked:5}));

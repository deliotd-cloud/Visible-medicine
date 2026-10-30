// Read-only dependency evidence inventory. Declarations are not rights clearance.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const output='G:/VisibleMedicine-temp/staging/20261030-license-evidence';
const roots=[
 {kind:'website',root:'G:/VisibleMedicine-temp/staging/20261030-foot-context-layout/website',receipt:'G:/VisibleMedicine-temp/staging/20261030-foot-context-layout/SOURCE_CANDIDATE.json',sha256:'f8cb985cb50ac1d5a8655554774d102f7e613a0a406b1a2dbeaf31b1eabe8400'},
 {kind:'atlas',root:'G:/VisibleMedicine-temp/staging/20261029-mandible-combined-native/atlas',receipt:'F:/VisibleMedicine/recovery/checkpoints/20261029-mandible-generation-verified/SOURCE_AFTER_GENERATION.json',sha256:'22ad4273725894d769eaa7d76fd21ca2507a9e91b61f1bf393c38e853939fff1'},
];
const reviewedFallbacks=new Map([['@react-three/fiber@9.7.0','LICENSES/clinical-review/react-three-fiber-LICENSE.txt']]);
const reports=[];
for(const spec of roots){
 assert.equal(hash(spec.receipt),spec.sha256);const receipt=json(spec.receipt),lockPath=spec.root+'/package-lock.json',sourceRows=receipt.sourceRows??receipt.files;
 assert(Array.isArray(sourceRows),'Source rows required');const pinned=sourceRows.find(r=>r.path==='package-lock.json');assert(pinned,'Lockfile is not source-bound');assert.equal(hash(lockPath),pinned.sha256);
 const lock=json(lockPath),rows=[];
 for(const [relative,metadata]of Object.entries(lock.packages??{})){
  if(!relative)continue;assert(relative.startsWith('node_modules/')&&!relative.split('/').some(p=>p==='..'));
  const name=metadata.name??relative.replace(/^.*node_modules\//,''),directory=path.resolve(spec.root,relative),file=path.join(directory,'package.json');
  const row={path:relative,name,version:metadata.version??null,declaredLicense:metadata.license??null,developmentOnly:metadata.dev===true,optional:metadata.optional===true,installed:fs.existsSync(file),evidence:[],issues:[]};
  if(!row.installed){if(!row.optional)row.issues.push('non-optional-lock-entry-not-installed');rows.push(row);continue;}
  const pkg=json(file);row.packageJson={path:file,sha256:hash(file)};row.installedName=pkg.name??null;row.installedVersion=pkg.version??null;row.installedLicense=pkg.license??pkg.licenses??null;
  if(pkg.version!==metadata.version)row.issues.push('installed-version-differs-from-lock');if(pkg.name&&pkg.name!==name)row.issues.push('installed-name-differs-from-lock');
  if(metadata.license&&typeof pkg.license==='string'&&metadata.license!==pkg.license)row.issues.push('license-declarations-differ');
  for(const entry of fs.readdirSync(directory,{withFileTypes:true}).filter(e=>/^(licen[cs]e|notice|copying|ofl)([-_.]|$)/i.test(e.name)).sort((a,b)=>a.name.localeCompare(b.name))){
   const evidencePath=path.join(directory,entry.name);if(!entry.isFile()){row.issues.push('notice-directory-requires-review:'+entry.name);continue;}
   row.evidence.push({path:evidencePath,bytes:fs.statSync(evidencePath).size,sha256:hash(evidencePath),kind:'installed-package-file'});
  }
  const fallback=reviewedFallbacks.get(name+'@'+pkg.version);if(!row.evidence.length&&fallback&&fs.existsSync(spec.root+'/'+fallback))row.evidence.push({path:spec.root+'/'+fallback,bytes:fs.statSync(spec.root+'/'+fallback).size,sha256:hash(spec.root+'/'+fallback),kind:'existing-project-fallback-not-independently-cleared-by-this-audit'});
  if(!row.evidence.length)row.issues.push('no-package-root-notice-file-found');if(!row.declaredLicense&&!row.installedLicense)row.issues.push('license-not-declared');
  rows.push(row);
 }
 const expressions={};for(const r of rows){const expression=typeof r.installedLicense==='string'?r.installedLicense:r.declaredLicense??'UNDECLARED';expressions[expression]=(expressions[expression]??0)+1;}
 const report={schema:'vm-dependency-license-evidence/1',at:new Date().toISOString(),kind:spec.kind,root:spec.root,source:{path:spec.receipt,sha256:spec.sha256},lock:{path:lockPath,sha256:hash(lockPath)},scope:'Every non-root package-lock entry; installed package metadata and package-root licence/notice/copying/OFL files, including hyphenated names. No network, installation, execution of dependencies, or project mutation.',limitations:['Lockfile entries include optional packages absent on this operating system.','Installed-package inventory is not an inventory of distributed bundle modules.','A matching declaration/notice does not resolve attribution, source/relinking, asset ownership, downstream licence compatibility or every subdirectory notice obligation.','No clinical, privacy, release or legal clearance is asserted.'],counts:{lockEntries:rows.length,installed:rows.filter(r=>r.installed).length,notInstalled:rows.filter(r=>!r.installed).length,withIssues:rows.filter(r=>r.issues.length).length},expressions,rows};
 fs.writeFileSync(output+'/'+spec.kind+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});reports.push({kind:spec.kind,path:output+'/'+spec.kind+'.json',sha256:hash(output+'/'+spec.kind+'.json'),counts:report.counts,issues:rows.filter(r=>r.issues.length).map(r=>({name:r.name,version:r.version,issues:r.issues})),expressions});
 assert.equal(hash(lockPath),pinned.sha256);
}
fs.writeFileSync(output+'/SUMMARY.json',JSON.stringify({at:new Date().toISOString(),reports,sourceChanged:false,commercialClearance:false,wholeDistributionAuditComplete:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(reports));

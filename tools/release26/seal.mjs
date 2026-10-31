import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release26',site=root+'/website';
const parentPath='G:/VisibleMedicine-temp/staging/20261031-prostate-website/SOURCE.json';
assert.equal(hash(parentPath),'69748f41a0cabd199180be76d6466dd1594921f381357cb4e61c6662b5edfc33');const parent=json(parentPath);
const manifests=[['G:/VisibleMedicine-temp/proposals/20261031-release26-current','MANIFEST_V2.json','8c771760e9cdb0b851fdf6fac8fd1239d7cb647bb8fbf2cbbd842a476c7dcbe4'],['G:/VisibleMedicine-temp/proposals/20261031-release26-history','MANIFEST.json',null]];
const rows=new Map(parent.sourceRows.map(row=>[row.path,row]));const changes=[];
for(const row of rows.values())assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
for(const [dir,name,sha] of manifests){if(sha)assert.equal(hash(dir+'/'+name),sha);const m=json(dir+'/'+name);
 for(const row of m.proposedFiles??m.proposedRows){assert(/^tests\//.test(row.path));assert(!row.path.includes('..'));const old=rows.get(row.path);if(row.baseSha256)assert.equal(old?.sha256,row.baseSha256);const proposed=dir+'/'+row.path;assert.equal(hash(proposed),row.sha256??row.proposedSha256);
  const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(proposed,dest);const next={path:row.path,sha256:hash(dest),bytes:fs.statSync(dest).size};rows.set(row.path,next);changes.push({...next,beforeSha256:old?.sha256??null});
 }
}
for(const row of rows.values())assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const input=json(site+'/atlas-review/integration-inputs.json');for(const row of input.inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const source={schema:'vm-website-test-successor/1',at:new Date().toISOString(),parent:{path:parentPath,sha256:hash(parentPath)},website:site,websiteHead:parent.websiteHead,atlas:parent.atlas,atlasHead:parent.atlasHead,atlasTree:parent.atlasTree,review:parent.review,inputs:input.inputs.length,viewerFiles:json(site+'/public/atlas-review-viewer/manifest.json').files.length,importedSourceFiles:1655,sourceRows:[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path)),currentChanges:changes.map(r=>r.path),changes,historicalEnvironment:parent.historicalEnvironment,productSourceUnchanged:true,installed:false,wholeSuitePassing:false,clinicalDecisionsChanged:false,priorProductBuild:{path:'F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website/VERIFIED.json',sha256:hash('F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-website/VERIFIED.json')}};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({source:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json'),rows:rows.size,changes:changes.length,protectedInputs:input.inputs.length}));

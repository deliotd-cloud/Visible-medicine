import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-coccygeus-tour-native',site=stage+'/atlas',proposal='F:/VisibleMedicine/staging/20261027-coccygeus-tour-proposal';
assert.equal(hash(proposal+'/PROPOSAL.json'),'c24232ed4b1cd46213a3812d793b12aed50db070034b65b43977676cec9dd84d');
const manifest=json(proposal+'/PROPOSAL.json'),recipe=json(proposal+'/REGISTRY_RECIPE.json');
for(const row of manifest.files){
  assert.equal(hash(proposal+'/'+row.path),row.sha256,row.path);
  if(row.path==='REGISTRY_RECIPE.json')continue;
  const to=site+'/'+row.path;assert(!fs.existsSync(to));fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(proposal+'/'+row.path,to,fs.constants.COPYFILE_EXCL);
}
const file=site+'/'+recipe.path;assert.equal(hash(file),recipe.preimageSha256);
const before=fs.readFileSync(file,'utf8');let after=before;
for(const e of recipe.edits){assert.equal(after.split(e.from).length,2);after=after.replace(e.from,e.to);}
let inverse=after;for(const e of [...recipe.edits].reverse()){assert.equal(inverse.split(e.to).length,2);inverse=inverse.replace(e.to,e.from);}assert.equal(inverse,before);
fs.writeFileSync(file,after);assert.equal(hash(file),recipe.proposedSha256);
fs.writeFileSync(stage+'/REGISTRY_INTEGRATION.json',JSON.stringify({at:new Date().toISOString(),proposal:{path:proposal+'/PROPOSAL.json',sha256:hash(proposal+'/PROPOSAL.json')},recipe,exactInverse:true,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({integratedDraftTour:true,steps:4,normalPreviewChanged:false}));

import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-family-main',prior='G:/VisibleMedicine-temp/proposals/20261031-release14-followups-main',proposal='G:/VisibleMedicine-temp/proposals/20261031-release14-venous-successor';
assert.equal(hash(proposal+'/MANIFEST.json'),'84605492f0687939aecc19c93b52b62b16c91ee0a0aaabdecf4330089dbca634');const manifest=json(proposal+'/MANIFEST.json');
const rows=manifest.rows.filter(r=>r.path!=='tests/three-family-successor-proof.mjs').map(r=>({...r,after:{...r.after,path:proposal+'/'+r.path}}));assert.equal(rows.length,4);
fs.writeFileSync(root+'/ADMITTED.json',JSON.stringify({source:manifest.source,proposal:{path:proposal+'/MANIFEST.json',sha256:hash(proposal+'/MANIFEST.json')},rows},null,2)+'\n',{flag:'wx'});
let code=fs.readFileSync(prior+'/integrate-shoulder.mjs','utf8');for(const[a,b]of [
 ["const parentPath='G:/VisibleMedicine-temp/staging/20261031-release14-hand-ready/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release14-shoulder-ready'","const parentPath='G:/VisibleMedicine-temp/staging/20261031-release14-shoulder-ready/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release14-family-ready'"],
 ['bfaf0828c239c0ea21a569e68704b55decb40f5930280d61753132b601143f4a','829a9e18ae29068659bd5bde8f9016daa5680fcb3efecd01fa39913de179498e'],
 ['G:/VisibleMedicine-temp/proposals/20261031-release14-shoulder-successor/MANIFEST.json',root+'/ADMITTED.json'],
 ['vm-release-fourteen-shoulder-successor/1','vm-release-fourteen-family-successor/1']
 ]){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}fs.writeFileSync(root+'/integrate.mjs',code,{flag:'wx'});await import('./integrate.mjs');

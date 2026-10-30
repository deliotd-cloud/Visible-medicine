import fs from 'node:fs';import assert from 'node:assert/strict';
import{hash,json}from'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-quick-review',source=json(root+'/WEBSITE_SOURCE_ACCEPTANCE.json'),delta=json(root+'/BUILD_GENERATED_DELTA.json');
assert(json(root+'/BUILD_RESULT-1.json').passing);assert.equal(delta.length,1);assert.equal(delta[0].path,'.next/types/routes.d.ts');
for(const r of source.sourceRows){const digest=hash(source.website+'/'+r.path);if(r.path===delta[0].path){assert.equal(r.sha256,delta[0].old);assert.equal(digest,delta[0].now);r.sha256=digest;r.bytes=fs.statSync(source.website+'/'+r.path).size;}else assert.equal(digest,r.sha256,r.path);}
source.at=new Date().toISOString();source.preBuildSource={path:root+'/WEBSITE_SOURCE_ACCEPTANCE.json',sha256:hash(root+'/WEBSITE_SOURCE_ACCEPTANCE.json')};source.buildGeneratedChanges=delta;source.changedPaths.push(delta[0].path);
fs.writeFileSync(root+'/WEBSITE_SOURCE_BUILT.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});console.log('Recorded the sole stock-build change: regenerated route type declarations.');

import fs from 'node:fs';import assert from 'node:assert/strict';
const base='G:/VisibleMedicine-temp/proposals/20261031-release23-main/build-head-website.mjs',stage='G:/VisibleMedicine-temp/staging/20261031-head-clear-focus';
const result=JSON.parse(fs.readFileSync(stage+'/website-build-1/RESULT.json'));assert(!result.result.passing);assert(result.result.process.terminalObserved);
const stderr=fs.readFileSync(stage+'/website-build-1/evidence/runner.stderr.log','utf8');assert(stderr.includes('memory allocation'));
let code=fs.readFileSync(base,'utf8');assert.equal(code.split("dir=root+'/website-build-1'").length,2);assert.equal(code.split('heap:1536,aggregate:2048,minimum:4096').length,2);
code=code.replace("dir=root+'/website-build-1'","dir=root+'/website-build-2'").replace('heap:1536,aggregate:2048,minimum:4096','heap:3072,aggregate:3584,minimum:5632');
fs.writeFileSync('G:/VisibleMedicine-temp/proposals/20261031-release23-main/build-head-website-larger.mjs',code,{flag:'wx'});
fs.writeFileSync(stage+'/BUILD_RESOURCE_RETRY.json',JSON.stringify({at:new Date().toISOString(),reason:'Confirmed native allocator failure under 2048MiB aggregate job cap. Retry complete unchanged build at the same bounded resource profile that completed full TypeScript: heap3072, aggregate3584, minimum5632MiB free; existing 2048MiB free floor and90percent commit guard unchanged.',originalResult:stage+'/website-build-1/RESULT.json',ownerApplicationsStopped:false,sourceChanges:false},null,2)+'\n',{flag:'wx'});

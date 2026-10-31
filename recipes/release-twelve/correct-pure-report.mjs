import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition12-repairs',p=root+'/PURE_CHECKS.json',report=json(p);
assert.equal(hash(report.log.path),report.log.sha256);assert.equal(report.exitCode,1);assert.equal(report.passed,false);
const text=fs.readFileSync(report.log.path,'utf8'),counts={};
for(const key of ['tests','pass','fail','cancelled','skipped','todo']){const matches=[...text.matchAll(new RegExp('^ℹ '+key+' (\\d+)\\r?$','gm'))];assert.equal(matches.length,1,key);counts[key]=Number(matches[0][1]);}
assert.deepEqual(counts,{tests:19,pass:18,fail:1,cancelled:0,skipped:0,todo:0});
fs.writeFileSync(root+'/PURE_CHECKS_ADDENDUM.json',JSON.stringify({at:new Date().toISOString(),original:{path:p,sha256:hash(p)},log:report.log,counts,passed:false,exitCode:1,reason:'Original runner used the Node spec reporter; its TAP-only summary parser returned -1. This addendum parses the existing spec log without rerunning tests or changing the recorded failure.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(counts));

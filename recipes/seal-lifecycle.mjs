import fs from 'node:fs';import assert from 'node:assert/strict';
import{hash,json}from'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-head-review-recovery',source=json(root+'/SOURCE.json'),target='tests/head-teaching-review-recovery-lifecycle.test.ts';
for(const r of source.sourceRows)if(r.path!==target)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
const rows=source.sourceRows.map(r=>r.path!==target?r:{path:target,bytes:fs.statSync(source.website+'/'+target).size,sha256:hash(source.website+'/'+target)});
fs.writeFileSync(root+'/SOURCE-2.json',JSON.stringify({...source,at:new Date().toISOString(),sourceRows:rows,additionalChecks:['Strict Mode effect replay','Simultaneous copy isolation','Visible capacity refusal'],previousSource:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')}},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({source:root+'/SOURCE-2.json',sha256:hash(root+'/SOURCE-2.json')}));

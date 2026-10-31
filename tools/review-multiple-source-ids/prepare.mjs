import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const base='G:/VisibleMedicine-temp/staging/20261031-review-quick-status/website';
const root='G:/VisibleMedicine-temp/proposals/20261031-review-multiple-source-ids';
const sha=b=>createHash('sha256').update(b).digest('hex'), read=p=>fs.readFileSync(p);
const write=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});};
const rel='lib/clinical-review-quick-start.ts', before=read(base+'/'+rel).toString();
const from='|| !/^FMA\\d+$/.test(parts[3]) || !parts[4].trim())';
assert.equal(before.split(from).length,2);
const after=before.replace(from,'|| !/^FMA\\d+(?: FMA\\d+)*$/.test(parts[3]) || !parts[4].trim())');
write(root+'/website/'+rel,after);
const tr='tests/clinical-review-quick-start.test.mjs', testBefore=read(base+'/'+tr).toString();
assert(testBefore.includes('const website = root;'));
const testAfter=testBefore.replace('const website = root;', 'const website = process.env.VM_WEBSITE_ROOT ?? root;')
 .replace('readFileSync(`${root}/lib/clinical-review-quick-start.ts`,', 'readFileSync(process.env.VM_QUICK_START_HELPER ?? `${root}/lib/clinical-review-quick-start.ts`,');
assert.notEqual(testAfter,testBefore);
write(root+'/website/'+tr,testAfter+read(root+'/new-cases.mjs').toString());
const rows=[rel,tr].map(p=>({path:p,before:sha(read(base+'/'+p)),after:sha(read(root+'/website/'+p)),bytes:read(root+'/website/'+p).length}));
write(root+'/PROPOSAL.json',JSON.stringify({at:new Date().toISOString(),base,parent:{path:path.dirname(base)+'/SOURCE.json',sha256:sha(read(path.dirname(base)+'/SOURCE.json'))},rows,scope:'Quick review display accepts the existing dedicated-shoulder joined FMA identifier list. Exact keys, destinations, statuses and decision behavior unchanged.',installed:false,dependenciesAdded:false,clinicalApproval:false},null,2)+'\n');
console.log(JSON.stringify({files:rows.length,base,installed:false}));

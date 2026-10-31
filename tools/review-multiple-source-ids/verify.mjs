import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-review-multiple-source-ids';
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex'),ref=p=>({path:p,sha256:sha(read(p))});
const proposal=JSON.parse(read(root+'/PROPOSAL.json')), base=proposal.base;
const source=JSON.parse(read(proposal.parent.path));
assert.equal(sha(read(proposal.parent.path)),proposal.parent.sha256);
const helper='lib/clinical-review-quick-start.ts',test='tests/clinical-review-quick-start.test.mjs';
const relevant=[helper,test,'atlas-review/app/anatomy-data.ts','atlas-review/lib/clinical-review-index.ts'];
const verify=()=>{
 for(const p of relevant)assert.equal(sha(read(base+'/'+p)),source.sourceRows.find(r=>r.path===p).sha256,p);
 for(const row of proposal.rows){assert.equal(sha(read(base+'/'+row.path)),row.before);assert.equal(sha(read(root+'/website/'+row.path)),row.after);}
};verify();
const anatomy=read(base+'/atlas-review/app/anatomy-data.ts').toString();
assert(anatomy.includes("deltoid: ['FMA34680', 'FMA34682', 'FMA34684']"));
assert(read(base+'/atlas-review/lib/clinical-review-index.ts').toString().includes("(s.sourceFmaIds ?? []).join(' ')"));
const oldTests=read(base+'/'+test).toString(),candidateTests=read(root+'/website/'+test).toString();
const originalCases=oldTests.slice(oldTests.indexOf("test('"));
assert(candidateTests.includes(originalCases),'All original test bodies retained byte-for-byte');
assert.equal(read(root+'/website/'+helper).toString().replace('|| !/^FMA\\d+(?: FMA\\d+)*$/.test(parts[3])','|| !/^FMA\\d+$/.test(parts[3])'),read(base+'/'+helper).toString(),'Only dedicated-shoulder display recognizer changed');
const run=(name,helperPath)=>{
 const result=spawnSync(process.execPath,['--max-old-space-size=64','--test','--test-concurrency=1',root+'/website/'+test],{encoding:'utf8',windowsHide:true,maxBuffer:1024*1024,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=64',VM_WEBSITE_ROOT:base,VM_QUICK_START_HELPER:helperPath,TEMP:root,TMP:root}});
 const log=root+'/'+name+'.tap';fs.writeFileSync(log,(result.stdout??'')+(result.stderr??''),{flag:'wx'});
 const counts=Object.fromEntries(['tests','pass','fail','skipped','cancelled','todo'].map(key=>[key,Number((result.stdout??'').match(new RegExp('^# '+key+' (\\d+)','m'))?.[1])]));
 return {status:result.status,signal:result.signal,error:result.error?.message??null,counts,failed:[...(result.stdout??'').matchAll(/^not ok \d+ - (.+)$/gm)].map(m=>m[1]),log:ref(log)};
};
const before=run('BEFORE',base+'/'+helper);verify();const after=run('AFTER',root+'/website/'+helper);verify();
let passed=false,error=null;
try{
 assert.equal(before.status,1);assert.equal(before.counts.fail,2);assert.equal(before.counts.pass,12);
 assert.deepEqual(before.failed,['dedicated shoulder multi-ID source groups have readable labels without losing exact review context','different multi-ID source groups with identical titles remain individually selectable']);
 assert.equal(after.status,0);assert.equal(after.counts.tests,14);assert.equal(after.counts.pass,14);
 for(const r of [before,after]){assert.equal(r.signal,null);assert.equal(r.error,null);for(const key of ['skipped','cancelled','todo'])assert.equal(r.counts[key],0);}
 passed=true;
}catch(e){error=String(e);}
const result={at:new Date().toISOString(),proposal:ref(root+'/PROPOSAL.json'),before,after,passed,error,existingTestBodiesUnchanged:11,currentCatalogEvidence:relevant.slice(2).map(p=>ref(base+'/'+p)),scope:'Display labels only; exact keys, revisions, hrefs, source qualifiers and selection priority retained.',canonicalChanged:false,fullBuild:false,browserVerified:false,installed:false};
fs.writeFileSync(root+'/VERIFICATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed,error,before:before.counts,after:after.counts}));process.exitCode=passed?0:1;

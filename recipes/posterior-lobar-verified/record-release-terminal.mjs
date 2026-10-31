import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition10-final';
const ref=p=>({path:p,sha256:hash(p)}),queue=json(root+'/RELEASE_QUEUE.json');
assert(queue.terminal);assert.equal(queue.source.sha256,'cf3faf8f249686f28885eafe388e1d834608f09e9fd59bda49d133963d19c7a2');assert.equal(hash(queue.source.path),queue.source.sha256);
assert.deepEqual(queue.completed.map(r=>[r.index,r.passing]),[[10,true],[11,false]]);
const partitions=[];
for(const n of [10,11]){
 const result=json(root+'/PARTITION_RESULT-'+n+'.json');assert(result.process.terminalObserved&&result.sourceUnchanged);
 const output=json(root+'/partition-'+n+'/runner.stdout.log').output,receipt=json(output+'/receipt.json');
 const tap=fs.readFileSync(output+'/child.tap','utf8');assert.equal(receipt.counts.cancelled,0);assert.equal(receipt.counts.skipped,0);assert.equal(receipt.counts.todo,0);assert.equal(receipt.testInputDrift,false);
 const blocks=[...tap.matchAll(/^not ok [\s\S]*?(?=^# Subtest:|^1\.\.|$(?![\s\S]))/gm)].map(m=>m[0]);
 const failures=blocks.map(b=>({name:b.split(/\r?\n/)[0],location:b.match(/^  location: (.*)$/m)?.[1]??null,errorExcerpt:(b.match(/^  error: ([\s\S]*?)(?=^  code:|^  stack:|^  operator:|^  name:)/m)?.[1]??b).slice(0,1200)}));
 assert.equal(failures.length,receipt.counts.fail);
 partitions.push({partition:n,passing:result.passing,counts:receipt.counts,result:ref(root+'/PARTITION_RESULT-'+n+'.json'),receipt:ref(output+'/receipt.json'),tap:ref(output+'/child.tap'),failures});
}
const out={at:new Date().toISOString(),source:queue.source,queue:ref(root+'/RELEASE_QUEUE.json'),partitions,fullSuitePassing:false,remainingPartitionsNotRun:true,requiredSeparatePartition:7,installed:false};
const target='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us/RELEASE_FAILURES.json';fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({evidence:ref(target),partitions:partitions.map(({partition,counts})=>({partition,counts}))}));

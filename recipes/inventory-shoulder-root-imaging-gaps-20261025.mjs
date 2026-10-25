import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const root='F:/VisibleMedicine/staging/20261024-combined-atlas/atlas',dir='F:/VisibleMedicine/staging/20261025-shoulder-root-imaging-gap-inventory';assert(!fs.existsSync(dir));
const git=args=>execFileSync('git',['--no-replace-objects','-C',root,...args],{encoding:'utf8',windowsHide:true}).trim();assert.equal(git(['rev-parse','HEAD']),'727ed5b451ae940a01e56272c8fbc703ea3b0095');assert.equal(git(['status','--porcelain']),'');fs.mkdirSync(dir);
const records=[];
for(const topic of ['ultrasound','mri','xray']){
 const result=spawnSync(process.execPath,['--max-old-space-size=256','scripts/report-teaching-gaps.mjs','--region=shoulder-arm','--topic='+topic,'--readiness=pending','--limit=10'],{cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:4*1024*1024});
 fs.writeFileSync(dir+'/'+topic+'.stdout.json',result.stdout??'',{flag:'wx'});fs.writeFileSync(dir+'/'+topic+'.stderr.log',result.stderr??'',{flag:'wx'});assert.equal(result.status,0,result.stderr);assert(!result.signal&&!result.error);const report=JSON.parse(result.stdout);records.push({topic,report:dir+'/'+topic+'.stdout.json',sha256:hash(dir+'/'+topic+'.stdout.json'),keys:Object.keys(report).filter(k=>k!=='rows'),rows:report.rows});
}
assert.equal(git(['status','--porcelain']),'');fs.writeFileSync(dir+'/RESULT.json',JSON.stringify({at:new Date().toISOString(),source:root,head:git(['rev-parse','HEAD']),stockSourceUnchanged:true,records},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:dir+'/RESULT.json',rows:records.map(r=>({topic:r.topic,rows:r.rows,keys:r.keys}))}));

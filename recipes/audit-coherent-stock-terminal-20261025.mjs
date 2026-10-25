import fs from 'node:fs';import assert from 'node:assert/strict';import readline from 'node:readline';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const dir='F:/VisibleMedicine/staging/20261025-coherent-stock-terminal-audit',base='F:/VisibleMedicine/staging/20261025-coherent-stock-runtime-diagnostic';assert(!fs.existsSync(dir));
const terminalFile=base+'/evidence/TERMINAL.json',terminal=json(terminalFile);assert(terminal.process.terminalObserved&&!terminal.process.interrupted);
const receipt=json(terminal.stockReceipt),tapFile=terminal.stockReceipt.replace(/receipt[.]json$/,'child.tap');
const points=[],failures=[],skips=[];let block=null,lineNumber=0;
function close(){if(!block)return;const text=block.lines.join('\n');const match=text.match(/tests[\\/]+([^\\/:]+[.]test[.](?:mjs|ts))/);block.root=match?.[1]??'unlocalized';failures.push(block);block=null;}
for await(const line of readline.createInterface({input:fs.createReadStream(tapFile),crlfDelay:Infinity})){
 lineNumber++;const point=/^(ok|not ok) (\d+)(?:\s|$)/.exec(line);
 if(point){close();points.push(Number(point[2]));if(point[1]==='not ok')block={point:Number(point[2]),line:lineNumber,title:line,lines:[]};if(/#\s*(?:skip|todo)\b/i.test(line))skips.push({line:lineNumber,title:line});}
 else if(block&&block.lines.length<100)block.lines.push(line);
}close();assert.equal(failures.length,terminal.counts.fail);
const groups=new Map();for(const f of failures){const g=groups.get(f.root)??{root:f.root,failures:0,points:[],sampleTitles:[]};g.failures++;g.points.push(f.point);if(g.sampleTitles.length<3)g.sampleTitles.push(f.title);groups.set(f.root,g);}
const duplicatePoints=points.filter((n,i)=>points.indexOf(n)!==i),pointSet=new Set(points),missingPoints=[];for(let i=1;i<=points.length;i++)if(!pointSet.has(i))missingPoints.push(i);
const beforeIndex=json(base+'/evidence/git-context-before.json').find(r=>r.path==='index');
const parent='F:/VisibleMedicine/staging/20261025-viewer-notice-role-website/website';
const env={...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'};
const entries=root=>execFileSync('git',['--no-replace-objects','-C',root,'ls-files','--stage','-z'],{windowsHide:true,env,maxBuffer:32*1024*1024});
const oldEntries=entries(parent),currentEntries=entries(base+'/website');
const indexComparison={beforeIndexSha256:beforeIndex?.sha256,parentIndexSha256:hash(parent+'/.git/index'),afterIndexSha256:hash(base+'/website/.git/index'),originalParentIndexBytesMatch:hash(parent+'/.git/index')===beforeIndex?.sha256,logicalIndexEntriesEqual:oldEntries.equals(currentEntries),logicalEntries:currentEntries.toString().split('\0').filter(Boolean).length};
const report={at:new Date().toISOString(),terminal:{path:terminalFile,sha256:hash(terminalFile)},counts:terminal.counts,entryCount:terminal.entryCount,diagnosticRunTerminated:true,sourceRunCompleteClaim:false,strictOriginalCompleteness:terminal.complete,inputsStableClaim:terminal.inputsStable,sourceAndDependencyFileDriftRecorded:terminal.drift,
 tapAccounting:{topLevelPoints:points.length,declaredFooterCases:terminal.counts.tests,duplicatePoints,missingPoints,skipPoints:skips},
 indexComparison,failureGroups:[...groups.values()].sort((a,b)=>b.failures-a.failures),unclassifiedFailures:failures.filter(f=>f.root==='unlocalized').length,
 interpretation:'Preserve all6692 reported cases,6373pass,316fail,3skip and incomplete original-root accounting. Complete process termination is not passing or complete acceptance. Only independent logical-index equality and original parent index-byte evidence can qualify the observed Git metadata drift; the original terminal is unchanged. Source-role repairs and focused successes are separate source-bound runs, never subtracted from316. All failures need classification; no general no-product-regression claim.',fullSuitePassing:false,clinicalApproval:false,ownerPreviewChanged:false};
fs.mkdirSync(dir);fs.writeFileSync(dir+'/FAILURES.json',JSON.stringify(failures,null,2)+'\n',{flag:'wx'});fs.writeFileSync(dir+'/REPORT.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({report:dir+'/REPORT.json',sha256:hash(dir+'/REPORT.json'),counts:report.counts,failureGroups:report.failureGroups.length,topGroups:report.failureGroups.slice(0,8),tapAccounting:{topLevelPoints:points.length,duplicatePoints,missingPoints},indexComparison}));

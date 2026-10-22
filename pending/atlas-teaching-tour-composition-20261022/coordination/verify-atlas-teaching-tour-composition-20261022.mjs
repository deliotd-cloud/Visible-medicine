import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261022-atlas-teaching-tour-composition';
const candidate=root+'/atlas';
const phase=process.argv[2]??'admission';
const groups={
  admission:[['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-atlas-teaching-tour-composition.mjs']],
  bindings:[['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-atlas-teaching-tour-composition.mjs'],
    ['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-legacy-shoulder-references.mjs']],
  metadata:[['scripts/regional-teaching-snapshots.mjs'],['scripts/generate-body-review-display-pins.mjs'],
    ['scripts/review-revisions.mjs'],['scripts/body-renderer-revisions.mjs'],
    ['scripts/regional-teaching-snapshots.mjs','--check'],['scripts/generate-body-review-display-pins.mjs','--check'],
    ['scripts/review-revisions.mjs','--check'],['scripts/body-renderer-revisions.mjs','--check']],
  'metadata-repair':[['scripts/review-revisions.mjs'],['scripts/body-renderer-revisions.mjs'],
    ['scripts/regional-teaching-snapshots.mjs','--check'],['scripts/generate-body-review-display-pins.mjs','--check'],
    ['scripts/review-revisions.mjs','--check'],['scripts/body-renderer-revisions.mjs','--check']],
  player:[['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-regional-tour-player.mjs']],
  freshness:[['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-regional-teaching-freshness.mjs']],
  final:[['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-atlas-teaching-tour-composition.mjs'],
    ['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-legacy-shoulder-references.mjs'],
    ['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-regional-tour-player.mjs'],
    ['--test','--test-concurrency=1','--test-reporter=tap','scripts/test-regional-teaching-freshness.mjs']],
};
if(!groups[phase])throw Error('Unknown verification phase');
const output=path.join(root,'composition-evidence',phase);fs.mkdirSync(output,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const rows=[];
for(const [index,args] of groups[phase].entries()){
  const log=path.join(output,`${String(index+1).padStart(2,'0')}.log`);
  if(fs.existsSync(log))throw Error('Refuse overwriting evidence: '+log);
  const startedAt=new Date().toISOString();
  const result=spawnSync(process.execPath,['--max-old-space-size=256',...args],{
    cwd:candidate,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=256',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},
    windowsHide:true,encoding:'utf8',maxBuffer:24e6,
  });
  const raw=(result.stdout??'')+(result.stderr??'')+(result.error?'\n'+String(result.error):'');
  fs.writeFileSync(log,raw,{flag:'wx'});
  const row={command:[process.execPath,'--max-old-space-size=256',...args],startedAt,finishedAt:new Date().toISOString(),
    exitCode:result.status,signal:result.signal,log,logSha256:sha(raw)};rows.push(row);console.log(JSON.stringify(row));
  if(result.status!==0){console.log(raw.slice(-9000));break;}
}
const result={schema:'vm.atlas-teaching-tour-composition-checks/1',phase,candidate,checks:rows,
  success:rows.length===groups[phase].length&&rows.every(r=>r.exitCode===0),
  limits:'Focused isolated source/metadata checks only. No full project types/build/browser, clinical, registration, install or public acceptance.'};
fs.writeFileSync(path.join(output,'RESULT.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
if(!result.success)process.exitCode=1;

// Single owned native phase at a time; preserve failed/terminal observations.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import crypto from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-ventricular-landmark-reasoning',root=stage+'/atlas';
const phase=process.argv[2],here=process.cwd();
const phases={
 'baseline-snapshot':{cwd:here,args:[here+'/snapshot-ventricular-reasoning-20261023.mjs','F:/VisibleMedicine/staging/20261023-digital-vein-ultrasound/atlas',stage+'/baseline-snapshot.json']},
 'candidate-snapshot':{cwd:here,args:[here+'/snapshot-ventricular-reasoning-20261023.mjs',root,stage+'/candidate-snapshot.json']},
 'preservation':{cwd:here,args:[here+'/verify-ventricular-reasoning-preservation-20261023.mjs']},
 'types':{cwd:root,args:['scripts/check-ventricular-landmark-types.mjs']},
 'native':{cwd:root,args:['--test','scripts/test-ventricular-landmark-reasoning.mjs']},
 'native-final':{cwd:root,args:['--test','scripts/test-ventricular-landmark-reasoning.mjs']},
 'practice':{cwd:root,args:['scripts/validate-reasoning-practice.mjs']},
 'practice-current':{cwd:root,args:['scripts/validate-reasoning-practice.mjs']},
 'display-pins':{cwd:root,args:['scripts/generate-body-review-display-pins.mjs']},
 'display-check':{cwd:root,args:['scripts/generate-body-review-display-pins.mjs','--check']},
 'regional-check':{cwd:root,args:['scripts/regional-teaching-snapshots.mjs','--check']},
 'source-holds':{cwd:root,args:['scripts/validate-current-source-holds.mjs']},
 'renderer':{cwd:root,args:['scripts/body-renderer-revisions.mjs']},
 'renderer-check':{cwd:root,args:['scripts/body-renderer-revisions.mjs','--check']},
 'source-build':{cwd:root,args:[here+'/build-ventricular-atlas-20261023.mjs']},
 'requirements-audit':{cwd:root,args:['scripts/audit-requirements.mjs']},
 'requirements-check':{cwd:root,args:['scripts/audit-requirements.mjs','--check']},
};assert(Object.hasOwn(phases,phase));const p=phases[phase],dir=stage+'/checks/'+phase;assert(!fs.existsSync(dir));fs.mkdirSync(dir,{recursive:true});
const started={at:new Date().toISOString(),phase,cwd:p.cwd,args:['--max-old-space-size=256',...p.args],previewChanged:false};fs.writeFileSync(dir+'/STARTED.json',JSON.stringify(started,null,2)+'\n',{flag:'wx'});
const out=fs.openSync(dir+'/stdout.log','wx'),err=fs.openSync(dir+'/stderr.log','wx');const r=spawnSync(process.execPath,started.args,{cwd:p.cwd,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=256',RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'},stdio:['ignore',out,err],windowsHide:true});fs.closeSync(out);fs.closeSync(err);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');const terminal={...started,finishedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,stdoutSha256:hash(dir+'/stdout.log'),stderrSha256:hash(dir+'/stderr.log')};fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({phase,exitCode:r.status,evidence:dir}));assert.equal(r.status,0,phase);

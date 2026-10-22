// Preserve every diagnostic run and its exact inputs, including failures.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-imaging-presentation-candidate',prep=json(root+'/PREPARED.json'),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label));
const predecessor=label.startsWith('predecessor-'),site=predecessor?json(prep.previousSource).website:prep.website,evidence=root+'/'+label;assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const tests=label==='predecessor-consumer'?['tests/live-learning-consumer-loader-preservation.test.mjs']:predecessor?['tests/head-history-role-preservation.test.mjs']:['tests/imaging-presentation.test.mjs','tests/local-font-distribution.test.mjs','tests/font-alias-scope.test.mjs','tests/head-open-state.test.ts','tests/head-disclosure-harness-preservation.test.mjs','tests/head-history-role-preservation.test.mjs'];
const inputs=tests.map(p=>({path:p,sha256:sha(read(site+'/'+p))}));fs.writeFileSync(evidence+'/INPUTS.json',JSON.stringify({site,inputs},null,2)+'\n');
const out=fs.createWriteStream(evidence+'/stdout.tap'),err=fs.createWriteStream(evidence+'/stderr.log'),child=spawn(process.execPath,['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests],{cwd:site,env:nativeAtlasEnvironment({atlas:prep.atlas,revision:prep.atlasHead,tree:prep.atlasTree}),windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
const tap=read(out.path).toString(),counts=Object.fromEntries([...tap.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));const result={...outcome,counts,failed:[...tap.matchAll(/^not ok \d+ - (.*)$/gm)].map(m=>m[1]),stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path)),sourceDrift:inputs.filter(r=>sha(read(site+'/'+r.path))!==r.sha256),ownerPreviewChanged:false};fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({evidence,...result}));

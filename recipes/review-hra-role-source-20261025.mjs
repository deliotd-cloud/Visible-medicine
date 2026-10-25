import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const root='F:/VisibleMedicine/staging/20261025-hra-context-role-proposal',file=root+'/tests/hra-context-roles.mjs',manifest=root+'/PATCHSET.json',before=root+'/MAIN_REVIEW_BEFORE';assert(!fs.existsSync(before));
const patch=json(manifest),workerHelper=patch.added.find(r=>r.path==='tests/hra-context-roles.mjs');assert.equal(hash(file),workerHelper.candidateSha256);fs.mkdirSync(before);fs.copyFileSync(manifest,before+'/PATCHSET.json',fs.constants.COPYFILE_EXCL);fs.copyFileSync(file,before+'/hra-context-roles.mjs',fs.constants.COPYFILE_EXCL);
let source=fs.readFileSync(file,'utf8');function replace(a,b){assert.equal(source.split(a).length-1,1,a);source=source.replace(a,b);}
replace("  const env = {};\n  for (const name of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','TEMP','TMP','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])\n    if (process.env[name] !== undefined) env[name] = process.env[name];\n  return {...env, NODE_OPTIONS:'--max-old-space-size=256', GIT_NO_REPLACE_OBJECTS:'1', GIT_OPTIONAL_LOCKS:'0', ATLAS_SOURCE_REPO:native};", "  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>\n    /^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(key)));\n  return {...env, NODE_OPTIONS:'--max-old-space-size=256', GOMEMLIMIT:'64MiB', GOMAXPROCS:'1',\n    RAYON_NUM_THREADS:'1', GIT_NO_REPLACE_OBJECTS:'1', GIT_OPTIONAL_LOCKS:'0', ATLAS_SOURCE_REPO:native};");
replace('function completeTap(stdout, result) {','export function assertCompleteHraTap(stdout, result) {');replace("completeTap(fs.readFileSync(path.join(dir,'child.tap'),'utf8'),result)","assertCompleteHraTap(fs.readFileSync(path.join(dir,'child.tap'),'utf8'),result)");
fs.writeFileSync(file,source);workerHelper.candidateSha256=hash(file);workerHelper.bytes=fs.statSync(file).size;
const integrity='tests/hra-context-role-integrity.test.mjs';assert(!fs.existsSync(root+'/'+integrity));
fs.writeFileSync(root+'/'+integrity,`import assert from 'node:assert/strict';
import test from 'node:test';
import {assertCompleteHraTap} from './hra-context-roles.mjs';
const valid='TAP version 13\\nok 1 - original first case\\nok 2 - original second case\\n1..2\\n# tests 2\\n# pass 2\\n# fail 0\\n# cancelled 0\\n# skipped 0\\n# todo 0\\n';
test('mandatory HRA historical children reject failed, incomplete or contradictory transport',()=>{
  const result={code:0,signal:null};assert.doesNotThrow(()=>assertCompleteHraTap(valid,result));
  for(const bad of [{code:1,signal:null},{code:0,signal:'SIGTERM'},{code:0,signal:null,error:'start failed'}])
    assert.throws(()=>assertCompleteHraTap(valid,bad));
  for(const text of [valid.replace('TAP version 13\\n',''),valid+'TAP version 13\\n',valid.replace('1..2\\n',''),
    valid+'1..2\\n',valid.replace('1..2\\n','1..1\\n'),valid.replace('ok 2 - original second case\\n',''),
    valid.replace('ok 2','not ok 2'),valid.replace('ok 2','ok 1'),valid.replace('# pass 2','# pass 1'),
    valid+'# pass 2\\n',valid.replace('# todo 0\\n',''),valid.replace('# skipped 0','# skipped 1'),
    valid.replace('# todo 0','# todo 1'),valid.replace('ok 2 - original second case','ok 2 - original second case # SKIP'),
    valid+'    not ok 1 - hidden nested failure\\n',valid+'    ok 1 - hidden nested point\\n',valid+'Bail out! stopped\\n',
    valid.replace('# pass 2\\n','').replace('1..2\\n','# pass 2\\n1..2\\n')])
    assert.throws(()=>assertCompleteHraTap(text,result));
});
`,{flag:'wx'});
patch.added.push({path:integrity,candidateSha256:hash(root+'/'+integrity),bytes:fs.statSync(root+'/'+integrity).size});patch.mainReview={priorPatchsetSha256:hash(before+'/PATCHSET.json'),historicalChildResourceBound:'Whitelist actual Windows environment names case-insensitively;256MiB Node,64MiB Go,single thread; preserve all original assertions.',transportIntegrity:'New1case exercises actual live parser with process/TAP corruption; no fabricated child success or fixture replacement.',runtimePending:true};patch.planned.parentRoots=3;patch.planned.parentCases=9;
fs.writeFileSync(manifest,JSON.stringify(patch,null,2)+'\n');console.log(JSON.stringify({patchset:manifest,sha256:hash(manifest),wholeParentRoots:3,parentCases:9,mandatoryOriginals:[2,2]}));

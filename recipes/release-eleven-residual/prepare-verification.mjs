import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const original='G:/VisibleMedicine-temp/proposals/20261031-resumable-release';
const stage='G:/VisibleMedicine-temp/staging/20261031-release-partition11-final',root=stage+'/verification';
const source=stage+'/SOURCE.json',expected='c0c16e3aeee38b41e1796237be9c8d0bc24ad651965803b4913d0996c9c6b75c';
assert.equal(hash(source),expected);assert(!fs.existsSync(root));
const plan=json(original+'/PLAN.json');
for(const p of ['runner.mjs','runner.test.mjs','run-release.mjs','guarded-step.mjs'])assert.equal(hash(original+'/'+p),plan.codeFiles.find(r=>r.path===original+'/'+p).sha256,p);
fs.mkdirSync(root);for(const p of ['runner.mjs','runner.test.mjs','guarded-step.mjs'])fs.copyFileSync(original+'/'+p,root+'/'+p,fs.constants.COPYFILE_EXCL);
let text=fs.readFileSync(original+'/run-release.mjs','utf8');
const replacements=[
 [original,root],['G:/VisibleMedicine-temp/staging/20261031-release-partition11-repairs',stage],
 ['79f451df9dde58cd70a72eb6560d05fd74f8b421897405bd4ae82e6756304bb4',expected],
 ['tests/head-teaching-review-recovery-lifecycle.test.ts tests/native-head-toolbar-compact.test.mjs tests/complete-release-five-followups-preservation.test.mjs tests/atlas-body-learning-component.test.mjs','tests/clinical-review-femoral-arterial-xray.test.ts tests/head-filtered-layout.test.mjs tests/complete-release-followup-preservation.test.mjs tests/complete-release-five-followups-preservation.test.mjs'],
];
for(const [before,after]of replacements){assert.equal(text.split(before).length,2);text=text.replace(before,after);}
fs.writeFileSync(root+'/run-release.mjs',text,{flag:'wx'});
execFileSync(process.execPath,['--max-old-space-size=64','--check',root+'/run-release.mjs'],{windowsHide:true,stdio:'pipe'});
const out=execFileSync(process.execPath,['--max-old-space-size=128',root+'/run-release.mjs','--seal'],{windowsHide:true,encoding:'utf8'});
fs.writeFileSync(root+'/ADAPTER_DERIVATION.json',JSON.stringify({parentPlan:{path:original+'/PLAN.json',sha256:hash(original+'/PLAN.json')},newPlan:{path:root+'/PLAN.json',sha256:hash(root+'/PLAN.json')},changes:'Only stage/root/source and the focused test command changed; controller, child adapter and resource guards unchanged.',replacements},null,2)+'\n',{flag:'wx'});
console.log(out.trim());

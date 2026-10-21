import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-source190-cutover-inventory';
const source='F:/VisibleMedicine/staging/20261021-source190-website/website';
const target='F:/VisibleMedicine/website';
assert(!fs.existsSync(stage));
assert.equal(runGit(['-C',target,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const inputs=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');assert.equal(inputs.length,5107);
const coordination=new Set(['docs/master-plan.md','docs/completion-checklist.json','docs/completion-checklist.md']);
const localConfiguration=new Set(['.codex/config.toml','.openai/hosting.json','AGENTS.md','.gitignore']);
const rows=[];
for(const row of inputs){
 const p=row.path;assert(!path.isAbsolute(p)&&!p.includes('\\')&&p.split('/').every(s=>s&&s!=='.'&&s!=='..'));
 const bytes=read(source+'/'+p);assert.equal(sha(bytes),row.sha256,p);
 const file=target+'/'+p,exists=fs.existsSync(file);let beforeSha256=null,eolOnly=false;
 if(exists){const s=fs.lstatSync(file);assert(s.isFile()&&!s.isSymbolicLink(),p);const before=read(file);beforeSha256=sha(before);
  eolOnly=beforeSha256!==row.sha256&&before.toString().replaceAll('\r\n','\n')===bytes.toString().replaceAll('\r\n','\n');}
 const changed=beforeSha256!==row.sha256;
 const disposition=!changed?'identical':coordination.has(p)?'preserve-canonical-coordination':localConfiguration.has(p)?'preserve-local-configuration':eolOnly?'preserve-line-ending-only':'requires-exact-preimage-admission';
 rows.push({path:p,beforeSha256,proposedSha256:row.sha256,proposedBytes:bytes.length,exists,eolOnly,disposition});
}
const a=json(source+'/lib/atlas-model-inventory.json'),b=json(target+'/lib/atlas-model-inventory.json');
assert.equal(a.models.length,137);assert.equal(b.models.length,137);
const modelIdentityUnchanged=sha(JSON.stringify(a.models))===sha(JSON.stringify(b.models));assert(modelIdentityUnchanged);
const counts={};for(const r of rows)counts[r.disposition]=(counts[r.disposition]??0)+1;
const changed=rows.filter(r=>r.disposition==='requires-exact-preimage-admission');
const directories={};for(const r of changed){const dir=r.path.split('/')[0];directories[dir]=(directories[dir]??0)+1;}
fs.mkdirSync(stage);
fs.writeFileSync(stage+'/NAMED_PATHS.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
const result={at:new Date().toISOString(),source,target,namedInputs:5107,counts,changeDirectories:directories,
 additions:changed.filter(r=>!r.exists).length,existingChanges:changed.filter(r=>r.exists).length,
 unchangedModelObjects:137,modelIdentityUnchanged,namedPathPlanSha256:sha(read(stage+'/NAMED_PATHS.json')),
 policy:'Read-only inventory, NOT approval to overwrite. Guard exact current preimages again at any future local cutover; compare against known prior owned source before replacing overlapping dirty work. Preserve current coordination, configuration, all unlisted paths and private state. No material file deletion, Git reset/clean or raw-repo push.',
 excludes:'No environment, database, scan, mask, private decision, geometry, node_modules or Git ancestry copied. No candidate/canonical edits or preview restart.',
 fullSuiteStatus:'still pending; read actual native receipt, do not infer acceptance from this inventory',
 candidateChanged:false,canonicalChanged:false,canonicalInstalled:false,publicDeployment:false,privateDataUploaded:false};
fs.writeFileSync(stage+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));

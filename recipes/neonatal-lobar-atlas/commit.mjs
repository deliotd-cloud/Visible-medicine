import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-neonatal-lobar-atlas',source=json(root+'/SOURCE.json'),site=source.site;
const git=(cwd,...args)=>execFileSync('git',['-C',cwd,...args],{encoding:'utf8',windowsHide:true,maxBuffer:4e6}).trim();
assert.equal(hash(root+'/SOURCE.json'),'033254f1c84c902e4af28169119e5355b27f239d6f2260dfc87676475e633bc7');
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256);
assert.equal(git(site,'rev-parse','HEAD'),source.base.head);
for(const key of ['user.name','user.email'])git(site,'config',key,git('F:/VisibleMedicine/atlas','config',key));
git(site,'switch','-c','codex/neonatal-lobar-ultrasound-20261031');
git(site,'add','--',...source.changes.map(r=>r.path));
assert.deepEqual(git(site,'diff','--cached','--name-only').split(/\r?\n/).sort(),source.changes.map(r=>r.path).sort());
git(site,'commit','-m','Add source-bound neonatal lobar ultrasound teaching drafts');
assert.equal(git(site,'status','--porcelain'),'');
assert.equal(git('F:/VisibleMedicine/atlas','rev-parse','HEAD'),source.base.head);
assert.equal(git('F:/VisibleMedicine/atlas','status','--porcelain'),'');
for(const row of source.sourceRows)assert.equal(hash(site+'/'+row.path),row.sha256);
const out={at:new Date().toISOString(),source:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')},site,
 branch:git(site,'branch','--show-current'),head:git(site,'rev-parse','HEAD'),tree:git(site,'rev-parse','HEAD^{tree}'),parent:git(site,'rev-parse','HEAD^'),
 changed:source.changes,workingTreeClean:true,canonicalUnchanged:true,websiteImported:false,installed:false,clinicalApproval:false};
fs.writeFileSync(root+'/COMMIT.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({head:out.head,tree:out.tree,changes:out.changed.length,canonicalUnchanged:true}));

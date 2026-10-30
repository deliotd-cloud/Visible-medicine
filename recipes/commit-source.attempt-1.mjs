import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-native-runtime-integration',sourcePath='F:/VisibleMedicine/recovery/checkpoints/20261029-mandible-generation-verified/SOURCE_AFTER_GENERATION.json';
assert.equal(hash(sourcePath),'22ad4273725894d769eaa7d76fd21ca2507a9e91b61f1bf393c38e853939fff1');
const source=json(sourcePath),site=source.atlas,rows=source.sourceRows,expected=new Map(rows.map(r=>[r.path,r]));
const git=(...args)=>execFileSync('git',['--no-replace-objects','-C',site,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0'}});
const write=(p,v)=>fs.writeFileSync(root+'/'+p,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const build='F:/VisibleMedicine/recovery/checkpoints/20261030-native-build-license-evidence/BUILD_VERIFIED.json',proof=json(build);assert(proof.fullNativeBuildPassed&&proof.sourceExactAfter);assert.equal(proof.source.sha256,hash(sourcePath));
function verify(){for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
verify();assert.equal(git('diff','--cached','--name-only').trim(),'','Preserve any prior staged work');
const statuses=git('status','--porcelain=v1','-z','--untracked-files=all').split('\0').filter(Boolean),paths=[];
for(const line of statuses){assert([' M','??'].includes(line.slice(0,2)),'Unexpected change kind: '+line);const p=line.slice(3);assert(expected.has(p),'Unpinned dirty path '+p);assert(!p.includes('\0'));paths.push(p);}
assert(paths.length>0);assert.equal(new Set(paths).size,paths.length);
const oldPublic=json('F:/VisibleMedicine/staging/20261030-spleen-native/SOURCE_CANDIDATE.json').publicRows,publicRows=rows.filter(r=>r.path.startsWith('public/'));assert.deepEqual(publicRows,oldPublic,'All source models and public assets unchanged');
const before=git('rev-parse','HEAD').trim();write('COMMIT_BEFORE.json',{at:new Date().toISOString(),site,head:before,paths,source:{path:sourcePath,sha256:hash(sourcePath)},publicAssetFilesUnchanged:publicRows.length});
fs.writeFileSync(root+'/commit-paths.nul',paths.join('\0')+'\0',{flag:'wx'});git('add','--pathspec-from-file='+root+'/commit-paths.nul','--pathspec-file-nul');
assert.deepEqual(git('diff','--cached','--name-only','-z').split('\0').filter(Boolean).sort(),[...paths].sort());
const output=git('-c','user.name=Visible Medicine local checkpoint','-c','user.email=source-backup@users.noreply.github.com','commit','-m','Atlas: quiz feedback and regional teaching drafts');write('commit.stdout.log',output);
assert.equal(git('status','--porcelain').trim(),'');verify();const head=git('rev-parse','HEAD').trim(),tree=git('rev-parse','HEAD^{tree}').trim();assert.notEqual(head,before);
write('SOURCE_COMMITTED.json',{schema:'vm-native-committed-candidate/1',at:new Date().toISOString(),atlas:site,head,tree,parentHead:before,sourceRows:rows,publicRows,originalSource:{path:sourcePath,sha256:hash(sourcePath)},verifiedBuild:{path:build,sha256:hash(build)},buildSourceBytesIdentical:true,commitPaths:paths,localCommitOnly:true,pushed:false,installed:false,clinicalApproval:false});
console.log(JSON.stringify({head,tree,committedPaths:paths.length,sourceFiles:rows.length,publicFiles:publicRows.length,sourceReceiptSha256:hash(root+'/SOURCE_COMMITTED.json')}));

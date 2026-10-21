// Prepare only a small, explicitly named test-proposal tree for native FS/hash proofs.
// This never copies dependencies, private data, model/runtime directories or junctions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const [proposal,stage,guard,countText]=process.argv.slice(2);
for(const p of [proposal,stage])assert(/^F:\/VisibleMedicine\/staging\/20261021-[a-z0-9-]+$/.test(p),'Explicit owned staging roots only');
assert.notEqual(proposal,stage);assert(/^tests\/clinical-[a-z0-9-]+\.test\.mjs$/.test(guard));
const expectedFiles=Number(countText);assert(Number.isSafeInteger(expectedFiles)&&expectedFiles>0&&expectedFiles<=50);
const sourceSite='F:/VisibleMedicine/staging/20261021-source190-website/website';
const atlas='F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const sourceSnapshot='F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json';
assert.equal(sha(read(sourceSnapshot)),'2d3d4544ca39cb357edcf82dcbe414ea0ec77b619df69135fca983a5ece7b5f4');
const frozen=new Map(json(sourceSnapshot).map(row=>[row.path,row.sha256]));
const proposed=[];
function walk(relative){
 const p=proposal+'/'+relative,stat=fs.lstatSync(p);assert(!stat.isSymbolicLink(),relative);
 if(stat.isDirectory()){for(const name of fs.readdirSync(p).sort()){assert(!/[\\\x00-\x1f]/.test(name)&&name!=='.'&&name!=='..');walk(relative+'/'+name);}return;}
 assert(stat.isFile()&&/\.(?:mjs|ts|json|raw)$/.test(relative)&&stat.size<200000,relative);
 const bytes=read(p);assert(!bytes.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 const beforeSha256=frozen.get(relative)??null;
 assert.equal(beforeSha256?sha(read(sourceSite+'/'+relative)):fs.existsSync(sourceSite+'/'+relative),beforeSha256??false,relative+': frozen source preimage');
 proposed.push({path:relative,from:p,sha256:sha(bytes),beforeSha256,bytes:bytes.length});
}
walk('tests');assert.equal(proposed.length,expectedFiles);assert(proposed.some(row=>row.path===guard));
const code=read(proposal+'/'+guard).toString();
for(const module of [...code.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match=>match[1]))assert(module.startsWith('node:'),'Pure guard must not import a TS corpus/bundler');
assert(!/\bimport\s*\(|child_process|\besbuild\b|\bspawn\s*\(/.test(code),'This harness does not admit a second heavy job');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);const site=stage+'/native-check';fs.mkdirSync(site);
for(const row of proposed){const to=site+'/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256);}
const prep={stage,site,atlas,sourceSite,proposal,guard,sourceSnapshot,sourceSnapshotSha256:sha(read(sourceSnapshot)),proposed,unchangedExistingTests:[],scope:'Only the named, main-reviewed native FS/hash guard is to be executed. Copied TS subjects are not executed; no dependencies/junctions/build/types/corpus/clinical/browser acceptance or source installation.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,guard,copiedPaths:proposed.length,subjectTestsExecuted:false,sourceInstalled:false}));

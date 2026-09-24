import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {relative,dirname,extname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {hash,snapshot} from './pin-pica-clinical.mjs';
import {build} from 'esbuild';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {unreconciledLowerArterialHistory} from './lower-arterial-imaging-history.mjs';
import {restoreLowerArterialSourceHistory} from './lower-arterial-source-history.mjs';
import record from '../content/lower-arterial-source-history.json' with {type:'json'};
import pins from '../content/lower-arterial-imaging-pins.json' with {type:'json'};
const c=await contentContext();c.display=c.api.bodyDisplayCatalog(c.catalog);
const liveHash=hash(snapshot(c.api,c.display));
const historical=unreconciledLowerArterialHistory({api:c.api,catalog:c.display}),display=historical.bodyDisplayCatalog(c.catalog),restored=restoreLowerArterialSourceHistory(historical,c.catalog,{deferWholeSnapshot:true});
const original=await exactSourceHistoryApi(record.originalCommit),originalDisplay=original.bodyDisplayCatalog(c.catalog);
const reconstructedSource=await exactSourceHistoryApi(record.recordedAtSource);
assert.equal(hash(snapshot(original,originalDisplay)),record.originalSnapshotHash,'Original immutable Git tree');
// Replay the exact transition modules at the recorded commit. Current history
// modules contain later source admissions, so they cannot prove this digest.
const root=fileURLToPath(new URL('../',import.meta.url));
const compiled=await build({stdin:{contents:"export {authoringBeforeLowerArterialImaging} from './scripts/lower-arterial-imaging-history.mjs'",resolveDir:root,loader:'js'},bundle:true,write:false,platform:'node',format:'esm',packages:'external',logLevel:'silent',plugins:[{name:'recorded-history-git-replay',setup(b){
 b.onResolve({filter:/^(\.|@\/)/},args=>{
  if(args.importer.includes('node_modules'))return;
  const stem=args.path.startsWith('@/')?resolve(root,args.path.slice(2)):resolve(args.resolveDir,args.path);
  const path=[stem,stem+'.ts',stem+'.tsx',stem+'.mjs',stem+'.js',stem+'.json',resolve(stem,'index.ts')].find(existsSync);
  assert(path,'Missing recorded source module: '+args.path);
  assert(!relative(root,path).startsWith('..'),'Recorded source escaped repository');
  return {path,namespace:'recorded-git'};
 });
 b.onLoad({filter:/.*/,namespace:'recorded-git'},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');
  return {contents:execFileSync('git',['show',record.recordedAtSource+':'+path],{cwd:root,encoding:'utf8',maxBuffer:16e6}),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
 });
}}]});
await mkdir(join(root,'.local'),{recursive:true});
const replayDir=await mkdtemp(join(root,'.local','lower-arterial-replay-'));
let exactHistory;
try{
 const replayPath=join(replayDir,'recorded-history.mjs');
 await writeFile(replayPath,compiled.outputFiles[0].text);
 exactHistory=await import(pathToFileURL(replayPath).href);
}catch(error){throw Error('Recorded history replay failed: '+error.message);}
finally{await rm(replayDir,{recursive:true,force:true});}
const sourceDisplay=reconstructedSource.bodyDisplayCatalog(c.catalog);
const reconstructedFromTree=exactHistory.authoringBeforeLowerArterialImaging({api:reconstructedSource,catalog:sourceDisplay});
const reconstructedDisplay=reconstructedFromTree.bodyDisplayCatalog(c.catalog);
assert.equal(hash(reconstructedDisplay),record.reconstructedCatalogHash,'Reconstructed immutable Git-tree catalogue');
assert.equal(hash(snapshot(reconstructedFromTree,reconstructedDisplay)),record.reconstructedSnapshotHash,'Reconstructed immutable Git-tree fixture');
assert.deepEqual(restored.bodyDisplayCatalog(c.catalog),originalDisplay);
assert.equal(hash(snapshot(original,originalDisplay)),pins.previousAllLessonsAndRecipesHash);
assert.equal(restoreLowerArterialSourceHistory(restored,c.catalog,{deferWholeSnapshot:true}),restored);
let rejected=0;
const reject=(api,pattern)=>{assert.throws(()=>restoreLowerArterialSourceHistory(api,c.catalog,{deferWholeSnapshot:true}),pattern);rejected++;};
// Wrong geometry/bundle/side and mixed catalogues must not be silently excluded.
for(const mutate of [d=>d.structures[0].bounds.min[0]++,d=>d.structures.pop(),d=>d.bundles[0].sha256='foreign',d=>d.structures.find(s=>record.removedStructures.includes(s.id)).laterality='foreign']){
 const bad=structuredClone(display);mutate(bad);reject({...historical,bodyDisplayCatalog:()=>bad},/Unrecorded source/);
}
const e=record.changes.find(x=>!pins.entries.some(p=>p.identity.id===x.identity.id&&p.topics.includes(x.tab)));
assert(e,'A source-history lesson independent of the arterial topic pin');
for(const [id,tab,lesson] of [[e.identity.id,e.tab,e.previous],[e.identity.id,e.tab,{...e.current,body:'foreign'}],[pins.entries[0].identity.id,'ct',{...historical.bodyLesson(pins.entries[0].identity,'ct'),body:'foreign'}]]){
 reject({...historical,bodyLesson:(s,t)=>s.id===id&&t===tab?structuredClone(lesson):historical.bodyLesson(s,t)},/Unrecorded/);
}
const recipes=structuredClone(historical.dissectionProfiles);recipes['head-neck'].label='foreign';reject({...historical,dissectionProfiles:recipes},/Unrecorded reconstructed/);
const changedOld={...restored,bodyLesson:(s,t)=>s.id===e.identity.id&&t===e.tab?{...restored.bodyLesson(s,t),body:'foreign'}:restored.bodyLesson(s,t)};reject(changedOld,/Unrecorded restored/);
const bad=structuredClone(e.identity);bad.sources[0].sha256='foreign';assert.throws(()=>restored.bodyLesson(bad,e.tab),/Different historical/);rejected++;
const copy=restored.bodyDisplayCatalog(c.catalog);copy.structures.pop();assert.deepEqual(restored.bodyDisplayCatalog(c.catalog),originalDisplay);
const lesson=restored.bodyLesson(e.identity,e.tab);lesson.body='foreign';assert.deepEqual(restored.bodyLesson(e.identity,e.tab),e.previous);
assert.equal(hash(snapshot(c.api,c.display)),liveHash,'Historical test must not mutate current authoring');
assert.deepEqual(JSON.parse(await readFile('content/lower-arterial-imaging-pins.json')),pins);
const report={originalCommit:record.originalCommit,originalFixtureHash:pins.previousAllLessonsAndRecipesHash,originalSourceReplay:true,originalRecords:originalDisplay.structures.length,laterRecordsExcludedOnlyFromHistoricalView:record.removedStructures.length,laterBundlesExcludedOnlyFromHistoricalView:record.removedBundles.length,exactRestoredLessons:record.changes.length,rejectedInvalidStates:rejected,currentTeachingUnchanged:true,immutableFixturesChanged:false,runtimeChanged:false,clinicalApproval:false};
await writeFile('docs/lower-arterial-source-history-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

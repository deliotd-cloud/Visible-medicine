// Test-only reconstruction of the completed abdominal branch imaging milestone.
// No runtime or approval path imports this module; nothing is written to the tree.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {dirname,extname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
import pins from '../content/abdominal-branch-imaging-pins.json' with {type:'json'};
import transition from '../content/abdominal-branch-imaging.transition.json' with {type:'json'};

export const abdominalBranchImagingEpoch='e8350cc87eb019a35148d5cc85af343ab30b4721';
const root=fileURLToPath(new URL('../',import.meta.url));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const authoredText=bytes=>bytes.toString('utf8').replaceAll('\r\n','\n');
const source=(path)=>execFileSync('git',['show',abdominalBranchImagingEpoch+':'+path],{cwd:root,maxBuffer:32e6});
const pathWithinRoot=(absolute)=>{
 const path=relative(root,absolute).replaceAll('\\','/');
 assert(path&&!path.startsWith('../')&&path!=='..'&&!path.startsWith('/')&&!path.includes(':'),'Epoch module outside Atlas checkout');
 return path;
};
const snapshot=(api,catalog)=>({
 body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,api.bodyLesson(s,tab)]))})),
 shoulder:api.structures,recipes:api.dissectionProfiles,
});

/** A Git-frozen API for the old checksum, with all current modules left alone. */
export async function abdominalBranchImagingHistoricalContext(){
 assert.equal(hash(pins),'e174a782378af2b538060a93bb77c1e3189d75e6b144f474dd0c8e0dd2cb69fe');
 assert.equal(hash(transition),'edb6f0714df72f9e6abcdb535df320746c8c4840ae41fe5aeadd547fddb3ff43');
 assert.equal(pins.sourceCommit,'193de0e4273fee3ae69cf3f4402b74b6cde5e118');
 assert.equal(transition.parentCommit,pins.sourceCommit);
 for(const path of ['content/abdominal-branch-imaging-pins.json','content/abdominal-branch-imaging.transition.json'])
  assert.equal(authoredText(await readFile(new URL('../'+path,import.meta.url))),authoredText(source(path)),path+' authored text unchanged since milestone');
 const tools=source('scripts/content-contract-tools.mjs').toString();
 const match=tools.match(/contents:\s*`([\s\S]*?)`,\s*resolveDir:/);
 assert(match,'Recorded content context entry missing');
 const frozenModules=new Set();
 const bundled=await build({stdin:{contents:match[1],resolveDir:root,loader:'ts'},format:'esm',platform:'node',bundle:true,write:false,
  plugins:[{name:'abdominal-branch-epoch-only',setup(api){api.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
   const path=pathWithinRoot(args.path);
   if(path.startsWith('node_modules/'))return;
   const suffix=extname(path);
   assert(['.ts','.tsx','.json','.js','.mjs'].includes(suffix),path);
   frozenModules.add(path);
   return{contents:source(path).toString(),loader:{'.ts':'ts','.tsx':'tsx','.json':'json'}[suffix]||'js',resolveDir:dirname(args.path)};
  });}}]});
 for(const path of ['lib/content-export.ts','app/body-content.ts','lib/abdominal-branch-imaging.ts','content/abdominal-branch-imaging.ts'])
  assert(frozenModules.has(path),'Epoch graph did not freeze '+path);
 assert(frozenModules.size>10,'Historical graph did not traverse Git-backed modules');
 const api=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 const catalog=JSON.parse(source('public/models/bodyparts3d/full-body/catalog.json').toString());
 const display=api.bodyDisplayCatalog(catalog);
 assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);
 assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
 for(const bundle of pins.bundles)assert.deepEqual(display.bundles.find(b=>b.id===bundle.id),bundle);
 const prior=new Map();
 for(const [i,e] of pins.entries.entries()){
  assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);
  assert.deepEqual(api.bodyLesson(e.identity,'anatomy'),e.anatomy);
  assert.equal(transition.entries[i].id,e.identity.id);
  for(const tab of e.topics){
   assert.equal(e.previous[tab].readiness,'pending');
   assert.equal(hash(api.bodyLesson(e.identity,tab)),transition.entries[i].sections[tab],'Unrecorded post-batch topic');
   prior.set(e.identity.id+'|'+tab,{identity:e.identity,lesson:e.previous[tab]});
  }
 }
 assert.equal(prior.size,48);
 const beforeLesson=(s,tab)=>{
  const entry=prior.get(s.id+'|'+tab);if(!entry)return api.bodyLesson(s,tab);
  assert.deepEqual(s,entry.identity,'Historic source identity changed');
  return structuredClone(entry.lesson);
 };
 const before={...api,bodyLesson:beforeLesson,bodyContent(s,tab){const{readiness:_r,...content}=beforeLesson(s,tab);return content;}};
 assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash,'Immutable pre-batch checksum');
 return{api,before,catalog,display,pins,transition,hash,snapshot};
}

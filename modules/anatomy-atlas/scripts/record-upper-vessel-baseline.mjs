// Reproducible authoring evidence only. Ordinary validation uses the committed
// compact record and needs no original source Git history or old checkout.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,access} from 'node:fs/promises';
import {posix,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
import {contentContext} from './content-contract-tools.mjs';
import {upperVesselContentHash as hash} from './upper-vessel-imaging-history.mjs';
import {preInferiorEpigastricProfiles} from './inferior-epigastric-study-history.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const pins=JSON.parse(await readFile(new URL('../content/upper-vessel-imaging-pins.json',import.meta.url)));
const commit=pins.sourceCommit;
assert.equal(commit,'50ac6f326f14e292c6382e518adaeea20169163c');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:20e6});
const entries=new Map(git('ls-tree','-r',commit).trim().split('\n').map(line=>{
  const [meta,path]=line.split('\t');const [mode,type,oid]=meta.split(' ');return[path,{mode,type,oid}];
}));
const loaded=new Map();
function readSnapshot(path){
  const row=entries.get(path);assert(row&&row.mode==='100644'&&row.type==='blob','Only regular tracked snapshot files: '+path);
  assert(!path.split('/').some(p=>p==='..'||p.startsWith('.env')));
  if(!loaded.has(path))loaded.set(path,git('cat-file','blob',row.oid));
  return loaded.get(path);
}
// The historical pure modules may use installed Three.js only when its complete
// pinned dependency lock is unchanged. All application imports come from Git.
assert.equal((await readFile(resolve(root,'package-lock.json'),'utf8')).replaceAll('\r\n','\n'),readSnapshot('package-lock.json').replaceAll('\r\n','\n'));
const compiled=await build({stdin:{contents:`export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'; export {bodyLesson} from './app/body-content.ts'; export {structures} from './app/anatomy-data.ts'; export {dissectionProfiles} from './app/dissection-data.ts';`,resolveDir:root,loader:'ts'},format:'esm',platform:'node',bundle:true,write:false,
  plugins:[{name:'pinned-git-authoring-snapshot',setup(b){
    b.onResolve({filter:/.*/},args=>{
      if(args.path==='three'||args.namespace==='workspace-test')return;
      let path;
      if(args.path.startsWith('@/'))path=args.path.slice(2);
      else if(args.path.startsWith('.'))path=posix.normalize(posix.join(args.namespace==='authoring-git'?posix.dirname(args.importer):'',args.path));
      else throw Error('Unsupported snapshot import: '+args.path);
      assert(!path.startsWith('../')&&!path.includes('\\')&&!path.includes(':'));
      for(const suffix of ['','.ts','.tsx','.json','.js','.mjs','/index.ts','/index.tsx'])if(entries.has(path+suffix))return {path:path+suffix,namespace:'authoring-git'};
      throw Error('Missing snapshot import: '+path);
    });
    b.onLoad({filter:/.*/,namespace:'authoring-git'},args=>({contents:readSnapshot(args.path),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[posix.extname(args.path)]||'js',resolveDir:root}));
  }}]});
const historical=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const old=historical.bodyDisplayCatalog(JSON.parse(readSnapshot('public/models/bodyparts3d/full-body/catalog.json')));
const {api,catalog:raw}=await contentContext(),current=api.bodyDisplayCatalog(raw);
// Use the exact runtime tab order, which is part of this historical checksum.
const orderedHash=hash({body:old.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,historical.bodyLesson(s,t)]))})),shoulder:historical.structures,recipes:historical.dissectionProfiles});
assert.equal(orderedHash,pins.previousAllLessonsAndRecipesHash,'Original committed code must reproduce the original checksum');
const oldIds=new Set(old.structures.map(s=>s.id)),oldBundles=new Set(old.bundles.map(b=>b.id));
const removedStructures=current.structures.filter(s=>!oldIds.has(s.id)).map(s=>s.id),removedBundles=current.bundles.filter(b=>!oldBundles.has(b.id)).map(b=>b.id);
const reconstructed={...current,structures:current.structures.filter(s=>!removedStructures.includes(s.id)),bundles:current.bundles.filter(b=>!removedBundles.includes(b.id))};
assert.deepEqual(reconstructed,old,'No old source record or metadata changed');
assert.deepEqual(preInferiorEpigastricProfiles(api.dissectionProfiles),historical.dissectionProfiles,'Existing exact recipe transitions reproduce original recipes');
const record={sourceCommit:commit,sourceTree:git('rev-parse',commit+'^{tree}').trim(),recordedAgainst:'1ddc0732fd882bf3380310ad6b3f673bf014fb5f',originalWholeCurriculumHash:orderedHash,
  beforeCatalogHash:hash(old),afterCatalogHash:hash(current),beforeSelections:old.structures.length,afterSelections:current.structures.length,removedStructures,removedBundles,
  beforeRecipesHash:hash(historical.dissectionProfiles),afterRecipesHash:hash(api.dissectionProfiles),snapshotInputs:[...loaded.keys()].sort().map(path=>({path,gitBlob:entries.get(path).oid}))};
const path=resolve(root,'content/upper-vessel-baseline-scope.json');
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),record);
else {await assert.rejects(access(path),'Never overwrite historical evidence');await writeFile(path,JSON.stringify(record,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({recordHash:hash(record),originalWholeCurriculumHash:orderedHash,beforeSelections:old.structures.length,afterSelections:current.structures.length,removedStructures:removedStructures.length,removedBundles:removedBundles.length,snapshotInputs:loaded.size,sourceTree:record.sourceTree}));

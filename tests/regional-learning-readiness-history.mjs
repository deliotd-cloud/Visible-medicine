import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';

export const HISTORICAL_REGIONAL_TEACHING='2fd700948dfa10ec6b5a03c4ed4c6ff9443c387e';
const site=fileURLToPath(new URL('../',import.meta.url));
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const fixture=json(new URL('./fixtures/regional-learning-readiness-2fd70094.json',import.meta.url));
assert.equal(sha(JSON.stringify(fixture)),'d6baf49a2c8d90a1dbfd6513c30bbc57def22aaab665de3ab9070824a21427ce','Historical source fixture changed');
assert.equal(fixture.schema,'visible-medicine.test-regional-learning-history/1');
assert.equal(fixture.atlasRevision,HISTORICAL_REGIONAL_TEACHING);
const sourceInputs=new Map();
let replay;

/** Replays original website adapters and the complete imported Atlas text graph.
 * Four minimal wrapper binding fixtures model the recorded epoch; they are NOT
 * claimed to be original full manifests, release/approval or a historical build.
 * No MRI package, binary model, scan, original OBJ or private decision is read.
 */
export function historicalRegionalLearningReview(){
 if(!replay)replay=(async()=>{
  const root=checkedAtlasHistoryRepo(HISTORICAL_REGIONAL_TEACHING);
  const options={windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:64e6};
  const atlasPaths=new Set(execFileSync('git',['-C',root,'ls-tree','-r','--name-only',HISTORICAL_REGIONAL_TEACHING],options).toString().trim().split('\n'));
  const expected=new Map(),archived=new Map();
  for(const file of fixture.sources){
   const bytes=Buffer.from(file.sourceText,'utf8');assert.equal(sha(bytes),file.sha256,'Frozen adapter changed: '+file.path);
   assert(!archived.has(file.path),'Duplicate historical source');archived.set(file.path,{bytes});expected.set(file.path,file.sha256);
  }
  // Binding-only fixtures, not invented source material or clinical approval.
  const fixtures=new Map([
   ['atlas-review/manifest.json',{revision:HISTORICAL_REGIONAL_TEACHING,websiteIntegrationSha256:fixture.websiteReviewIntegration}],
   ...['public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/lower-limb/manifest.json','public/atlas-review-viewer/manifest.json'].map(p=>[p,{sourceCommit:HISTORICAL_REGIONAL_TEACHING,websiteIntegrationSha256:fixture.websiteReviewIntegration}]),
  ]);
  const sourceCache=new Map();
  const textPath=p=>/\.(?:ts|tsx|js|jsx|mjs|json)$/.test(p)&&!/(?:^|\/)(?:\.local|private|node_modules|\.git)(?:\/|$)/.test(p)&&!p.split('/').some(s=>s.startsWith('.env'));
  const checked=p=>{assert(!p.startsWith('../')&&!path.posix.isAbsolute(p)&&textPath(p),'Historical text path escaped scope: '+p);return p;};
  function resolve(input,namespace){
   const candidates=[input,...['.ts','.tsx','.mjs','.js','.json','/index.ts','/index.js'].map(ext=>input+ext)];
   const found=candidates.find(p=>namespace==='atlas-history'?atlasPaths.has(p):fixtures.has(p)||expected.has(p));
   assert(found,'Historical dependency unavailable: '+namespace+':'+input);return checked(found);
  }
  const result=await build({stdin:{contents:"export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue'; export {resolveRegionalLearningReview} from './lib/regional-mri-learning-review';",resolveDir:site,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'exact-regional-readiness-history',setup(api){
   api.onResolve({filter:/.*/},args=>{
    assert(args.path.startsWith('.'),'Unexpected external historical application import: '+args.path);
    const from=args.namespace==='atlas-history'?'atlas-history':'website-history';
    let p=path.posix.normalize(path.posix.join(args.namespace==='file'?'':path.posix.dirname(args.importer),args.path));
    let namespace=from;if(from==='website-history'&&p.startsWith('atlas-review/')&&!fixtures.has(p)){p=p.slice('atlas-review/'.length);namespace='atlas-history';}
    return{path:resolve(p,namespace),namespace};
   });
   api.onLoad({filter:/.*/,namespace:'atlas-history'},args=>{
    let bytes=sourceCache.get(args.path);if(!bytes){bytes=execFileSync('git',['-C',root,'show',HISTORICAL_REGIONAL_TEACHING+':'+args.path],options);sourceCache.set(args.path,bytes);}
    sourceInputs.set('atlas:'+args.path,{origin:'immutable-atlas-git',path:args.path,revision:HISTORICAL_REGIONAL_TEACHING,sha256:sha(bytes)});
    return{contents:bytes.toString('utf8'),loader:args.path.endsWith('.json')?'json':args.path.endsWith('.tsx')?'tsx':args.path.endsWith('.ts')?'ts':'js'};
   });
   api.onLoad({filter:/.*/,namespace:'website-history'},args=>{
    if(fixtures.has(args.path)){const contents=JSON.stringify(fixtures.get(args.path));sourceInputs.set('fixture:'+args.path,{origin:'explicit-binding-fixture-not-original-manifest',path:args.path,sha256:sha(contents)});return{contents,loader:'json'};}
    const saved=archived.get(args.path);assert(saved,'Missing exact historical website adapter: '+args.path);
    const bytes=saved.bytes;assert.equal(sha(bytes),expected.get(args.path),'Historical adapter changed: '+args.path);
    sourceInputs.set('website:'+args.path,{origin:'frozen-website-source',path:args.path,sha256:sha(bytes)});
    return{contents:bytes.toString('utf8'),loader:args.path.endsWith('.json')?'json':args.path.endsWith('.tsx')?'tsx':args.path.endsWith('.ts')?'ts':'js'};
   });
  }}]});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
  const catalogue=await api.buildRegionalMri3dCatalogue({revision:'a'.repeat(64),region:'knee'});
  assert(catalogue?.learning);assert.equal(catalogue.atlasRevision,HISTORICAL_REGIONAL_TEACHING);
  return{api,catalogue};
 })();
 return replay;
}

export function historicalRegionalReadinessEvidence(){return{sourceRevision:HISTORICAL_REGIONAL_TEACHING,sourceInputs:[...sourceInputs.values()],originalCompleteWebsiteOrReleaseReplay:false,bindingOnlyFixtures:4,privateDataRead:false};}

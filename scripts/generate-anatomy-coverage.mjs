import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,dirname,isAbsolute,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCoverageIndex} from './build-anatomy-coverage-index.mjs';
import {createCoverageSource,writeCoverageOutput,hash} from './anatomy-coverage/source-context.mjs';
const site=resolve(fileURLToPath(new URL('../',import.meta.url)));
const producerCode=['scripts/generate-anatomy-coverage.mjs','scripts/build-anatomy-coverage-index.mjs',...['source-context','build-root','build-nested','build-independent','root-producer','nested-producer','independent-producer','reference-producer'].map(n=>'scripts/anatomy-coverage/'+n+'.mjs')];
const producerIdentity=()=>producerCode.map(path=>({path,sha256:hash(readFileSync(resolve(site,path)))}));
const contains=(root,path)=>{const r=relative(root,path);return r===''||(!r.startsWith('..'+sep)&&r!=='..'&&!isAbsolute(r));};
export function parseCoverageGenerationArgs(argv){
 const keys={'--source-root':'sourceRoot','--revision':'revision','--output-root':'outputRoot'},args={};
 for(let i=0;i<argv.length;i+=2){const key=keys[argv[i]];assert(key&&!Object.hasOwn(args,key)&&typeof argv[i+1]==='string'&&!argv[i+1].startsWith('--'),'Unknown, duplicate or incomplete coverage generation option');args[key]=argv[i+1];}
 assert(Object.keys(args).length===3&&isAbsolute(args.sourceRoot)&&isAbsolute(args.outputRoot),'Absolute source and fresh output directory required');assert.match(args.revision,/^[a-f0-9]{40}$/,'Exact source commit required');return {...args,sourceRoot:resolve(args.sourceRoot),outputRoot:resolve(args.outputRoot)};
}
export function generateCoverage(args){
 assert(!contains(site,args.outputRoot)&&!contains(args.sourceRoot,args.outputRoot),'Stage coverage outside website and Atlas source');assert(!existsSync(args.outputRoot),'Coverage candidate directory already exists');
 const parent=dirname(args.outputRoot);assert(lstatSync(parent).isDirectory()&&!lstatSync(parent).isSymbolicLink()&&realpathSync(parent)===resolve(parent),'Regular staging parent required');
 const source=createCoverageSource({...args,output:resolve(args.outputRoot,'index.json')});source.verify();mkdirSync(args.outputRoot);
 try{
  const artifacts=[],receipts=[],producerInputs=producerIdentity();for(const scope of ['root','nested','independent','reference']){
   const output=resolve(args.outputRoot,scope+'.json'),producer=resolve(site,'scripts/anatomy-coverage/'+scope+'-producer.mjs'),startedAt=new Date().toISOString();
   const childArgs=[producer,'--source-root',args.sourceRoot,'--revision',args.revision,'--output',output];
   const r=spawnSync(process.execPath,childArgs,{cwd:site,windowsHide:true,encoding:'utf8',maxBuffer:32e6,env:{...process.env,RAYON_NUM_THREADS:'1',GOMAXPROCS:'2'}});
   const log=resolve(args.outputRoot,scope+'.log');writeFileSync(log,(r.stdout||'')+(r.stderr||'')+(r.error?.message??''),{flag:'wx'});
   assert.deepEqual(producerIdentity(),producerInputs,'Producer implementation changed during replay');
   const receipt={scope,producerSha256:hash(readFileSync(producer)),producerInputs,status:r.status,startedAt,finishedAt:new Date().toISOString(),logSha256:hash(readFileSync(log))};receipts.push(receipt);writeFileSync(resolve(args.outputRoot,scope+'-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});assert.equal(r.status,0,scope+' producer failed; preserve candidate logs');
   const bytes=readFileSync(output),ledger=JSON.parse(bytes);assert.equal(ledger.sourceRevision,args.revision);artifacts.push({scope,path:'docs/anatomy-coverage/'+scope+'.json',sha256:hash(bytes),bytes});
  }
  const index=buildCoverageIndex(artifacts);assert.equal(index.sourceRevision,args.revision);
  for(const[path,digest]of Object.entries(index.evidence.sourceInputs))assert.equal(hash(source.read(path)),digest,'Candidate source closure '+path);
  assert.deepEqual(source.verify(),index.evidence.sourceInputs,'Index must contain the complete verified producer union');
  writeCoverageOutput({...args,output:resolve(args.outputRoot,'index.json')},index);source.verify();
  assert.deepEqual(producerIdentity(),producerInputs,'Producer implementation changed before final receipt');
  const manifest={schema:'vm-coverage-candidate-1',sourceRevision:args.revision,nodeVersion:process.version,sourceArtifacts:artifacts.map(({bytes,...rest})=>rest),indexSha256:hash(readFileSync(resolve(args.outputRoot,'index.json'))),sourceInputs:Object.keys(index.evidence.sourceInputs).length,receipts,producerInputs,canonicalSnapshotsInstalled:false,clinicalApproval:false,patientRegistration:false,remoteReferenceFetched:false,originalModelsOrObjRead:false};
  writeFileSync(resolve(args.outputRoot,'candidate-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});return manifest;
 }finally{source.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=parseCoverageGenerationArgs(process.argv.slice(2)),result=generateCoverage(args);console.log(JSON.stringify({verdict:'pass',source:result.sourceRevision,scopes:result.sourceArtifacts.length,sourceInputs:result.sourceInputs,output:args.outputRoot,installed:false}));
}

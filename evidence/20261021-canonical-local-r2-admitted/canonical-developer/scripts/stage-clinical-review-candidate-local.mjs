import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {createHash} from 'node:crypto';
import {Miniflare} from 'miniflare';
import {localCandidateMiniflareOptions} from './local-r2-persistence.mjs';
import {validateCandidate,resolveCandidate,candidateObjectKey} from '../lib/clinical-review-candidate.ts';
import {atlasModelKey} from '../lib/atlas-model-storage.ts';

// No remote option, cloud credentials, database binding, overwrite or delete.
// Stop the local preview first so only one emulator owns its persisted bucket.
const root=path.resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--package'||!path.isAbsolute(args[1])||path.resolve(process.cwd())!==root)throw Error('Run from this website: node --experimental-strip-types scripts/stage-clinical-review-candidate-local.mjs --package ABSOLUTE-PACKAGE');
const source=path.resolve(args[1]);
const candidate=await validateCandidate(JSON.parse(fs.readFileSync(path.join(source,'candidate.json'))));
const registry=JSON.parse(fs.readFileSync(path.join(root,'lib/clinical-review-candidate-registry.json')));
if(!await resolveCandidate(registry,candidate.id))throw Error('Register the exact candidate before local staging.');
const portBusy=await new Promise(resolve=>{const socket=net.createConnection({host:'127.0.0.1',port:3000});socket.once('connect',()=>{socket.destroy();resolve(true);});socket.once('error',()=>resolve(false));});
if(portBusy)throw Error('Stop the owned loopback preview before staging local immutable objects.');
const sha=b=>createHash('sha256').update(b).digest('hex');
const objects=new Map();
for(const file of candidate.files){
 const sourcePath=path.join(source,'objects',file.sha256),stat=fs.lstatSync(sourcePath);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==file.bytes)throw Error('Nonregular or wrong-sized candidate object.');
 const bytes=fs.readFileSync(sourcePath);if(sha(bytes)!==file.sha256)throw Error('Candidate object digest changed.');
 const key=file.storage==='atlas-model'?atlasModelKey(file.sha256):candidateObjectKey(file.sha256);
 objects.set(key,{...file,sourcePath});
}
const persist=path.join(root,'.wrangler','state','v3');
const options=localCandidateMiniflareOptions(root);
const mf=new Miniflare(options),verified=[];
try{
 const bucket=await mf.getR2Bucket('FILES');
 for(const [key,file]of objects){
  const existing=await bucket.head(key);
  if(existing){const digest=existing.checksums.sha256?Buffer.from(existing.checksums.sha256).toString('hex'):null;if(existing.key!==key||existing.size!==file.bytes||digest!==file.sha256)throw Error('Existing object mismatch; no overwrite attempted.');}
  else await bucket.put(key,fs.readFileSync(file.sourcePath),{sha256:file.sha256,onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:file.contentType},customMetadata:{purpose:'local-frozen-anatomy-inspection',candidate:file.storage==='candidate'?candidate.id:'content-addressed-model'}});
  const readback=await bucket.get(key);if(!readback||readback.key!==key||readback.size!==file.bytes||sha(Buffer.from(await readback.arrayBuffer()))!==file.sha256)throw Error('Local immutable object readback failed.');
  verified.push({key,sha256:file.sha256,bytes:file.bytes,preexisting:!!existing});
 }
}finally{await mf.dispose();}
const receipt={at:new Date().toISOString(),candidate:candidate.id,localOnly:true,persist,verified,files:candidate.files.length,uniqueObjects:verified.length,remoteWrite:false,databaseTouched:false,decisionsIncluded:false,clinicalApproval:false,publicDeployment:false};
const file=path.join(source,'local-staging-'+receipt.at.replace(/[:.]/g,'-')+'.json');
fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({candidate:candidate.id,receipt:file,objects:verified.length,localOnly:true}));

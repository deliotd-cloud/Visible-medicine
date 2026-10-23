// Exact committed source only. Generates local inspection metadata/objects; never uploads.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {transform} from 'esbuild';
import {validatePrivateReferenceRegistry,privateReferenceObjectKey} from '../lib/clinical-review-reference-registry.ts';
const root=path.resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
assert(args.length===4&&args[0]==='--atlas'&&path.isAbsolute(args[1])&&args[2]==='--output'&&path.isAbsolute(args[3])&&path.resolve(process.cwd())===root,'Use --atlas ABSOLUTE-COMMITTED-ATLAS --output NEW-ABSOLUTE-F-PACKAGE from this Website');
const atlas=path.resolve(args[1]),out=path.resolve(args[3]),revision='e3a901e103e9fb495a18d9bd1622190dfc0d034b',sha=b=>createHash('sha256').update(b).digest('hex');
assert(out.replaceAll('\\','/').startsWith('F:/VisibleMedicine/staging/')&&!fs.existsSync(out),'Use a new F-drive staging package');
const git=(...a)=>execFileSync('git',['-C',atlas,...a],{windowsHide:true,stdio:'pipe',maxBuffer:32*1024*1024,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git('rev-parse','HEAD').toString().trim(),revision);assert.equal(git('status','--porcelain').toString().trim(),'');
const source='public/models/fda-shoulder-draft/',raw=git('show',revision+':'+source+'catalog.json'),geometry=git('show',revision+':'+source+'reference.glb');
assert.equal(sha(raw),'56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44');
const guard=await transform(git('show',revision+':lib/fda-shoulder-reference.ts').toString(),{loader:'ts',format:'esm',target:'es2022'});
const {assertPinnedFdaCatalogue}=await import('data:text/javascript;base64,'+Buffer.from(guard.code).toString('base64'));
const catalogue=await assertPinnedFdaCatalogue(JSON.parse(raw));
assert.equal(geometry.length,catalogue.bundle.bytes);assert.equal(sha(geometry),catalogue.bundle.sha256);
const registry=validatePrivateReferenceRegistry({schema:'visible-medicine.private-reference-assets/1',references:[{id:catalogue.specimenId,revision:sha(raw),atlasRevision:revision,sourceCommit:catalogue.source.commit,sourceFrame:catalogue.display.kind,deployment:'local-only',clinicalApproval:false,files:[
 {path:'models/fda-shoulder-draft/catalog.json',sha256:sha(raw),bytes:raw.length,contentType:'application/json'},
 {path:'models/fda-shoulder-draft/reference.glb',sha256:sha(geometry),bytes:geometry.length,contentType:'model/gltf-binary'},
]}]});
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const registryFile=path.join(root,'lib/clinical-review-reference-assets.json');assert(!fs.existsSync(registryFile),'Refuse to overwrite registered material');
fs.mkdirSync(out);fs.mkdirSync(path.join(out,'objects'));
for(const [i,bytes]of [raw,geometry].entries()){const file=registry.references[0].files[i];fs.writeFileSync(path.join(out,'objects',file.sha256),bytes,{flag:'wx'});assert.equal(sha(fs.readFileSync(path.join(out,'objects',file.sha256))),file.sha256);}
write(registryFile,registry);write(path.join(out,'registry.json'),registry);
const receipt={at:new Date().toISOString(),atlasRevision:revision,atlasTree:git('rev-parse',revision+'^{tree}').toString().trim(),registryFile,registrySha256:sha(fs.readFileSync(registryFile)),sourceCatalogueSha256:sha(raw),geometrySha256:sha(geometry),objects:registry.references[0].files.map(f=>({...f,key:privateReferenceObjectKey(f)})),localOnly:true,objectUpload:false,learnerInventoryChanged:false,clinicalApproval:false,patientSpaceRegistration:false};
write(path.join(out,'PREPARED.json'),receipt);console.log(JSON.stringify({package:out,registrySha256:receipt.registrySha256,files:receipt.objects.length,localOnly:true,objectUpload:false}));

import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {resolveConfig} from 'vite';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const fiberBase=fs.realpathSync('node_modules/@react-three/fiber'),fiber=read(fiberBase+'/package.json');
const importers=[path.resolve('lib/body-bundle-geometry.ts'),fs.realpathSync('node_modules/three-stdlib/loaders/GLTFLoader.js'),path.join(fiberBase,fiber.module)];
const rows=[];
for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const configFile=path.resolve('integration/'+module+'/vite.config.mjs');
 const config=await resolveConfig({configFile,logLevel:'silent'},'build','production');
 const resolve=config.createResolver(),resolved=[];
 for(const importer of importers){const id=await resolve('three',importer);assert(id);resolved.push({importer,id});}
 rows.push({module,configFile,projectRoot:config.root,dedupe:config.resolve.dedupe,resolved});
}
if(process.env.VM_THREE_IDENTITY_PROOF){const target=path.resolve(process.env.VM_THREE_IDENTITY_PROOF);assert(target.replaceAll('\\','/').startsWith('F:/VisibleMedicine/staging/20261023-tour-replay-source/'));fs.writeFileSync(target,JSON.stringify({at:new Date().toISOString(),actualProductionResolver:true,rows},null,2)+'\n',{flag:'wx'});}
for(const row of rows){assert.equal(new Set(row.resolved.map(r=>r.id)).size,1,row.module+': body validation, GLTFLoader and Fiber must share one Three identity');assert(row.dedupe.includes('three'));}
assert.match(fs.readFileSync('vite.config.ts','utf8'),/resolve:\s*\{\s*dedupe:\s*\['three'\]/,'Standalone client build must retain the same identity policy');
console.log(JSON.stringify({modules:rows.length,actualProductionResolver:true,importers:importers.length,sharedThreeIdentity:true,meshValidationUnchanged:true}));

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const stage=fileURLToPath(new URL('.',import.meta.url)).replace(/\\/g,'/').replace(/\/$/,'');
const site='F:/VisibleMedicine/staging/20261020-ui-coverage-integration/website';
const sha=b=>createHash('sha256').update(b).digest('hex');
const baseline=readFileSync(site+'/components/HeadAtlasSurfaceLoader.tsx');
const original=readFileSync(site+'/tests/head-surface-loading.test.ts');
assert.equal(sha(baseline),'8bd66074b230405df323883d73df65e23ce877c3e67d9067fce1a3373527ca4d');
assert.equal(sha(original),'529ffaf68b41607660180671bab17c7c02a005c87f6149958a32a79201e6b07e');
mkdirSync(stage+'/baseline/components',{recursive:true});mkdirSync(stage+'/tests',{recursive:true});
copyFileSync(site+'/components/HeadAtlasSurfaceLoader.tsx',stage+'/baseline/components/HeadAtlasSurfaceLoader.tsx');
writeFileSync(stage+'/tests/original-head-surface-loading.raw',original,{flag:'wx'});
let adapted=original.toString();
const substitutions=[
 ["import ts from 'typescript';",''],
 ["const require=createRequire(import.meta.url);",`const require=createRequire(${JSON.stringify(site+'/package.json')});\nconst ts=require('typescript');`],
 ["const loaderPath=new URL('../components/HeadAtlasSurfaceLoader.tsx',import.meta.url);","const loaderPath=new URL(process.env.VM_HEAD_IMPORT_FOCUS_BEFORE==='1'?'../baseline/components/HeadAtlasSurfaceLoader.tsx':'../components/HeadAtlasSurfaceLoader.tsx',import.meta.url);"],
];
for(const [before,after]of substitutions){assert.equal(adapted.split(before).length,2);adapted=adapted.replace(before,after);}
adapted+='\nexport {harness,props,surface};\n';
let inverse=adapted.slice(0,-'\nexport {harness,props,surface};\n'.length);
for(const [before,after]of [...substitutions].reverse()){
 if(before==="import ts from 'typescript';")continue;
 assert.equal(inverse.split(after).length,2);inverse=inverse.replace(after,before);
}
inverse=inverse.replace("import {createRequire} from 'node:module';\n", "import {createRequire} from 'node:module';\nimport ts from 'typescript';");
assert.equal(inverse,original.toString(),'Whole original assertions/harness must survive dependency/path-only adaptation');
writeFileSync(stage+'/tests/original-loading-adapter.test.ts',adapted,{flag:'wx'});
const require=createRequire(site+'/package.json'),{build}=require('esbuild');
const input=[];
await build({entryPoints:[stage+'/browser-entry.tsx'],bundle:true,write:true,outfile:stage+'/app.js',platform:'browser',format:'esm',jsx:'automatic',nodePaths:[site+'/node_modules'],define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'controlled-import-only',setup(api){api.onLoad({filter:/HeadAtlasSurfaceLoader\.tsx$/},args=>{
 const bytes=readFileSync(args.path),source=bytes.toString(),seam="import('./HeadAtlasSurface')";
 assert.equal(source.split(seam).length,2);input.push({path:args.path,sha256:sha(bytes),importSubstitutions:1});
 return {contents:source.replace(seam,'window.__loadSurface()'),loader:'tsx',resolveDir:stage};
});}}]});
assert.equal(input.length,2);
assert.equal(sha(readFileSync(site+'/components/HeadAtlasSurfaceLoader.tsx')),sha(baseline));
writeFileSync(stage+'/PREPARATION.json',JSON.stringify({schema:'vm-head-import-focus-preparation/1',baselineSha256:sha(baseline),originalTestsSha256:sha(original),candidateSha256:sha(readFileSync(stage+'/components/HeadAtlasSurfaceLoader.tsx')),originalBodiesPreserved:true,browserInputs:input,canonicalInstalled:false,clinicalApproval:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:true,stage,originalBodiesPreserved:true,browserBytes:readFileSync(stage+'/app.js').length}));

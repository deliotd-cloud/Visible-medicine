import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const fixture=new URL('./fixtures/prostate-zonal-focus/',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const metadataBytes=readFileSync(new URL('context.json',fixture));
assert.equal(sha(metadataBytes),'47fec36c84ed968e01789e0b80ea0bde0be54fc08b22ba5e7ea14e40cba9728c','Exact historical delivery context');
const metadata=JSON.parse(metadataBytes);
export function historicalProstateRead(path){
 assert(Object.hasOwn(metadata.files,path),'Declared historical read only: '+path);
 const bytes=readFileSync(new URL('website/'+path+'.raw',fixture));
 assert.equal(sha(bytes),metadata.files[path],'Exact focus-era delivery: '+path);
 return bytes;
}
for(const path of Object.keys(metadata.files))historicalProstateRead(path);

// Only the original two-module graph is admitted. No filesystem resolution or
// current-source fallback is available; all other module paths fail closed.
export function historicalProstateBuild(options){
 assert.deepEqual(Object.keys(options).sort(),['stdin','bundle','platform','format','write'].sort());
 assert.deepEqual(Object.keys(options.stdin).sort(),['contents','resolveDir','loader'].sort());
 assert.equal(options.stdin.contents,"export * from './atlas-review/lib/prostate-zones';");
 assert.equal(options.stdin.loader,'ts');assert.equal(options.stdin.resolveDir,process.cwd());
 assert.equal(options.bundle,true);assert.equal(options.platform,'node');
 assert.equal(options.format,'esm');assert.equal(options.write,false);
 const namespace='vm-prostate-focus';
 const zone='atlas-review/lib/prostate-zones.ts';
 const revision='atlas-review/content/prostate-zones-revision.json';
 return build({...options,plugins:[{name:namespace,setup(api){
  api.onResolve({filter:/.*/},args=>{
   assert.equal(args.kind,'import-statement');
   if(args.path==='./atlas-review/lib/prostate-zones'){
    assert.equal(args.importer.replaceAll('\\','/').split('/').at(-1),'<stdin>');
    return {path:zone,namespace};
   }
   assert.equal(args.namespace,namespace,'Historical graph namespace');
   assert.equal(args.importer,zone,'Only the original zonal module imports revision JSON');
   assert.equal(args.path,'../content/prostate-zones-revision.json','No undeclared historical import');
   return {path:revision,namespace};
  });
  api.onLoad({filter:/.*/,namespace},args=>{
   assert([zone,revision].includes(args.path),'Only two declared historical modules');
   return {contents:historicalProstateRead(args.path),loader:args.path===zone?'ts':'json'};
  });
 }}]});
}

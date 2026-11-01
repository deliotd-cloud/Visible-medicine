import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {declarationFor,schemaPaths} from './atlas-catalog-declaration-template.mjs';

const runtimeCatalog='atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json';
const compilerFile=runtimeCatalog.replace(/\.json$/,'.d.json.ts');
const sha=b=>createHash('sha256').update(b).digest('hex');
const within=(root,file)=>{const relative=path.relative(root,file);return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative);};

/** Remove only the generated compiler companion from a completed build copy. */
export function stripAtlasCompilerArtifact({root,output}){
 const project=fs.realpathSync(root),dist=path.resolve(project,'dist'),directory=fs.realpathSync(output);
 assert(within(dist,directory),'Atlas packaging requires a directory below project/dist');
 const target=path.join(directory,compilerFile);
 if(!fs.existsSync(target))return{removed:false,path:compilerFile};
 assert(fs.lstatSync(target).isFile()&&!fs.lstatSync(target).isSymbolicLink(),'Compiler artifact must be a regular file');
 assert(within(directory,fs.realpathSync(target)),'Compiler artifact escaped build output');
 const source=path.join(project,'public',compilerFile),catalog=path.join(project,'public',runtimeCatalog);
 assert(within(project,fs.realpathSync(source))&&within(project,fs.realpathSync(catalog)),'Source escaped website');
 assert(!within(directory,fs.realpathSync(source)),'Source is inside build output');
 const schema=schemaPaths.map(p=>({path:p,sha256:sha(fs.readFileSync(path.join(project,p)))}));
 const expected=declarationFor('public/'+runtimeCatalog,sha(fs.readFileSync(catalog)),sha(JSON.stringify(schema)));
 const original=fs.readFileSync(source),copied=fs.readFileSync(target);assert.equal(original.toString('utf8'),expected,'Stale compiler companion');assert(copied.equals(original),'Build compiler artifact differs from checked source');
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'atlas-runtime/head-neck/manifest.json'),'utf8'));
 assert(!manifest.files.some(row=>row.path===compilerFile.slice('atlas-runtime/head-neck/'.length)),'Compiler companion must not be a runtime manifest asset');
 fs.unlinkSync(target);assert(!fs.existsSync(target));assert(fs.readFileSync(source).equals(original),'Compiler source must remain unchanged');
 return{removed:true,path:compilerFile,sha256:sha(copied)};
}

export function atlasCompilerArtifactPlugin({root=process.cwd()}={}){
 return{name:'atlas-compiler-artifact-packaging',apply:'build',enforce:'post',writeBundle:{order:'post',sequential:true,handler(options){
  if(!options.dir)throw Error('Expected directory output for Atlas packaging');
  stripAtlasCompilerArtifact({root,output:path.resolve(root,options.dir)});
 }}};
}

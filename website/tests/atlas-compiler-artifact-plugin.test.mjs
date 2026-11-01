import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import test from 'node:test';import {createHash} from 'node:crypto';
import {stripAtlasCompilerArtifact,atlasCompilerArtifactPlugin} from '../scripts/atlas-compiler-artifact-plugin.mjs';
import {declarationFor,schemaPaths} from '../scripts/atlas-catalog-declaration-template.mjs';
const tempRoot=fs.realpathSync(os.tmpdir()),scratch=fs.mkdtempSync(path.join(tempRoot,'vm-atlas-packaging-')),sha=b=>createHash('sha256').update(b).digest('hex');let next=0;
test.after(()=>{
  // Delete only this run's fresh synthetic directory, after resolving its full
  // path under the chosen temporary root. Never clean the repository itself.
  const resolved=fs.realpathSync(scratch);
  assert.equal(resolved,path.resolve(scratch));
  assert.equal(path.dirname(resolved),tempRoot);
  assert(path.basename(resolved).startsWith('vm-atlas-packaging-'));
  assert(!fs.lstatSync(scratch).isSymbolicLink());
  fs.rmSync(resolved,{recursive:true,force:false});
});
const catalog='atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json',declaration=catalog.replace(/\.json$/,'.d.json.ts');
function fixture(){const root=path.join(scratch,String(++next)),output=path.join(root,'dist/client');const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);};for(const p of schemaPaths)put(path.join(root,p),'// Synthetic schema '+p+'\n');put(path.join(root,'public',catalog),'{}');const schema=schemaPaths.map(p=>({path:p,sha256:sha(fs.readFileSync(path.join(root,p)))})),expected=declarationFor('public/'+catalog,sha('{}'),sha(JSON.stringify(schema)));put(path.join(root,'public',declaration),expected);put(path.join(output,declaration),expected);put(path.join(output,catalog),'{}');put(path.join(output,'atlas-runtime/head-neck/manifest.json'),JSON.stringify({files:[{path:'models/bodyparts3d/full-body/catalog.json'}]}));put(path.join(output,'atlas-runtime/head-neck/LICENSE'),'Synthetic project notice');return{root,output,source:path.join(root,'public',declaration),target:path.join(output,declaration)};}
test('removes only the build copy while retaining source, catalog, manifest and notices',()=>{const f=fixture(),source=fs.readFileSync(f.source),kept=['atlas-runtime/head-neck/manifest.json','atlas-runtime/head-neck/LICENSE',catalog].map(p=>[p,fs.readFileSync(path.join(f.output,p))]);assert.equal(stripAtlasCompilerArtifact(f).removed,true);assert(!fs.existsSync(f.target));assert(fs.readFileSync(f.source).equals(source));for(const[p,b]of kept)assert(fs.readFileSync(path.join(f.output,p)).equals(b));});
test('output without a copied companion is a safe no-op',()=>{const f=fixture();fs.unlinkSync(f.target);assert.equal(stripAtlasCompilerArtifact(f).removed,false);assert(fs.existsSync(f.source));});
test('a changed build artifact is preserved and fails packaging',()=>{const f=fixture();fs.appendFileSync(f.target,'changed');assert.throws(()=>stripAtlasCompilerArtifact(f),/differs from checked source/);assert(fs.existsSync(f.target));});
test('stale source hash or schema binding is refused',()=>{for(const p of ['public/'+catalog,schemaPaths[0]]){const f=fixture();fs.appendFileSync(path.join(f.root,p),'changed');assert.throws(()=>stripAtlasCompilerArtifact(f),/Stale compiler companion/);assert(fs.existsSync(f.target));}});
test('a declaration represented as a runtime manifest asset is not silently removed',()=>{const f=fixture();fs.writeFileSync(path.join(f.output,'atlas-runtime/head-neck/manifest.json'),JSON.stringify({files:[{path:declaration.slice('atlas-runtime/head-neck/'.length)}]}));assert.throws(()=>stripAtlasCompilerArtifact(f),/must not be a runtime manifest asset/);assert(fs.existsSync(f.target));});
test('source and unrelated output directories cannot be mutation targets',()=>{const f=fixture();for(const output of [f.root,path.join(f.root,'public'),path.dirname(f.root)])assert.throws(()=>stripAtlasCompilerArtifact({...f,output}),/below project\/dist/);assert(fs.existsSync(f.source));assert(fs.existsSync(f.target));});
test('build hook is ordered after output writing and refuses non-directory output',()=>{const f=fixture(),plugin=atlasCompilerArtifactPlugin({root:f.root});assert.equal(plugin.apply,'build');assert.equal(plugin.writeBundle.order,'post');assert.equal(plugin.writeBundle.sequential,true);assert.throws(()=>plugin.writeBundle.handler({file:'bad.js'}),/directory output/);plugin.writeBundle.handler({dir:'dist/client'});assert(!fs.existsSync(f.target));});

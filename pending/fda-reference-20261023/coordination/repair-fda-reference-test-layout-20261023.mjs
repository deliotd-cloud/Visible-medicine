import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261023-fda-shoulder-reference',dir=root+'/atlas/node_modules',saved=root+'/node_modules.shared';
if(fs.existsSync(root+'/atlas/node_modules.shared')){assert(fs.lstatSync(root+'/atlas/node_modules.shared').isSymbolicLink());assert(!fs.existsSync(saved));fs.renameSync(root+'/atlas/node_modules.shared',saved);}
if(fs.lstatSync(dir).isSymbolicLink()){assert(!fs.existsSync(saved));fs.renameSync(dir,saved);fs.mkdirSync(dir);}
assert(fs.lstatSync(saved).isSymbolicLink());assert(fs.lstatSync(dir).isDirectory()&&!fs.lstatSync(dir).isSymbolicLink());
const actual=fs.realpathSync(saved);assert.equal(actual.replaceAll('\\','/').toLowerCase(),'f:/visiblemedicine/atlas/node_modules');
const copied=[],linked=[];
function inventory(from,to,prefix=''){
 for(const entry of fs.readdirSync(from,{withFileTypes:true})){
  assert(!entry.isSymbolicLink(),'Unexpected package symlink');const p=prefix?prefix+'/'+entry.name:entry.name;
  if(entry.isDirectory())inventory(from+'/'+entry.name,to+'/'+entry.name,p);
  else {const a=fs.readFileSync(from+'/'+entry.name),b=fs.readFileSync(to+'/'+entry.name);assert(a.equals(b));copied.push({path:p,bytes:a.length,sha256:createHash('sha256').update(a).digest('hex')});}
 }
}
for(const entry of fs.readdirSync(actual,{withFileTypes:true})){
 if(entry.name==='three'||entry.name==='three-mesh-bvh'){
  assert(entry.isDirectory());if(!fs.existsSync(dir+'/'+entry.name))fs.cpSync(actual+'/'+entry.name,dir+'/'+entry.name,{recursive:true,dereference:false,errorOnExist:true});
  inventory(actual+'/'+entry.name,dir+'/'+entry.name,entry.name);
 }else if(entry.isDirectory()){if(!fs.existsSync(dir+'/'+entry.name))fs.symlinkSync(path.join(actual,entry.name),dir+'/'+entry.name,'junction');assert.equal(fs.realpathSync(dir+'/'+entry.name),fs.realpathSync(actual+'/'+entry.name));linked.push(entry.name);}
 else {assert(entry.isFile());if(!fs.existsSync(dir+'/'+entry.name))fs.copyFileSync(actual+'/'+entry.name,dir+'/'+entry.name);assert(fs.readFileSync(actual+'/'+entry.name).equals(fs.readFileSync(dir+'/'+entry.name)));}
}
fs.writeFileSync(root+'/verification/DEPENDENCY_LAYOUT.json',JSON.stringify({at:new Date().toISOString(),source:actual,savedJunction:saved,copied,linked,packageVersionsChanged:false,globalInstallationChanged:false,confinementGuardChanged:false,reason:'Existing hermetic selection test requires Three and BVH actual source paths inside its checkout; copies are byte-identical, other existing packages remain linked.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({copiedFiles:copied.length,bytes:copied.reduce((n,r)=>n+r.bytes,0),linkedPackages:linked.length,packageVersionsChanged:false}));

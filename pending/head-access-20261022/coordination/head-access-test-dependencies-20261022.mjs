// A local, byte-identical Three dependency view for the unchanged hermetic test resolver.
// Restore the original dependency topology before any production build.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate';
const dependencies=root+'/atlas/node_modules',installed='F:/VisibleMedicine/atlas/node_modules',retained=root+'/hermetic-test-node-modules';
function inside(p){assert(path.resolve(p).startsWith(path.resolve(root)+path.sep));}
function files(directory,relative=''){
 const rows=[];for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const p=relative?relative+'/'+entry.name:entry.name,full=path.join(directory,entry.name);
  assert(!entry.isSymbolicLink(),'Installed Three package contains unexpected links');
  if(entry.isDirectory())rows.push(...files(full,p));else{assert(entry.isFile());const b=read(full);rows.push({path:p,bytes:b.length,sha256:sha(b)});}
 }return rows;
}
export function localizeHeadTestDependencies(){
 inside(dependencies);inside(retained);assert(!fs.existsSync(retained));
 assert(fs.lstatSync(dependencies).isSymbolicLink());assert.equal(fs.realpathSync(dependencies),fs.realpathSync(installed));
 // Nonrecursive rmdir removes only this verified junction, never its target.
 fs.rmdirSync(dependencies);fs.mkdirSync(dependencies);
 const packages=[];
 for(const entry of fs.readdirSync(installed,{withFileTypes:true})){
  const from=installed+'/'+entry.name,to=dependencies+'/'+entry.name;
  if(['three','three-mesh-bvh'].includes(entry.name)){
   const rows=files(from);fs.cpSync(from,to,{recursive:true,errorOnExist:true,force:false});
   assert.deepEqual(files(to),rows,'exact physical local dependency copy');packages.push({name:entry.name,files:rows});
  }else if(entry.isDirectory())fs.symlinkSync(from,to,'junction');
  else if(entry.isFile())fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
  else throw Error('Unexpected installed dependency entry');
 }
 assert.equal(packages.length,2);
 const result={at:new Date().toISOString(),purpose:'Keep the existing test realpath confinement intact; no resolver or package version changes',dependencies,installed,packages,productionBuildMustRestoreOriginalJunction:true,ownerPreviewChanged:false};
 fs.writeFileSync(root+'/HERMETIC_TEST_DEPENDENCIES.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});return result;
}
export function restoreHeadProductionDependencies(){
 inside(dependencies);inside(retained);assert(fs.lstatSync(dependencies).isDirectory()&&!fs.lstatSync(dependencies).isSymbolicLink());assert(!fs.existsSync(retained));
 fs.renameSync(dependencies,retained);fs.symlinkSync(installed,dependencies,'junction');
 assert.equal(fs.realpathSync(dependencies),fs.realpathSync(installed));
 fs.writeFileSync(root+'/PRODUCTION_DEPENDENCIES_RESTORED.json',JSON.stringify({at:new Date().toISOString(),dependencies,installed,retainedLocalTestCopies:retained,productionTopologyRestored:true,noInstalledDependencyBytesChanged:true,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
}

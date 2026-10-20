import assert from 'node:assert/strict';
import path from 'node:path';

/** Project-source closure from the real hermetic compiler; no checkout paths in output. */
export function compiledRequirementSourcePaths(metafile,root,entry='requirements-audit-entry.ts'){
 assert(metafile&&typeof metafile==='object'&&!Array.isArray(metafile));
 assert(metafile.inputs&&typeof metafile.inputs==='object'&&!Array.isArray(metafile.inputs));
 const sourceRoot=path.resolve(root),files=new Map();let virtual=0;
 for(const [key,input] of Object.entries(metafile.inputs)){
  if(key===entry){virtual++;continue;}
  assert(key.startsWith('workspace-test:'),'Unexpected requirement compiler namespace: '+key);
  let absolute=key.slice('workspace-test:'.length),variant='plain';
  if(input.with!==undefined){
   assert(input.with&&typeof input.with==='object'&&!Array.isArray(input.with));assert.deepEqual(Object.keys(input.with),['type']);assert.equal(input.with.type,'json');
   const suffix=" with { type: 'json' }";
   // esbuild decorates the key only when another import-attribute variant exists.
   if(absolute.includes(' with {')){assert(absolute.endsWith(suffix),'Import attributes must match compiler metadata');absolute=absolute.slice(0,-suffix.length);}
   assert(absolute.endsWith('.json'));variant='json';
  }else assert(!absolute.includes(' with {'),'Unbound compiler import attributes');
  assert(path.isAbsolute(absolute),'Absolute compiler source required');
  const relative=path.relative(sourceRoot,absolute).replaceAll('\\','/');
  assert(relative&&!path.isAbsolute(relative)&&!relative.split('/').some(part=>!part||part==='.'||part==='..'),'Compiler source escapes project');
  // Installed libraries are classified separately through the lockfile/licence audit.
  // Do not turn machine-specific node_modules paths into portable source inventory.
  if(relative.startsWith('node_modules/'))continue;
  const variants=files.get(relative)??new Set();assert(!variants.has(variant),'Duplicate requirement compiler source');variants.add(variant);files.set(relative,variants);
 }
 assert.equal(virtual,1,'Exactly one known virtual requirement entry required');
 assert(files.size>0,'Requirement resolver has no actual project source');
 return [...files.keys()].sort();
}

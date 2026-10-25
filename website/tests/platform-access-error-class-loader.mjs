import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

// Load the real exported class without opening a DB or running bootstrap/schema.
// Every dependency is explicit and denies use; this is a constructor boundary,
// not a replacement platform snapshot, authentication or authorization service.
export function loadPlatformAccessError(site){
 const source=readFileSync(resolve(site,'db/platform.ts'),'utf8');
 const {transpileModule,ModuleKind,ScriptTarget}=createRequire(resolve(site,'package.json'))('typescript');
 const result=transpileModule(source,{fileName:'db/platform.ts',reportDiagnostics:true,compilerOptions:{module:ModuleKind.CommonJS,target:ScriptTarget.ES2022}});
 assert.deepEqual((result.diagnostics??[]).filter(d=>d.category===1),[],'platform source must transpile');
 const deny=()=>{throw Error('PlatformAccessError constructor fixture forbids DB/bootstrap calls');};
 const env=Object.defineProperty({},'DB',{get:deny});
 const dependencies={'cloudflare:workers':{env},'./bootstrap':{ensureEducationUser:deny}};
 const module={exports:{}};
 new Function('require','module','exports',result.outputText)(id=>{
  assert(Object.hasOwn(dependencies,id),'Unexpected platform class dependency: '+id);
  return dependencies[id];
 },module,module.exports);
 assert.equal(typeof module.exports.PlatformAccessError,'function','actual platform must export its class');
 return module.exports.PlatformAccessError;
}

import assert from 'node:assert/strict';
import {realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

/** Read the explicit native source of a frozen website; never guess from cwd. */
export function nativeAtlasIdentityForSource(source,pin){
 assert(source&&typeof source==='object');assert(pin&&typeof pin==='object');
 assert.match(pin.source,/^[a-f0-9]{40}$/);assert.match(pin.sourceTree,/^[a-f0-9]{40}$/);
 const fields=['atlas','atlasHead','atlasTree'],present=fields.filter(key=>Object.hasOwn(source,key));
 assert(present.length===0||present.length===fields.length,'Native source identity must be complete');
 if(present.length){assert.equal(typeof source.atlas,'string');assert(path.isAbsolute(source.atlas));
  assert.equal(source.atlasHead,pin.source,'Native source differs from exact delivery pin');
  assert.equal(source.atlasTree,pin.sourceTree,'Native tree differs from exact delivery pin');}
 return {atlas:present.length?source.atlas:'F:/VisibleMedicine/atlas',revision:pin.source,tree:pin.sourceTree};
}

/** Process-local test configuration, never a machine setting or source fallback. */
export function nativeAtlasEnvironment({atlas,revision,tree,environment=process.env}){
 assert.equal(typeof atlas,'string');assert(path.isAbsolute(atlas));
 assert.match(revision,/^[a-f0-9]{40}$/);assert.match(tree,/^[a-f0-9]{40}$/);
 const root=realpathSync(atlas);
 const configured=environment.VM_ATLAS_SOURCE_REPO;
 if(configured!==undefined){assert.equal(typeof configured,'string');assert(path.isAbsolute(configured));
  assert.equal(realpathSync(configured).toLowerCase(),root.toLowerCase(),'Do not silently override a different configured source repository');}
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,
  env:{...environment,GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'}}).trim();
 assert.equal(git('rev-parse','HEAD'),revision,'Exact native Atlas source');
 assert.equal(git('rev-parse','HEAD^{tree}'),tree,'Exact native Atlas tree');
 assert.equal(git('status','--porcelain'),'','Native source must remain clean');
 return {...environment,VM_ATLAS_SOURCE_REPO:root,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'};
}

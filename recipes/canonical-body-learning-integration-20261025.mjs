import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
export const stage='F:/VisibleMedicine/staging/20261025-canonical-body-learning-website',site=stage+'/website',prepFile=stage+'/PREPARATION.json',prepSha='7095d3456f931802c4d1586f9d19f29591077517fe504e7d5c25aa7412090873';
assert.equal(hash(prepFile),prepSha);export const prep=json(prepFile),parent=json(prep.parent.path);
export const row=p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)});
export const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
export function verify(state=json(stage+'/STATE.json')){
 assert.equal(hash(prepFile),prepSha);assert.equal(hash(prep.parent.path),prep.parent.sha256);
 const expected=new Map(parent.sourceRows.map(r=>[r.path,r]));for(const p of state.removedPaths)expected.delete(p);for(const r of state.mutable)expected.set(r.path,r);
 for(const r of expected.values())assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
 for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Frozen parent '+r.path);
 for(const d of parent.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
 for(const [repo,head]of [[parent.atlas,parent.atlasHead],['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(execFileSync('git',['--no-replace-objects','-C',repo,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),head);
 assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
 return state;
}
export function update(state,phase,paths=[],extra={}){const mutable=new Map(state.mutable.map(r=>[r.path,r]));for(const p of paths)mutable.set(p,row(p));const next={...state,at:new Date().toISOString(),phase,mutable:[...mutable.values()].sort((a,b)=>a.path.localeCompare(b.path)),...extra};fs.writeFileSync(stage+'/STATE.json',JSON.stringify(next,null,2)+'\n');return next;}
export function sourceRows(state=json(stage+'/STATE.json')){verify(state);const result=new Map(parent.sourceRows.map(r=>[r.path,r]));for(const p of state.removedPaths)result.delete(p);for(const r of state.mutable)result.set(r.path,r);return [...result.values()].sort((a,b)=>a.path.localeCompare(b.path));}

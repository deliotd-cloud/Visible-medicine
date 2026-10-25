// Explicit historical evidence locations; no current-source or dated-path defaults.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const source='b79e110d2d28f18993263926ba35aa7a3f478b20',tree='0dd97cc55ef9aff3493b91752309d1d661c0b0c8';
const sha=b=>createHash('sha256').update(b).digest('hex');
const names=new Set(['VM_ADJACENT_TRANSITION','VM_ADJACENT_B79_WEBSITE','VM_ADJACENT_B79_ATLAS','VM_ADJACENT_B79_RECEIPT','VM_ADJACENT_190A_EXPORT','VM_ADJACENT_190A_CHECKPOINT','VM_ADJACENT_CLINICAL_WEBSITE','VM_ADJACENT_CLINICAL_PROOF']);
export function adjacentRolePath(name){assert(names.has(name),'Declared historical role path');const value=process.env[name];assert(typeof value==='string'&&value.trim(),name+' requires the exact retained historical artifact; no fallback');return fs.realpathSync(value);}
export function adjacentB79Context(){
 const site=adjacentRolePath('VM_ADJACENT_B79_WEBSITE'),atlas=adjacentRolePath('VM_ADJACENT_B79_ATLAS'),receiptPath=adjacentRolePath('VM_ADJACENT_B79_RECEIPT');
 const bytes=fs.readFileSync(receiptPath);assert.equal(sha(bytes),'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2','Authentic complete b79 receipt');
 const receipt=JSON.parse(bytes);assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 const pinPath='tests/fixtures/current-atlas-delivery.json',rows=receipt.sourceRows.filter(r=>r.path===pinPath);assert.equal(rows.length,1);
 const pinBytes=fs.readFileSync(site+'/'+pinPath);assert.equal(sha(pinBytes),rows[0].sha256);assert.equal(sha(pinBytes),'c6ae4cccc92593ab75982b1d0ad1c10f3ee2b4f408c85e86bf0a94460365bad0');
 const pin=JSON.parse(pinBytes);assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 assert.equal(fs.realpathSync(git('rev-parse','--show-toplevel')),atlas);assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('rev-parse','HEAD^{tree}'),tree);assert.equal(git('status','--porcelain'),'','Historical b79 source must be clean');
 return {site,atlas,receiptPath};
}
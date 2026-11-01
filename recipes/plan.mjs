import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

export const root='G:/VisibleMedicine-temp/staging/20261101-orientation-website';
export const site=root+'/website';
export const baseline='G:/VisibleMedicine-temp/proposals/20261101-focus-release29/SOURCE_VERIFIED_REPAIRS.json';
export const baselineSha='ad7457a339b3174bf6d645e31f5c99458efb3c12139566825b83ef21bc0f9157';
export const native='G:/VisibleMedicine-temp/staging/20261101-orientation-integration/atlas';
export const head='e32617ef2ed8690472e797d791a061fa3b1985b4';
export const tree='89d5ec3eb886429325d6c8e768960ab73293a5fa';
export const exportRoot='G:/VisibleMedicine-temp/proposals/20261101-orientation-integration/export/public/atlas-runtime/head-neck';
export const overlay='G:/VisibleMedicine-temp/proposals/20261101-runtime-notice-audit/website';
export const overlayPaths=['vite.config.ts','scripts/atlas-catalog-declaration-template.mjs','scripts/atlas-catalog-types.mjs','scripts/atlas-compiler-artifact-plugin.mjs','tests/atlas-compiler-artifact-plugin.test.mjs'];

export function sha(file){const h=createHash('sha256'),fd=fs.openSync(file,'r'),buffer=Buffer.alloc(65536);try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
export function json(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
export function child(base,relative){assert(typeof relative==='string'&&relative&&!path.isAbsolute(relative)&&!relative.includes('\\')&&!relative.includes(':')&&!relative.split('/').some(s=>!s||s==='.'||s==='..'));const out=path.resolve(base,relative);assert(out.startsWith(path.resolve(base)+path.sep));return out;}
export function cleanNative(){const git=(...args)=>execFileSync('git',['-C',native,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();assert.equal(git('rev-parse','HEAD'),head);assert.equal(git('rev-parse','HEAD^{tree}'),tree);assert.equal(git('status','--porcelain'),'');}
export function source(){assert.equal(sha(baseline),baselineSha);const s=json(baseline);assert.equal(s.sourceRows.length,7486);assert.equal(path.resolve(s.website),path.resolve('G:/VisibleMedicine-temp/staging/20261101-focus-delivery/attempt-1/website'));assert.equal(s.atlasHead,'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc');return s;}
export function run(cwd,name,args){let out;try{out=execFileSync(process.execPath,args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:8e6});}catch(error){fs.writeFileSync(child(root,'logs/'+name+'.log'),String(error.stdout??'')+String(error.stderr??'')+String(error.message??''),{flag:'wx'});throw error;}fs.writeFileSync(child(root,'logs/'+name+'.log'),out,{flag:'wx'});return out;}
export function write(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}

// Test-only, explicit historical reads. Current runtime tests use the current delivery contract.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {resolve,relative,sep,isAbsolute} from 'node:path';
const sha=b=>createHash('sha256').update(b).digest('hex');
function role(receiptPath,digest){
 const bytes=readFileSync(receiptPath);assert.equal(sha(bytes),digest,'Historical source receipt');
 const receipt=JSON.parse(bytes),rows=new Map(receipt.sourceRows.map(r=>[r.path,r]));
 const read=name=>{assert(!isAbsolute(name)&&!/[\\:]/.test(name)&&name.split('/').every(p=>p&&p!=='.'&&p!=='..'));const row=rows.get(name);assert(row,'Declared historical source: '+name);const target=resolve(receipt.website,name);assert(lstatSync(target).isFile()&&!lstatSync(target).isSymbolicLink());const value=readFileSync(target);assert.equal(value.length,row.bytes);assert.equal(sha(value),row.sha256,name);return value;};
 return {receipt,read};
}
const six=role('F:/VisibleMedicine/staging/20261022-head-tools-bound-successor/BUILT_SOURCE.json','b1c8248969db0df0ab77da5458c08b744bceac1a5105af435a9c6eafc6a5f142');
for(const p of ['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs','tests/fixtures/current-atlas-delivery.json'])six.read(p);
const sixValidator=await import(pathToFileURL(six.receipt.website+'/tests/current-atlas-delivery.mjs').href);
const sixPin=JSON.parse(six.read('tests/fixtures/current-atlas-delivery.json'));
assert.equal(sixPin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
export const historicalHead6dRuntime=pathToFileURL(six.receipt.website+'/public/atlas-runtime/head-neck/');
export function validateHistoricalHead6d(){
 const p=sixValidator.validateCurrentAtlasDelivery({pin:sixPin,root:six.receipt.website,read:six.read});
 const native='F:/VisibleMedicine/staging/20261021-body-learning-source-candidate/atlas';
 const git=(...args)=>execFileSync('git',['--no-replace-objects','--no-optional-locks','-C',native,...args],{encoding:'utf8',windowsHide:true}).trim();
 assert.equal(git('rev-parse','HEAD'),p.source);assert.equal(git('rev-parse','HEAD^{tree}'),p.sourceTree);assert.equal(git('status','--porcelain'),'');return p;
}
function nameOf(url){const name=relative(six.receipt.website,fileURLToPath(url)).split(sep).join('/');assert(name.startsWith('public/atlas-runtime/head-neck/'));return name;}
export async function readHistoricalHead6dFile(url,encoding){const bytes=six.read(nameOf(url));return encoding?bytes.toString(encoding):bytes;}
export async function listHistoricalHead6dDirectory(url,options){assert.equal(options?.withFileTypes,true);nameOf(new URL('placeholder',url));return readdirSync(url,options);}
const pan=role('F:/VisibleMedicine/staging/20261023-head-pan-bound/SOURCE_BOUND.json','d41eecb7d72f96eaa52b4ac494646e58cbd075f32ad337b26d309ff277fa1d2a');
export function readHistoricalPanViewer(){const bytes=pan.read('components/HeadAtlasViewer.tsx');assert.equal(sha(bytes),'180d034774956e77d62a0b2d0ad517b38d70581dfc8da935fd937f1c8f4dc08a');return bytes.toString('utf8');}

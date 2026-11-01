import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {test} from 'node:test';
import * as next from '../integration/module-audit.mjs';
const mandatory=['package-lock.json','integration/module-audit.mjs','scripts/regional-teaching-snapshots.mjs','scripts/native-catalog-types.mjs','public/models/bodyparts3d/full-body/catalog.d.json.ts','app/body-types.ts','lib/anatomy-coordinates.ts'];
async function outputs(module,root,extras,ids,bundle={}){const emitted=[];await module.moduleAudit(root,extras).generateBundle.call({getModuleIds:()=>ids,emitFile:entry=>emitted.push(entry)},null,bundle);return emitted;}
function fixture(){const root=fs.mkdtempSync(path.join(process.env.TEMP||os.tmpdir(),'bounded-audit-'));for(const [i,file]of mandatory.entries()){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),'source'+i);}return root;}

test('audit hashes every input including large and empty files in sorted order',async()=>{
 const root=fixture(),files=['content/z.json','content/a.ts','content/empty.json'];
 for(const file of files){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),file.includes('empty')?'':'synthetic '.repeat(150000));}
 const ids=[path.join(root,'content/z.json'),path.join(root,'content/a.ts')+'?source',path.join(root,'node_modules/skip.ts'),'\0virtual-module',path.join(root,'../outside.ts')];
 const after=await outputs(next,root,files,ids); assert.deepEqual(JSON.parse(after.find(x=>x.fileName==='bundled-dependencies.json').source), []);
 const records=JSON.parse(after.find(x=>x.fileName==='source-inputs.json').source);assert.equal(records.length,mandatory.length+files.length);
 assert.deepEqual(records.map(x=>x.path),[...mandatory,...files].sort());
 for(const row of records)assert.equal(row.sha256,createHash('sha256').update(fs.readFileSync(path.join(root,row.path))).digest('hex'));
});

test('a missing input fails the whole audit and cannot emit a source receipt',async()=>{
 const root=fixture(),emitted=[];
 await assert.rejects(next.moduleAudit(root,['missing.ts']).generateBundle.call({getModuleIds:()=>[],emitFile:entry=>emitted.push(entry)},null,{}),{code:'ENOENT'});
 assert(!emitted.some(x=>x.fileName==='source-inputs.json'));
});

test('commercial dependency rejection is unchanged',async()=>{
 const root=fixture(),directory=path.join(root,'node_modules/synthetic');fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(path.join(directory,'package.json'),JSON.stringify({name:'synthetic-restricted',version:'1.0.0',license:'CC-BY-NC-4.0'}));
 fs.writeFileSync(path.join(directory,'LICENSE'),'Synthetic fixture only');
 const bundle={main:{type:'chunk',modules:{[path.join(directory,'index.js')]:{renderedLength:10}}}};
 for(const module of [next])await assert.rejects(outputs(module,root,[],[],bundle),/Bundle licence needs review/);
});

test('missing commercial notice remains an error',async()=>{
 const root=fixture(),directory=path.join(root,'node_modules/synthetic');fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(path.join(directory,'package.json'),JSON.stringify({name:'synthetic-mit',version:'1.0.0',license:'MIT'}));
 const bundle={main:{type:'chunk',modules:{[path.join(directory,'index.js')]:{renderedLength:10}}}};
 for(const module of [next])await assert.rejects(outputs(module,root,[],[],bundle),/Missing licence text/);
});

test('commercial notices and dependency identities are still emitted',async()=>{
 const root=fixture(),directory=path.join(root,'node_modules/synthetic');fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(path.join(directory,'package.json'),JSON.stringify({name:'synthetic-mit',version:'1.0.0',license:'MIT'}));
 fs.writeFileSync(path.join(directory,'LICENSE'),'Synthetic notice for the test');
 const bundle={main:{type:'chunk',fileName:'main.js',code:'export{};',imports:[],dynamicImports:[],modules:{[path.join(directory,'index.js')]:{renderedLength:10}}}};
 const emitted=await outputs(next,root,[],[],bundle);
 assert.deepEqual(JSON.parse(emitted.find(x=>x.fileName==='bundled-dependencies.json').source),[{name:'synthetic-mit',version:'1.0.0',license:'MIT'}]);
 assert.match(emitted.find(x=>x.fileName==='BUNDLED_NOTICES.txt').source,/Synthetic notice for the test/);
 assert(emitted.some(x=>x.fileName==='teaching-chunks.json'));
});


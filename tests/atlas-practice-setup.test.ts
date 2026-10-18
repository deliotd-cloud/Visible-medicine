import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {createHash} from 'node:crypto';

const historicalWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
function historicalFile(path:string,encoding:'utf8'):string;
function historicalFile(path:string):Buffer;
function historicalFile(path:string,encoding?:'utf8'){
 const bytes=Buffer.from(execFileSync('git',['show',historicalWebsite+':'+path],{encoding:null,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
 return encoding==='utf8'?bytes.toString('utf8'):bytes;
}
test('historical practice setup and review share the single panel-contained session length control',()=>{
 const manifest=JSON.parse(historicalFile('atlas-review/manifest.json','utf8'));
 const runtime=JSON.parse(historicalFile('public/atlas-runtime/head-neck/manifest.json','utf8'));
 assert.equal(runtime.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
 const path='app/body-explorer.tsx';
 const file=manifest.files.find((f:any)=>f.path===path);assert(file);
 const inputs=JSON.parse(historicalFile('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
 const text=historicalFile('atlas-review/'+path,'utf8');
 assert.equal(createHash('sha256').update(text).digest('hex'),file.importedSha256);
 assert.equal(text.split('aria-label="Practice session length"').length-1,1);
 const header=text.slice(text.indexOf('<header className="body-topbar"'),text.indexOf('</header>'));
 assert(!header.includes('Practice session length'));
 const options=text.slice(text.indexOf('<details className="vm-practice-options"'),text.indexOf('<label htmlFor="practice-answer-mode">'));
 assert(options.includes('htmlFor="practice-session-length"'));
 assert(options.includes('id="practice-session-length"'));
 assert(options.includes('[5, 10, 20]'));
 assert(options.includes('setPracticeCount(Number(value))'));
});

test('current practice setup and Review retain one source-bound panel session length control',()=>{
 const manifest=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const runtime=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));
 assert.equal(manifest.revision,CURRENT_ATLAS_REVISION);
 assert.equal(runtime.sourceCommit,CURRENT_ATLAS_REVISION);
 const path='app/body-explorer.tsx';
 const file=manifest.files.find((f:any)=>f.path===path);assert(file);
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 const source=execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{encoding:null,cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const sha=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
 assert.deepEqual(inputs.filter((f:any)=>f.path===path),[{path,sha256:sha(source)}]);
 assert.equal(file.sourceSha256,sha(source));
 const text=readFileSync('atlas-review/'+path,'utf8');
 assert.equal(sha(text),file.importedSha256);
 assert.equal(text.split('aria-label="Practice session length"').length-1,1);
 const header=text.slice(text.indexOf('<header className="body-topbar"'),text.indexOf('</header>'));
 assert(!header.includes('Practice session length'));
 const options=text.slice(text.indexOf('<details className="vm-practice-options"'),text.indexOf('<label htmlFor="practice-answer-mode">'));
 assert(options.includes('htmlFor="practice-session-length"'));
 assert(options.includes('id="practice-session-length"'));
 assert(options.includes('[5, 10, 20]'));
 assert(options.includes('setPracticeCount(Number(value))'));
 const read=(path:string)=>readFileSync(path);
 validateCurrentAtlasDelivery({read});
 assert.throws(()=>validateCurrentAtlasDelivery({read:(name:string)=>{
  if(name!=='public/atlas-runtime/head-neck/source-inputs.json')return read(name);
  const data=JSON.parse(read(name).toString());
  data.find((f:any)=>f.path===path).sha256='0'.repeat(64);
  return Buffer.from(JSON.stringify(data));
 }}));
});

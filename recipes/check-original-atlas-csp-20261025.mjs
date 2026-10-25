import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {hash,json} from './seal-simple-website-successor.mjs';
const sourceFile='F:/VisibleMedicine/staging/20261025-tour-neck-renal-types-website/SOURCE_CANDIDATE.json';assert.equal(hash(sourceFile),'04659d023c2fb36b0ee03ae47583aefa31478653abbf7f461759df62d4629fbf');
const source=json(sourceFile),site=source.website,dir='F:/VisibleMedicine/staging/20261025-original-csp-baseline';assert(!fs.existsSync(dir));
const {assertCompleteOriginal}=await import(pathToFileURL(site+'/tests/deepbrain-foot-roles.mjs'));
const paths=['lib/content-security-policy.ts','tests/content-security-policy.test.ts','worker/index.ts'];
const rows=paths.map(p=>source.sourceRows.find(r=>r.path===p));assert(rows.every(Boolean));
function verify(){for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}verify();fs.mkdirSync(dir);
for(const r of rows){const p=dir+'/before/'+r.path+'.raw';fs.mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});fs.copyFileSync(site+'/'+r.path,p,fs.constants.COPYFILE_EXCL);}
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>/^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(k)));
const args=['--max-old-space-size=128','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap','tests/content-security-policy.test.ts'];
const result=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,env,maxBuffer:1024*1024,encoding:'utf8'});
fs.writeFileSync(dir+'/stdout.tap',result.stdout??'',{flag:'wx'});fs.writeFileSync(dir+'/stderr.log',result.stderr??'',{flag:'wx'});verify();
const counts=assertCompleteOriginal({code:result.status,signal:result.signal,...(result.error?{error:String(result.error)}:{})},result.stdout,3);
fs.writeFileSync(dir+'/RESULT.json',JSON.stringify({at:new Date().toISOString(),source:{path:sourceFile,sha256:hash(sourceFile)},wholeOriginalRows:rows,process:{code:result.status,signal:result.signal},counts,passing:true,sourceUnchanged:true,interpretation:'Complete unchanged three-case baseline passes even though direct built redirect capture demonstrates the canonical-document bug. Baseline control is not extra fixed-behavior coverage; one original slash-negative expectation must intentionally change to the new canonical-alias positive expectation.',ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:dir+'/RESULT.json',sha256:hash(dir+'/RESULT.json'),counts,originalAssertionsUnchanged:true}));

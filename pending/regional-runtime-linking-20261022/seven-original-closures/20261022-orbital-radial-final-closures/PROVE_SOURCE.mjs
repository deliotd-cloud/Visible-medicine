import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-orbital-radial-final-closures/';
const site='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website/';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-remaining-runtime-admissions/APPLIED_SOURCE.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(path);
assert.equal(sha(read(sourceReceipt)),'d72789221c1cbdb0686e65a6316fe42c378f4cddc6e4adfd2b556ad7b79f2f8e');
const base=pathToFileURL(site).href;
const h51=await import(base+'tests/historical-radial-eus-delivery-51.mjs');
const h52=await import(base+'tests/historical-native-head-history-delivery-52.mjs');
const n52=await import(base+'tests/native-head-52-source.mjs');
const current=await import(base+'tests/current-atlas-delivery.mjs');
const originalCwd=process.cwd();
try {
 process.chdir(site);
 for(const name of ['orbital-inbox-admission-history.test.mjs','radial-eus-current-transition.test.mjs']){
  const raw=read(stage+'RAW/tests/'+name),code=read(stage+'CODE/tests/'+name),live=read(site+'tests/'+name);
  assert.deepEqual(raw,live,name+' exact original bytes');
  assert.notEqual(sha(raw),sha(code),name+' changed source');
  const text=code.toString();
  if(name.startsWith('orbital')){
   const addition=` [\n  "  assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(id),id);",\n  "  assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(id)+'&t=teaching',id);",\n ],\n`;
   assert.equal(text.split(addition).length,2,'Only one URL source seam');
   assert.deepEqual(Buffer.from(text.replace(addition,'')),raw,'Full orbital CODE to RAW inverse');
   const first=text.indexOf('const changes=['),last=text.indexOf("\ntest('the prior live source pin",first);
   assert(first>=0&&last>first);
   const orbital=new Function('test','assert','readFileSync','createHash','originalPath','activePath','originalSha256',text.slice(first,last));
   const activeUrl=new URL('tests/clinical-review-inbox-source-update.test.ts',base);
   const runOrbital=reader=>{let count=0;orbital((title,callback)=>{assert.match(title,/retains exact original source/);count++;callback();},assert,reader,createHash,
    new URL('tests/fixtures/orbital-inbox-source-before-current-admission.txt',base),activeUrl,
    '4cbdbfd69d43a4f12e407dcd27ccc2794751822259d12ba976cad074553ae2f9');assert.equal(count,1);};
   runOrbital(readFileSync);
   assert.match(text,/&t=teaching/);
   const mutated=read(site+'tests/clinical-review-inbox-source-update.test.ts').toString().replace('&t=teaching','&t=imaging');
   assert.notEqual(mutated,read(site+'tests/clinical-review-inbox-source-update.test.ts').toString());
   assert.throws(()=>runOrbital((path,...args)=>path.href===activeUrl.href?mutated:readFileSync(path,...args)));
  }else{
   const begin=' const marker=expected.indexOf(',end='\n let admission=';
   const rawText=raw.toString(),rawBegin=rawText.indexOf(begin),rawEnd=rawText.indexOf(end,rawBegin),codeBegin=text.indexOf(begin),codeEnd=text.indexOf(end,codeBegin);
   assert(rawBegin>=0&&rawEnd>rawBegin&&codeBegin>=0&&codeEnd>codeBegin);
   assert.equal(text.slice(0,codeBegin),rawText.slice(0,rawBegin),'Unchanged radial prefix');
   assert.equal(text.slice(codeEnd),rawText.slice(rawEnd),'Unchanged radial tail and refusals');
   assert.deepEqual(Buffer.from(text.slice(0,codeBegin)+rawText.slice(rawBegin,rawEnd)+text.slice(codeEnd)),raw,'Full radial CODE to RAW inverse');
   const first=text.indexOf("test('closed51 retains exact bytes"),last=text.indexOf("\ntest('current attributes",first);
   assert(first>=0&&last>first);
   let count=0;
   const snippet=text.slice(first,last).replace("new URL('./fixtures/gitattributes-delivery52.raw',import.meta.url)","new URL('./fixtures/gitattributes-delivery52.raw',siteBaseUrl)");
   const callback=new Function('test','assert','revision51','readRevision51','read','sha','replace','execFileSync','readFileSync','siteBaseUrl','validateRevision51Delivery','validateCurrentAtlasDelivery','source','sourceTree','review',snippet);
   const replace=(body,before,after)=>{assert.equal(body.split(before).length,2,before.slice(0,100));return body.replace(before,after);};
   const runRadial=reader=>callback((title,body)=>{assert.match(title,/closed51 retains exact bytes/);count++;body();},assert,h51.revision51,h51.readRevision51,reader,sha,replace,execFileSync,readFileSync,base+'tests/radial-eus-current-transition.test.mjs',h51.validateRevision51Delivery,h52.validateRevision52Delivery,'6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb','4ce7882a2748d2f190e4b4f8783af6416c7cf44b','d2ef89f23e700eebea3dce1d7507926ad7c5fdbccdfbf9941f06cd4739644d79');
   runRadial(h52.readRevision52);
   assert.equal(count,1);
   const present=read(site+'tests/lacrimal-current-transition.test.mjs');
   assert.equal(sha(present),'05e1c9cb23419576462928813a24c65bf0c95a216ab8a85e191e564284a209ca');
   const mutated=Buffer.from(present);mutated[500]^=1;
   assert.notDeepEqual(mutated,present);
   assert.throws(()=>runRadial(path=>path==='tests/lacrimal-current-transition.test.mjs'?mutated:h52.readRevision52(path)));
  }
  console.log('PASS',name,'RAW',sha(raw),'CODE',sha(code),'first callback');
 }
}finally{process.chdir(originalCwd);}

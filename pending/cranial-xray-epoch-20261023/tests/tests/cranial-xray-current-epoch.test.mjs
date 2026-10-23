import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assertCranialXrayDeliveryEpoch,cranialXrayPriorSource,cranialXrayFeaturePaths} from './cranial-xray-current-epoch.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const norm=b=>b.toString().replaceAll('\r\n','\n');

test('current X-ray delivery proves original 6d7 history and every retained feature source',()=>{
  const current=validateCurrentAtlasDelivery();
  assert.equal(assertCranialXrayDeliveryEpoch(current),current.source);
  assert.notEqual(current.source,cranialXrayPriorSource);
  assert.equal(cranialXrayFeaturePaths.length,4);
});

test('the original whole X-ray test and all its existing assertions have an exact inverse',()=>{
  const old=read('./fixtures/cranial-xray-before/clinical-review-intracranial-arterial-xray.test.ts.raw');
  assert.equal(sha(old),'df6c0e5b9fc90ed57d60b580c0f03360daeea3997b24c286db6d036434949c35');
  let restored=norm(read('./clinical-review-intracranial-arterial-xray.test.ts'));
  const seams=[
    ["import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';","import {emittedTeaching} from './atlas-emitted-teaching.ts';"],
    ["const visible=(code:{includes:(value:string)=>boolean},value:string)","const visible=(code:string,value:string)"],
    ["emittedTeachingSearch(learnerBase,learner.files)","emittedTeaching(learnerBase,learner.files,true)"],
    ["emittedTeachingSearch(viewerBase,viewer.files)","emittedTeaching(viewerBase,viewer.files,true)"],
    ["import {assertCranialXrayDeliveryEpoch} from './cranial-xray-current-epoch.mjs';\n",''],
    ['  assert.equal(current.source,assertCranialXrayDeliveryEpoch(current));',
      "  assert.equal(current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"],
  ];
  for(const[from,to]of seams){assert.equal(restored.split(from).length,2);restored=restored.replace(from,to);}
  assert.equal(restored,norm(old),'Only declared source-epoch and equivalent streamed text-search roles may differ; declared CRLF normalization only');
  assert.equal(sha(read('./current-atlas-delivery.mjs')),'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5');
});

test('historical, altered and approval-bearing deliveries cannot borrow current admission',()=>{
  const current=validateCurrentAtlasDelivery();
  for(const change of [
    p=>{p.source=cranialXrayPriorSource;},
    p=>{p.sourceTree='0'.repeat(40);},
    p=>{p.reviewIntegration='0'.repeat(64);},
    p=>{p.runtimeSources['head-neck']=cranialXrayPriorSource;},
    p=>{p.documents['atlas-review/manifest.json']='0'.repeat(64);},
    p=>{p.clinicalApproval=true;},
  ]){const bad=structuredClone(current);change(bad);assert.throws(()=>assertCranialXrayDeliveryEpoch(bad),/independently verified current delivery/);}
  assert.throws(()=>assertCranialXrayDeliveryEpoch(null));
});

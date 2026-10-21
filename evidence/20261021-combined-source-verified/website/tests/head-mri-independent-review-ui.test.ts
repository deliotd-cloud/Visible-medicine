import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {groupedReviewConfirmation} from './grouped-review-confirmation-harness.mjs';
import * as contract from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import * as working from '../lib/head-review-working-copy.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as clinical from '../lib/head-mri-only-clinical.ts';
import * as questions from '../lib/head-mri-anatomy-checks.ts';
const require=createRequire(import.meta.url);
function compile(path:string,extra:Record<string,unknown>={}){
 const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{} as Record<string,any>};
 new Function('require','module','exports',code)((id:string)=>extra[id]??(id==='./GroupedReviewConfirmation'?groupedReviewConfirmation:id.endsWith('.css')?{}:id.startsWith('../lib/')?require(id.endsWith('.ts')?id:id+'.ts'):require(id)),mod,mod.exports);
 return mod.exports;
}
const modes=['mri-only-clinical','mri-anatomy-checks'] as const;
const render=(Component:React.ComponentType<any>,props:Record<string,unknown>)=>renderToStaticMarkup(React.createElement(Component,props));
type Node={type:unknown;props:Record<string,any>};
function nodes(tree:unknown,predicate:(node:Node)=>boolean):Node[]{
 if(Array.isArray(tree))return tree.flatMap(child=>nodes(child,predicate));
 if(!tree||typeof tree!=='object'||!('props'in tree))return [];
 const node=tree as Node;return [...(predicate(node)?[node]:[]),...nodes(node.props.children,predicate)];
}

test('both evidence panels fold private corrections and withhold them on any stale binding',()=>{
 const image={HeadReviewImageLink:({children}:{children:React.ReactNode})=>React.createElement('span',null,children)};
 for(const [file,revisionProp,revision,anchor] of [
  ['HeadMriOnlyClinicalReview','clinicalRevision',clinical.MRI_ONLY_CLINICAL_REVISION,'mri-only-clinical-corrections'],
  ['HeadMriAnatomyChecksReview','questionRevision',questions.HEAD_MRI_ANATOMY_CHECK_REVISION,'mri-anatomy-checks-corrections'],
 ] as const){
  const Component=compile('components/'+file+'.tsx',{'./HeadReviewImageLink':image})[file];
  const props={revision:HEAD_LINK_REVISION,[revisionProp]:revision,reviewNotes:React.createElement('form',{'data-private-corrections':anchor})};
  const html=render(Component,props);
  assert(html.includes(`<details id="${anchor}"><summary>Private corrections &amp; saved history</summary><form`));
  assert(!html.includes('<details open'));
  for(const changed of [{revision:'stale'},{[revisionProp]:'stale'},{[revisionProp]:null}]){
   const refused=render(Component,{...props,...changed});assert.match(refused,/role="alert"/);assert.doesNotMatch(refused,/<form|data-private-corrections|<a /);
  }
 }
});

test('authorized page independently verifies each form and exposes exact picker anchors',async()=>{
 async function page(authorized:boolean,clinicalValid:boolean,questionsValid:boolean){
  const calls:string[]=[],nullModule=new Proxy({}, {get:()=>async()=>null});
  const imports=new Proxy({
   '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls.push('authorize');if(!authorized)throw Error('Denied');}},
   '@/lib/head-atlas-import':{HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION},
   '@/lib/head-teaching-review-contract':{headTeachingDraftContext:async(revision:string,kind:contract.HeadTeachingDraftKind='anatomy')=>{calls.push(kind);return contract.headTeachingDraftContext(revision,kind);}},
   '@/lib/head-mri-only-clinical':{...clinical,verifiedMriOnlyClinicalRevision:async()=>clinicalValid?clinical.MRI_ONLY_CLINICAL_REVISION:null},
   '@/lib/head-mri-anatomy-checks':{...questions,verifiedHeadMriAnatomyCheckRevision:async()=>questionsValid?questions.HEAD_MRI_ANATOMY_CHECK_REVISION:null},
   '@/components/HeadAtlasTeachingReview':{HeadAtlasTeachingReview:()=>null},
   '@/components/HeadTeachingReviewNotes':{HeadTeachingReviewNotes:()=>null},
   '@/components/HeadMriOnlyClinicalReview':{HeadMriOnlyClinicalReview:()=>null},
   '@/components/HeadMriAnatomyChecksReview':{HeadMriAnatomyChecksReview:()=>null},
  } as Record<string,unknown>,{get:(target,id:string)=>target[id]??(id.startsWith('@/')?nullModule:undefined)});
  return {element:await compile('app/workspace/atlas-review/head-learning/page.tsx',imports).default() as React.ReactElement<any>,calls};
 }
 const denied=await page(false,true,true);assert.deepEqual(denied.calls,['authorize']);assert.match(renderToStaticMarkup(denied.element),/authorized administrator/);
 for(const [clinicalValid,questionsValid] of [[true,true],[true,false],[false,true],[false,false]]){
  const {element,calls}=await page(true,clinicalValid!,questionsValid!);assert.equal(calls[0],'authorize');
  for(const [valid,prop,kind,anchor] of [[clinicalValid,'mriOnlyClinicalReview','mri-only-clinical','mri-only-clinical-corrections'],[questionsValid,'mriKnowledgeReview','mri-anatomy-checks','mri-anatomy-checks-corrections']] as const){
   assert.equal(calls.includes(kind),valid);
   assert.equal(element.props.additionalTargets.some((target:{id:string})=>target.id===anchor),valid);
   if(valid){const context=element.props[prop].props.reviewNotes.props.context;assert.equal(context.packetId,'head-'+kind);assert.equal(element.props[prop].props.reviewNotes.key,JSON.stringify(context));}
   else assert.equal(element.props[prop],undefined);
  }
 }
});

for(const kind of modes)test(`${kind} actual form loads and saves only its endpoint, preserving edits after conflict`,async()=>{
 const context=await contract.headTeachingDraftContext(HEAD_LINK_REVISION,kind),calls:{url:string;init:RequestInit|undefined}[]=[],downloads:unknown[]=[];
 const historyResponse={context,history:[],nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
 let cursor=0,initial=true;const slots:any[]=[],effects:(()=>void)[]=[];
 const hooks={useState(initialValue:any){const index=cursor++;if(!(index in slots))slots[index]=typeof initialValue==='function'?initialValue():initialValue;return [slots[index],(value:any)=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
  useRef(initialValue:any){const index=cursor++;if(!(index in slots))slots[index]={current:initialValue};return slots[index];},useEffect(effect:()=>void){if(initial)effects.push(effect);}};
 let conflict=false;
 const Component=compile('components/HeadTeachingReviewNotes.tsx',{
  react:hooks,'../lib/head-teaching-review-contract':contract,'../lib/head-teaching-review-client':client,
  '../lib/head-review-working-copy':{...working,downloadHeadWorkingCopy:(value:unknown)=>downloads.push(value)},
  '../lib/clinical-review-fetch':{getClinicalReviewContext:()=>null,clinicalReviewFetch:async(url:string,init?:RequestInit)=>{
   calls.push({url,init});
   if(init?.method!=='POST')return Response.json(historyResponse);
   const body=JSON.parse(String(init.body));
   return conflict?Response.json({error:'Another save changed this draft. Keep your edits.'},{status:409}):Response.json({review:{eventSchema:'vm-head-teaching-draft-event-1',context,version:body.expectedVersion+1,savedAt:'2026-10-12T00:00:00.000Z',draft:body.draft}},{status:201});
  }},
 }).HeadTeachingReviewNotes;
 const draw=()=>{cursor=0;const value=Component({context});initial=false;return value;};
 const find=(predicate:(node:Node)=>boolean)=>{const found=nodes(draw(),predicate);assert.equal(found.length,1);return found[0];};
 const flush=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
 const submit=async()=>{find(n=>n.type==='form').props.onSubmit({preventDefault(){}});await flush();};
 draw();for(const effect of effects)effect();await flush();
 assert.match(renderToStaticMarkup(draw()),/No saved notes yet/,'initial history fully loaded without a missing-context mock error');
 assert.equal(calls.length,1);assert.equal(calls[0].url,'/api/atlas-review/head-'+kind);assert.equal(calls[0].init?.method,undefined);
 assert.equal(find(n=>n.type==='fieldset').props.disabled,false);
 find(n=>n.type==='textarea'&&n.props.rows===5).props.onChange({target:{value:'Synthetic packet correction.'}});
 await submit();assert.equal(calls.length,2);
 const saved=JSON.parse(String(calls[1].init?.body));assert.equal(saved.packetId,context.packetId);assert.equal(saved.expectedVersion,0);
 assert.equal(saved.draft.notes,'Synthetic packet correction.');assert.equal(saved.draft.attested,false);
 assert.match(renderToStaticMarkup(draw()),/Saved private version 1/);
 conflict=true;find(n=>n.type==='textarea'&&n.props.rows===5).props.onChange({target:{value:' Keep this unfinished correction. '}});
 await submit();assert.equal(calls.length,3);assert.match(renderToStaticMarkup(draw()),/Another save changed this draft/);
 assert.equal(find(n=>n.type==='textarea'&&n.props.rows===5).props.value,' Keep this unfinished correction. ');
 assert.equal(find(n=>n.type==='button'&&n.props.type==='submit').props.disabled,true);
 await submit();assert.equal(calls.length,3,'uncertain save must not auto-retry');
 find(n=>n.type==='button'&&n.props.children==='Download working copy').props.onClick();
 assert.equal(calls.length,3);assert.equal(downloads.length,1);
 const copy=downloads[0] as ReturnType<typeof working.headTeachingWorkingCopy>;
 assert.equal(copy.kind,context.packetId);assert.equal(copy.workingDraft.notes,' Keep this unfinished correction. ');assert.equal(copy.editState.saveUncertain,true);assert.equal(copy.serverSaveConfirmed,false);
});

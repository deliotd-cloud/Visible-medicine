import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
function loadComponent(name:string,dependencies:Record<string,unknown>={},exportName=name){
  const source=readFileSync(new URL(`../components/${name}.tsx`,import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{} as Record<string,(props:any)=>any>};
  new Function('require','module','exports',compiled)((id:string)=>id in dependencies?dependencies[id]:require(id),module,module.exports);
  return module.exports[exportName];
}

const Navigator=loadComponent('HeadTeachingReviewNavigator');
const Sections=loadComponent('HeadTeachingReviewNavigator',{},'HeadTeachingReviewSections');
type Element={type:unknown;props:Record<string,any>};
function find(value:any,type:unknown):Element|undefined{
  if(!value||typeof value!=='object')return;
  if(value.type===type)return value;
  const children=value.props?.children;
  for(const child of Array.isArray(children)?children:[children]){
    const result=find(child,type);if(result)return result;
  }
}

test('declared DETAILS, LI, SECTION and P targets open only ancestors and focus before scrolling',()=>{
  const targets=['summary','bone','clinical','correction'].map(id=>({id,label:id}));
  const handler=find(Navigator({targets}),'form')!.props.onSubmit;
  for(const tag of ['DETAILS','LI','SECTION','P']){
    const calls:string[]=[];
    const main={contains(node:unknown){return node===target||node===ancestor;}};
    const ancestor={tagName:'DETAILS',open:false,parentElement:main};
    const heading={tagName:tag==='DETAILS'?'SUMMARY':'H3',attrs:new Map<string,string>(),hasAttribute(name:string){return this.attrs.has(name);},setAttribute(name:string,value:string){this.attrs.set(name,value);},focus(options:unknown){calls.push(`focus:${JSON.stringify(options)}`);}};
    const target={tagName:tag,open:false,parentElement:ancestor,attrs:new Map<string,string>(),hasAttribute(name:string){return this.attrs.has(name);},setAttribute(name:string,value:string){this.attrs.set(name,value);},querySelector(selector:string){calls.push(`query:${selector}`);return tag==='P'?null:heading;},focus(options:unknown){calls.push(`target-focus:${JSON.stringify(options)}`);},scrollIntoView(options:unknown){calls.push(`scroll:${JSON.stringify(options)}`);}};
    const id=tag==='DETAILS'?'summary':tag==='LI'?'bone':tag==='SECTION'?'clinical':'correction';
    let prevented=false;
    handler({preventDefault(){prevented=true;},currentTarget:{closest(){return main;},ownerDocument:{getElementById(found:string){assert.equal(found,id);return target;}},elements:{namedItem(){return {value:id};}}}});
    assert(prevented);assert(ancestor.open);if(tag==='DETAILS')assert(target.open);
    const focusIndex=calls.findIndex(call=>call.startsWith('focus:')||call.startsWith('target-focus:'));
    assert(focusIndex>=0&&focusIndex<calls.findIndex(call=>call.startsWith('scroll:')));
    assert.match(calls[focusIndex],/"preventScroll":true/);
    assert.match(calls.at(-1)!,/"behavior":"instant"/);
    if(tag==='DETAILS')assert.equal(heading.attrs.size,0);
    else assert.equal((tag==='P'?target:heading).attrs.get('tabindex'),'-1');
  }
});

test('unknown, empty, missing and foreign choices cause no focus, opening or scrolling',()=>{
  const handler=find(Navigator({targets:[{id:'allowed',label:'Allowed'}]}),'form')!.props.onSubmit;
  let emptyLookup=0;
  handler({preventDefault(){},currentTarget:{closest(){return {contains(){return true;}};},ownerDocument:{getElementById(){emptyLookup++;return null;}},elements:{namedItem(){return null;}}}});
  assert.equal(emptyLookup,0);
  for(const selected of ['', 'other', 'allowed'])for(const location of ['missing','foreign']){
    let lookups=0,changes=0;
    const target={tagName:'SECTION',parentElement:null,focus(){changes++;},scrollIntoView(){changes++;}};
    const main={contains(){return false;}};
    handler({preventDefault(){},currentTarget:{closest(){return main;},ownerDocument:{getElementById(){lookups++;return location==='missing'?null:target;}},elements:{namedItem(){return {value:selected};}}}});
    assert.equal(changes,0);assert.equal(lookups,selected==='allowed'?1:0);
  }
});

test('private notes render once directly after revision checklist and before comparisons',()=>{
  const revision='exact';
  const note={conceptId:'sample',anatomy:{text:'Anatomy'},function:{text:'Function'},task:'Task'};
  const teaching={HEAD_TEACHING_REVISION:'teaching',headTeachingPacket:()=>({content:{headRevision:revision,notes:[note],reviewChecks:[],sources:[]},bindings:[]}),headTeachingForConcept:()=>({concept:{label:'Sample',atlasHref:'/atlas'},imaging:{text:'Image'},scope:'Scope'})};
  const learning={HEAD_LEARNING_REVISION:'learning',headLearningPacket:()=>({headRevision:revision,teachingRevision:'teaching',sequences:[],scope:'Scope'}),headLearningLinks:()=>null};
  const clinical={BRAINSTEM_CLINICAL_REVISION:'brainstem',brainstemClinicalPacket:()=>({content:{headRevision:'other',notes:[]}}),brainstemClinicalForConcept:()=>null};
  const ventricular={VENTRICULAR_CLINICAL_REVISION:'ventricular',ventricularClinicalPacket:()=>({content:{headRevision:'other',notes:[]}}),ventricularClinicalForConcept:()=>null};
  const Review=loadComponent('HeadAtlasTeachingReview',{'../lib/head-atlas-teaching':teaching,'../lib/head-atlas-learning':learning,'../lib/head-brainstem-clinical.ts':clinical,'../lib/head-ventricular-clinical.ts':ventricular,'./HeadTeachingReviewNavigator':{HeadTeachingReviewNavigator:Navigator,HeadTeachingReviewSections:Sections},'./HeadReviewImageLink':{HeadReviewImageLink:()=>null}});
  const output=renderToStaticMarkup(React.createElement(Review,{revision,reviewNotes:React.createElement('aside',{id:'notes-probe'},'Private draft'),comparisonReview:React.createElement('aside',{id:'comparison-probe'},'Comparison')}));
  assert.equal(output.split('id="notes-probe"').length-1,1);
  assert.match(output,/<nav aria-label="Head review sections">/);
  assert.match(output,/<a href="\/workspace\/atlas-review\/source-comparisons">Source comparisons<\/a>/);
  assert(!output.includes('Back to source comparisons'));
  assert(output.indexOf('Exact revisions &amp; teaching checklist')<output.indexOf('id="notes-probe"'));
  assert(output.indexOf('id="notes-probe"')<output.indexOf('id="comparison-probe"'));
  const unavailable=renderToStaticMarkup(React.createElement(Review,{revision:'wrong',reviewNotes:React.createElement('aside',{id:'notes-probe'})}));
  assert(!unavailable.includes('notes-probe'));
});

test('valid facial packet is a closed disclosure with six keyed decisions; invalid packet remains alert section',async()=>{
  const revision='exact',teachingPin='teaching',clinicalPin='clinical';
  const items=['one','two','three'].map(conceptId=>({conceptId,binding:{label:conceptId,scopeNote:'Scope',ctHref:'/ct',atlasHref:'/atlas'},ct:{id:conceptId,label:conceptId,laterality:'none',representation:'source'},atlas:{structureId:conceptId,sourceHash:'hash'}}));
  const comparison={'../lib/head-ct-facial-comparison-review.ts':{HEAD_CT_FACIAL_COMPARISON_REVISION:'comparison',verifiedHeadCtFacialComparisonPacket:async()=>({items})}};
  const teaching={'../lib/head-ct-facial-teaching.ts':{HEAD_CT_FACIAL_TEACHING_REVISION:teachingPin,verifiedHeadCtFacialTeachingRevision:async()=>teachingPin,headCtFacialTeachingContent:{scope:'Teaching scope',notes:items.map(()=>({anatomy:{text:'Anatomy'},function:{text:'Function'},task:'Task'})),questions:items.map(()=>({prompt:'Prompt',explanation:'Explanation'})),sources:[],reviewChecks:[]}}};
  const clinical={'../lib/head-ct-facial-clinical.ts':{HEAD_CT_FACIAL_CLINICAL_REVISION:clinicalPin,verifiedHeadCtFacialClinicalRevision:async()=>clinicalPin,headCtFacialClinicalContent:{scope:'Clinical scope',notes:items.map(()=>({text:'Text',caution:'Caution',question:'Question',answer:'Answer'})),sources:[],reviewChecks:[]}}};
  const Review=loadComponent('HeadCtFacialTeachingReview',{'../lib/head-atlas-links.ts':{HEAD_LINK_REVISION:revision},...comparison,...teaching,...clinical,'./HeadCtFacialDecisionPanel':{HeadCtFacialDecisionPanel:({kind,conceptId}:any)=>React.createElement('div',{'data-decision':`${kind}:${conceptId}`})}});
  const valid=renderToStaticMarkup(await Review({manifestRevision:revision,teachingRevision:teachingPin,clinicalRevision:clinicalPin}));
  assert.match(valid,/^<details id="head-ct-facial-teaching-review" class="head-review-packet"/);
  assert(!/^<details[^>]*\sopen(?:=|\s|>)/.test(valid));
  assert.match(valid,/<summary><h2 id="head-ct-facial-teaching-title">/);
  assert.equal((valid.match(/data-decision=/g)??[]).length,6);
  const source=readFileSync(new URL('../components/HeadCtFacialTeachingReview.tsx',import.meta.url),'utf8');
  assert(source.includes('key={`teaching:${item.conceptId}:${teachingPin}`}'));
  assert(source.includes('key={`clinical:${item.conceptId}:${clinicalPin}`}'));
  for(const item of items)assert(valid.includes(`id="head-ct-facial-teaching-${item.conceptId}"`));
  assert(valid.includes('id="head-ct-facial-clinical-review"'));
  const invalid=renderToStaticMarkup(await Review({manifestRevision:'wrong',teachingRevision:teachingPin,clinicalRevision:clinicalPin}));
  assert.match(invalid,/^<section id="head-ct-facial-teaching-review" role="alert">/);
  assert(!invalid.includes('data-decision='));
});

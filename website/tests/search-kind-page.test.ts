import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import * as kind from '../lib/search-kind.ts';

const pageSource=readFileSync(new URL('../app/search/page.tsx',import.meta.url),'utf8');
const pageCode=ts.transpileModule(pageSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const searchSource=readFileSync(new URL('../lib/public-education-search.ts',import.meta.url),'utf8');
const searchCode=ts.transpileModule(searchSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Result={kind:string;title:string;summary:string;href:string;meta:string};
function page(results:Result[]){
  const calls:Array<[string,string]>=[];
  const output:{default?:(props:{searchParams:Promise<Record<string,unknown>>})=>Promise<unknown>}={};
  const publicSearch:{searchPublicEducation?:(query:string,kind:string)=>Promise<{results:Result[];availability:'complete'|'partial'}>}={};
  const searchModules:Record<string,unknown>={
    './catalog':{atlasModules:[]},
    './atlas-structure-search':{searchAtlasStructureLearning:()=>assert.fail('Available repository must not use the static fallback')},
    './platform-governance':{searchEducation:async(q:string,k:string)=>{calls.push([q,k]);return results;}},
    './search-kind':kind,
  };
  new Function('exports','require',searchCode)(publicSearch,(name:string)=>{assert(Object.hasOwn(searchModules,name),name);return searchModules[name];});
  assert.equal(typeof publicSearch.searchPublicEducation,'function');
  const modules:Record<string,unknown>={
    'react/jsx-runtime':requireJsx,
    'next/link':{default:({href,children,...props}:Record<string,unknown>)=>jsxRuntime.jsx('a',{href,...props,children})},
    '@/lib/public-education-search':publicSearch,
    '@/lib/search-kind':kind,
    './search.css':{},
  };
  new Function('exports','require',pageCode)(output,(name:string)=>{assert(Object.hasOwn(modules,name),name);return modules[name];});
  assert(output.default);
  return {render:async(params:Record<string,unknown>)=>{
    const tree=await output.default!({searchParams:Promise.resolve(params)}) as any;
    function inspect(node:any,path:string):void{
      if(Array.isArray(node)){node.forEach((child,index)=>inspect(child,`${path}/${index}`));return;}
      if(!node||typeof node!=='object'||!('type' in node))return;
      assert(node.type,`missing element at ${path}`);
      inspect(node.props?.children,`${path}/${String(node.type)}`);
    }
    inspect(tree,'page');
    return renderToStaticMarkup(tree);
  },calls};
}
const requireJsx=jsxRuntime;

test('search page renders normalized URL-backed filters, selected state and retained GET kind',async()=>{
  const fixture=page([{kind:'Course',title:'Pons course',summary:'Education only',href:'/courses/pons-course',meta:'Core'}]);
  const html=await fixture.render({q:'  Ｐｏｎｓ & brain  ',kind:'courses'});
  assert.deepEqual(fixture.calls,[['Pons & brain','courses']]);
  assert.match(html,/action="\/search" method="get"/);
  assert.match(html,/name="q" value="Pons &amp; brain"/);
  assert.match(html,/type="hidden" name="kind" value="courses"/);
  assert.match(html,/href="\/search\?q=Pons\+%26\+brain&amp;kind=courses" aria-current="page"/);
  assert.match(html,/href="\/courses\/pons-course"/);
  assert.doesNotMatch(html,/autofocus/i);
  assert.match(html,/Publication is not clinical approval/);
});

test('unknown and repeated kinds fall back to all; empty filter offers recovery',async()=>{
  const fixture=page([]);
  const html=await fixture.render({q:'Pons',kind:['courses','cases']});
  assert.deepEqual(fixture.calls,[['Pons','all']]);
  assert.match(html,/No anatomy or education content matched/);
  assert.match(html,/href="\/search\?q=Pons"/);
  const filtered=await fixture.render({q:'Pons',kind:'cases'});
  assert.match(filtered,/No cases matched/);
  assert.match(filtered,/Show all kinds/);
  assert.match(filtered,/Browse the Atlas/);
});

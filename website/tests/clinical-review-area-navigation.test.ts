import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/ClinicalReviewAreas.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
const mod={exports:{} as {ClinicalReviewAreas:(props:any)=>Node}};
new Function('require','module','exports',compiled)((name:string)=>name.endsWith('.css')?{}:require(name),mod,mod.exports);
const nodes=(v:any):Node[]=>Array.isArray(v)?v.flatMap(nodes):v&&typeof v==='object'&&v.props?[v,...nodes(v.props.children)]:[];
const text=(v:any):string=>Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):v==null?'':String(v);
test('the inbox is immediately available while review-area details start collapsed',()=>{
 for(const current of ['structures','head-learning','source-comparisons']){
  const root=mod.exports.ClinicalReviewAreas({current});
  const header=nodes(root).find(n=>n.type==='header')!,menu=nodes(root).find(n=>n.type==='details')!;
  assert.equal(menu.props.open,undefined);assert.match(text(menu),/^Browse review areas/);
  const links=nodes(header).filter(n=>n.type==='a');assert.equal(links.length,1);
  assert.equal(links[0].props.href,'/workspace/clinical-review-inbox');assert.equal(links[0].props.target,'_blank');assert.equal(links[0].props.rel,'noopener noreferrer');
  assert.match(links[0].props['aria-label'],/opens in a new tab/);
  assert.equal(nodes(root).filter(n=>n.props['aria-current']==='page').length,1);
  assert.equal(nodes(menu).filter(n=>n.type==='a').length,2);
  assert(!nodes(root).some(n=>n.type==='form'||n.type==='input'||n.type==='button'),'navigation cannot record a decision');
 }
});
test('Escape closes only the area menu and returns focus to its summary',()=>{
 const root=mod.exports.ClinicalReviewAreas({current:'structures'}),menu=nodes(root).find(n=>n.type==='details')!;
 const calls:string[]=[],target={open:true,querySelector:(selector:string)=>{assert.equal(selector,'summary');return {focus:()=>calls.push('focus')};}};
 const event=(key:string)=>({key,currentTarget:target,preventDefault:()=>calls.push('prevent'),stopPropagation:()=>calls.push('stop')});
 menu.props.onKeyDown(event('ArrowDown'));assert.deepEqual(calls,[]);assert(target.open);
 menu.props.onKeyDown(event('Escape'));assert(!target.open);assert.deepEqual(calls,['prevent','stop','focus']);
 menu.props.onKeyDown(event('Escape'));assert.equal(calls.length,3,'closed menu does not capture Escape');
});

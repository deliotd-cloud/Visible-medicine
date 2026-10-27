import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasStudySet.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>;key?:string};
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value&&typeof value==='object'&&'props'in value?[value,...nodes(value.props.children)]:[];
const content=(value:any):string=>Array.isArray(value)?value.map(content).join(''):value&&typeof value==='object'&&'props'in value?content(value.props.children):value==null?'':String(value);
const find=(root:Node,type:string,match:(node:Node)=>boolean=()=>true)=>{
  const found=nodes(root).filter(node=>node.type===type&&match(node));assert.equal(found.length,1,`expected one ${type}, found ${found.length}`);return found[0];
};
const entries=Array.from({length:18},(_,index)=>({id:`entry-${index+1}`,label:`Structure ${String(index+1).padStart(2,'0')}`} as HeadEntry));

function harness(initial:HeadEntry[],filteredAdd?:{count:number;total:number;onAdd:()=>void}){
  const slots:unknown[]=[],effects:Array<()=>void>=[],calls:unknown[][]=[];
  let cursor=0,rows=initial,dirty=false;
  const hooks={
    useState(value:unknown){const slot=cursor++;if(!(slot in slots))slots[slot]=value;return [slots[slot],(next:unknown)=>{
      const replacement=typeof next==='function'?(next as (previous:unknown)=>unknown)(slots[slot]):next;
      if(!Object.is(replacement,slots[slot])){slots[slot]=replacement;dirty=true;}
    }];},
    useEffect(create:()=>void){effects.push(create);},
  };
  const mod={exports:{} as {HeadAtlasStudySet:(props:Record<string,unknown>)=>Node}};
  new Function('require','module','exports',compiled)((name:string)=>name==='react'?hooks:
    name==='react/jsx-runtime'?require('react/jsx-runtime'):
    name==='../lib/head-atlas-display'?require('../lib/head-atlas-display.ts'):
    name==='../lib/head-study-set'?require('../lib/head-study-set.ts'):require(name),mod,mod.exports);
  function render(){let tree:Node,passes=0;do{
    assert(++passes<8,'state settles');dirty=false;cursor=0;effects.length=0;
    tree=mod.exports.HeadAtlasStudySet({entries:rows,filteredAdd,onSelect:(entry:HeadEntry)=>calls.push(['select',entry]),
      onRemove:(entry:HeadEntry)=>{calls.push(['remove',entry]);rows=rows.filter(item=>item!==entry);},
      onClear:()=>{calls.push(['clear']);rows=[];},
      onMove:(entry:HeadEntry,direction:-1|1)=>calls.push(['move',entry,direction]),
      onPractice:(mode:string,order?:string)=>calls.push(['practice',mode,order])});
    for(const effect of effects)effect();
  }while(dirty);return tree!;}
  return {render,calls,setEntries:(value:HeadEntry[])=>{rows=value;}};
}

test('large sets page both lists together, retain absolute ordering and practise every entry',()=>{
  const h=harness(entries);let tree=h.render();
  const main=()=>find(tree,'ol',node=>node.props['aria-label']!=='Arrange study set');
  const arrange=()=>find(tree,'ol',node=>node.props['aria-label']==='Arrange study set');
  const ids=(list:Node)=>nodes(list).filter(node=>node.type==='li').map(node=>node.key);
  assert.deepEqual(ids(main()),entries.slice(0,8).map(entry=>entry.id));assert.deepEqual(ids(arrange()),ids(main()));
  assert.match(content(tree),/Practice includes all 18 structures, even those hidden by search/);
  assert.equal(find(tree,'button',node=>content(node)==='Previous page').props.disabled,true);
  const focused:string[]=[];
  find(tree,'button',node=>content(node)==='Next page').props.onClick({currentTarget:{closest:()=>({querySelector:()=>({focus:()=>focused.push('page')})})}});tree=h.render();
  assert.deepEqual(ids(main()),entries.slice(8,16).map(entry=>entry.id));assert.deepEqual(ids(arrange()),ids(main()));
  assert.deepEqual(focused,['page']);
  const earlier=find(arrange(),'button',node=>node.props['aria-label']==='Move Structure 09 earlier');
  assert.equal(earlier.props.disabled,false,'page boundary is not the set boundary');
  earlier.props.onClick({currentTarget:{closest:(selector:string)=>selector==='details'?{querySelector:(child:string)=>child==='summary'?{focus:()=>focused.push('arrange summary')}:null}:null}});
  assert.deepEqual(focused,['page','arrange summary'],'a paged move focuses the stable arrange summary');
  assert.deepEqual(h.calls.at(-1),['move',entries[8],-1]);
  find(tree,'button',node=>content(node)==='Practise study set (18)').props.onClick({currentTarget:{closest:()=>({querySelector:()=>({value:'study-set'})})}});
  assert.deepEqual(h.calls.at(-1),['practice','locate','study-set'],'paging does not reduce practice to visible rows');
  find(tree,'button',node=>content(node)==='Next page').props.onClick({currentTarget:{closest:()=>({querySelector:()=>({focus:()=>focused.push('page')})})}});tree=h.render();
  assert.deepEqual(ids(main()),entries.slice(16).map(entry=>entry.id));
  assert.equal(find(arrange(),'button',node=>node.props['aria-label']==='Move Structure 18 later').props.disabled,true);
});

test('search uses display labels, clears, reports no matches and clamps after removals',()=>{
  const h=harness(entries);let tree=h.render();
  const input=()=>find(tree,'input',node=>node.props.type==='search');
  input().props.onChange({currentTarget:{value:'structure 1'}});tree=h.render();
  assert.match(content(find(tree,'p',node=>node.props.role==='status')),/9 of 18 structures match/);
  assert.equal(nodes(tree).filter(node=>node.type==='li').length,16,'both lists show the same eight matches');
  input().props.onChange({currentTarget:{value:'missing'}});tree=h.render();
  assert.match(content(tree),/No matching structures in this study set/);
  assert.equal(nodes(tree).filter(node=>node.type==='li').length,0);
  let searchFocus=0;
  find(tree,'button',node=>content(node)==='Clear search').props.onClick({currentTarget:{closest:()=>({querySelector:(selector:string)=>selector==='input[type="search"]'?{focus:()=>{searchFocus++;}}:null})}});tree=h.render();
  assert.equal(searchFocus,1,'clear focuses the search input before its button disappears');
  assert.equal(input().props.value,'');
  const pageEvent={currentTarget:{closest:()=>({querySelector:()=>({focus:()=>{}})})}};
  find(tree,'button',node=>content(node)==='Next page').props.onClick(pageEvent);tree=h.render();
  find(tree,'button',node=>content(node)==='Next page').props.onClick(pageEvent);tree=h.render();
  h.setEntries(entries.slice(0,9));tree=h.render();
  assert.match(content(find(tree,'p',node=>node.props.role==='status')),/Page 2 of 2/);
  assert.deepEqual(nodes(find(tree,'ol',node=>node.props['aria-label']!=='Arrange study set')).filter(node=>node.type==='li').map(node=>node.key),[entries[8].id]);
  h.setEntries(entries.slice(0,8));tree=h.render();
  assert.equal(nodes(tree).filter(node=>node.type==='input'&&node.props.type==='search').length,0,'small sets keep the simple layout');
  assert.equal(nodes(find(tree,'ol',node=>node.props['aria-label']!=='Arrange study set')).filter(node=>node.type==='li').length,8);
  h.setEntries(entries);tree=h.render();
  input().props.onChange({currentTarget:{value:'Structure 18'}});tree=h.render();
  h.setEntries(entries.slice(0,8));h.render();h.setEntries(entries);tree=h.render();
  assert.equal(input().props.value,'','a hidden small-set search cannot return when the set grows');
  assert.match(content(find(tree,'p',node=>node.props.role==='status')),/18 of 18 structures match/);
});

test('filtered add checks availability and focuses the main summary before callback',()=>{
  const order:string[]=[];
  const enabled=harness(entries,{count:2,total:3,onAdd:()=>order.push('add')});let tree=enabled.render();
  const add=find(tree,'button',node=>content(node)==='Add filtered masks to study set (2)');
  add.props.onClick({currentTarget:{closest:()=>({querySelector:(selector:string)=>selector==='summary'?{focus:()=>order.push('focus')}:null})}});
  assert.deepEqual(order,['focus','add']);
  const unavailable=harness(entries,{count:0,total:0,onAdd:()=>order.push('invalid')});tree=unavailable.render();
  const disabled=find(tree,'button',node=>content(node)==='Add filtered masks to study set (0)');
  assert.equal(disabled.props.disabled,true);disabled.props.onClick({currentTarget:{closest:()=>({querySelector:()=>({focus:()=>order.push('bad-focus')})})}});
  assert.deepEqual(order,['focus','add']);
});

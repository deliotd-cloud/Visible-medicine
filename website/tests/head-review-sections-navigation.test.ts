import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import ts from 'typescript';
const require=createRequire(import.meta.url),mod={exports:{} as any};
const source=readFileSync(new URL('../components/HeadTeachingReviewNavigator.tsx',import.meta.url),'utf8');
new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(require,mod,mod.exports);
const click=mod.exports.HeadTeachingReviewSections({children:null}).props.onClick;
function fixture(kind='section',count=1){
 const events:string[]=[],nodes=new Set<unknown>();
 const main={contains:(node:unknown)=>nodes.has(node)};
 const heading={tagName:'H2',attrs:new Map<string,string>(),hasAttribute(key:string){return this.attrs.has(key);},setAttribute(key:string,value:string){this.attrs.set(key,value);},focus(){events.push('heading-focus');}};
 const summary={tagName:'SUMMARY',focus(){events.push('summary-focus');}};
 const ancestor={tagName:'DETAILS',open:false,parentElement:main};
 const nested={tagName:'DETAILS',open:false};
 const target:any={tagName:kind==='details'?'DETAILS':'SECTION',children:[],parentElement:ancestor,open:false,querySelector:()=>kind==='details'?summary:heading,scrollIntoView:(options:unknown)=>events.push('target-scroll:'+JSON.stringify(options))};
 const child={tagName:'DETAILS',open:false,parentElement:target,children:[nested],querySelector:()=>summary,scrollIntoView:(options:unknown)=>events.push('child-scroll:'+JSON.stringify(options))};
 const second={tagName:'DETAILS',open:false,parentElement:target};
 if(kind==='section')target.children=count===1?[child]:count===2?[child,second]:[];
 [ancestor,target,child,second].forEach(n=>nodes.add(n));
 const anchor={getAttribute:(key:string):string|null=>key==='href'?'#target':null,hasAttribute:()=>false};
 const origin={closest:()=>main,contains:(node:unknown)=>node===anchor,ownerDocument:{getElementById:(id:string)=>id==='target'?target:null}};
 const event:any={button:0,defaultPrevented:false,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,currentTarget:origin,target:{closest:()=>anchor},preventDefault(){events.push('prevent-default');}};
 return {event,origin,target,ancestor,child,second,nested,heading,events,anchor};
}
test('a section link opens its single outer disclosure and ancestors, retaining nested and unrelated notes',()=>{
 const f=fixture(),draft={value:'Synthetic unsaved correction'};f.child.children.push(draft as any);
 click(f.event);assert(f.ancestor.open&&f.child.open);assert(!f.nested.open&&!f.second.open);assert.equal(draft.value,'Synthetic unsaved correction');assert(f.child.children.includes(draft as any));
 assert.deepEqual(f.events,['summary-focus','child-scroll:{"block":"start","behavior":"instant"}','prevent-default']);
});
test('direct details focus their summary; unavailable sections focus their existing heading',()=>{
 const direct=fixture('details');click(direct.event);assert(direct.target.open);assert.equal(direct.events[0],'summary-focus');
 const unavailable=fixture('section',0);click(unavailable.event);assert.equal(unavailable.events[0],'heading-focus');assert.equal(unavailable.heading.attrs.get('tabindex'),'-1');assert(!unavailable.child.open);
});
test('a multi-disclosure section does not arbitrarily open one child',()=>{
 const f=fixture('section',2);click(f.event);assert(!f.child.open&&!f.second.open);assert.equal(f.events[0],'heading-focus');
});
test('modified, prevented, secondary, download and new-context activations keep native behavior',()=>{
 for(const patch of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{defaultPrevented:true},{button:1}]){const f=fixture();click({...f.event,...patch});assert.deepEqual(f.events,[]);assert(!f.child.open);}
 for(const type of ['download','target']){const f=fixture();f.anchor.hasAttribute=()=>type==='download';f.anchor.getAttribute=key=>key==='target'&&type==='target'?'_blank':key==='href'?'#target':null;click(f.event);assert.deepEqual(f.events,[]);}
});
test('malformed, missing and foreign fragment targets do not change focus or disclosures',()=>{
 for(const href of ['#','#missing','#bad%ZZ']){const f=fixture();f.anchor.getAttribute=key=>key==='href'?href:null;click(f.event);assert.deepEqual(f.events,[]);}
 const foreign=fixture();foreign.origin.ownerDocument.getElementById=()=>({}) as any;click(foreign.event);assert.deepEqual(foreign.events,[]);
 const text=fixture();text.event.target={};click(text.event);assert.deepEqual(text.events,[]);
});

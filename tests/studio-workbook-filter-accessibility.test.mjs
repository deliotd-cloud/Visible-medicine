import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require=createRequire(process.env.VM_WEBSITE_PACKAGE??import.meta.url);
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const componentPath=process.env.VM_STUDIO_COMPONENT??join(root,'components/StudioWorkbookTable.tsx');

function compile(source,imports){
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(name=>{assert(name in imports,`unexpected import: ${name}`);return imports[name];},mod,mod.exports);
 return mod.exports;
}
const queues=compile(readFileSync(join(root,'lib/studio-queues.ts'),'utf8'),{});
const Link=({children,href,...props})=>React.createElement('a',{href,...props},children);
function harness(initialQueue='all'){
 const slots=[];let cursor=0,tree;
 const hooks={useMemo:compute=>compute(),useState:initial=>{
  const index=cursor++;if(!(index in slots))slots[index]=initial;
  return [slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];
 }};
 const {StudioWorkbookTable}=compile(readFileSync(componentPath,'utf8'),{
  'next/link':{__esModule:true,default:Link},react:hooks,
  'react/jsx-runtime':require('react/jsx-runtime'),'../lib/studio-queues.ts':queues,
 });
 function render(workbooks){cursor=0;tree=StudioWorkbookTable({workbooks,initialQueue});return renderToStaticMarkup(tree);}
 function all(predicate){
  const matches=[];
  function walk(node){
   if(Array.isArray(node)){for(const child of node)walk(child);return;}
   if(!node||typeof node!=='object'||!('props'in node))return;
   if(predicate(node))matches.push(node);
   walk(node.props.children);
  }
  walk(tree);return matches;
 }
 function find(predicate){return all(predicate)[0];}
 const text=node=>(Array.isArray(node.props.children)?node.props.children:[node.props.children]).join('');
 const count=()=>find(node=>node.type==='small'&&text(node).endsWith(' workbooks'));
 return {render,all,find,count,countText:()=>text(count())};
}

const draft={id:'draft/one ?',title:'Draft workbook',courseTitle:'Course one',status:'draft',mode:'teaching',version:3,caseCount:2};
const published={id:'published/β ?#',title:'Published workbook',courseTitle:'Course two',status:'published',mode:'assessment',version:2,caseCount:1};

test('only the compact result count is a polite atomic status across filtered and true-empty states',()=>{
 const h=harness();let html=h.render([draft,published]);
 const status=()=>h.count();
 assert(status());assert.equal(h.countText(),'2 of 2 workbooks');
 assert.equal(status().props.role,'status');
 assert.equal(status().props['aria-live'],'polite');
 assert.equal(status().props['aria-atomic'],'true');
 assert.equal(h.all(node=>node!==status()&&(node.props.role==='status'||node.props.role==='alert'||node.props['aria-live']!==undefined)).length,0);
 assert.doesNotMatch(html,/role="alert"/);
 h.find(node=>node.type==='input'&&node.props.type==='search').props.onChange({target:{value:'no match'}});
 html=h.render([draft,published]);assert.equal(h.countText(),'0 of 2 workbooks');
 assert.match(html,/No workbooks match these filters/);
 html=h.render([]);assert.equal(h.countText(),'0 of 0 workbooks');
 assert.doesNotMatch(html,/<input|<select|<header|Show all workbooks/);
});

test('focused Show all resets three filters and transfers focus to visible Search without moving focus on other changes',()=>{
 const h=harness('editing');h.render([draft,published]);
 assert.equal(h.countText(),'1 of 2 workbooks');
 h.find(node=>node.type==='input'&&node.props.type==='search').props.onChange({target:{value:'missing'}});
 h.all(node=>node.type==='select')[1].props.onChange({target:{value:'teaching'}});
 h.render([draft,published]);assert.equal(h.countText(),'0 of 2 workbooks');
 const focusCalls=[];
 const search={focus(options){focusCalls.push(options);}};
 const origin={ownerDocument:{activeElement:null},closest(selector){
  assert.equal(selector,'.studio-data-section');
  return {querySelector(inputSelector){assert.equal(inputSelector,'.studio-search-field input[type="search"]');return search;}};
 }};
 origin.ownerDocument.activeElement=origin;
 h.find(node=>node.type==='button'&&node.props.children==='Show all workbooks').props.onClick({currentTarget:origin});
 assert.deepEqual(focusCalls,[{preventScroll:true}],'focus handoff occurs before the button is removed');
 h.render([draft,published]);
 assert.equal(h.countText(),'2 of 2 workbooks');
 assert.equal(h.find(node=>node.type==='input'&&node.props.type==='search').props.value,'');
 assert.deepEqual(h.all(node=>node.type==='select').map(node=>node.props.value),['all','all']);
 assert.equal(h.find(node=>node.type==='button'&&node.props.children==='Show all workbooks'),undefined);

 h.find(node=>node.type==='input'&&node.props.type==='search').props.onChange({target:{value:'absent'}});
 h.render([draft,published]);assert.equal(h.countText(),'0 of 2 workbooks');
 assert.equal(focusCalls.length,1,'typing does not move focus');
 h.find(node=>node.type==='button'&&node.props.children==='Clear').props.onClick({currentTarget:origin});
 h.render([draft,published]);assert.equal(h.countText(),'2 of 2 workbooks');
 assert.equal(focusCalls.length,1,'Clear does not move focus');
 h.all(node=>node.type==='select')[0].props.onChange({target:{value:'editing'}});
 h.render([draft,published]);assert.equal(focusCalls.length,1,'filter selection does not move focus');

 const unfocused=harness('editing');unfocused.render([published]);
 const other={};origin.ownerDocument.activeElement=other;
 unfocused.find(node=>node.type==='button'&&node.props.children==='Show all workbooks').props.onClick({currentTarget:origin});
 assert.equal(focusCalls.length,1,'an unfocused reset does not steal focus');
 assert.equal(unfocused.render([published]).includes('1 of 1 workbooks'),true);
});

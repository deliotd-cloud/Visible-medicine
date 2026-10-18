import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');

function compile(source,imports){
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)((name)=>{
    assert(name in imports,`unexpected import: ${name}`);return imports[name];
  },mod,mod.exports);
  return mod.exports;
}

const queues=compile(readFileSync(new URL('../lib/studio-queues.ts',import.meta.url),'utf8'),{});
const Link=({children,href,...props})=>React.createElement('a',{href,...props},children);
function harness(initialQueue='all'){
  const slots=[];let cursor=0;
  const hooks={useMemo:(compute)=>compute(),useState:(initial)=>{
    const index=cursor++;
    if(!(index in slots))slots[index]=initial;
    return [slots[index],(value)=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];
  }};
  const {StudioWorkbookTable}=compile(readFileSync(new URL('../components/StudioWorkbookTable.tsx',import.meta.url),'utf8'),{
    'next/link':{__esModule:true,default:Link},
    react:hooks,
    'react/jsx-runtime':require('react/jsx-runtime'),
    '../lib/studio-queues.ts':queues,
  });
  let tree;
  function render(workbooks,queue=initialQueue){cursor=0;tree=StudioWorkbookTable({workbooks,initialQueue:queue});return renderToStaticMarkup(tree);}
  function find(predicate){
    function walk(node){
      if(Array.isArray(node)){for(const child of node){const found=walk(child);if(found)return found;}return null;}
      if(!node||typeof node!=='object'||!('props' in node))return null;
      if(predicate(node))return node;
      return walk(node.props.children);
    }
    return walk(tree);
  }
  return {render,find};
}

const draft={id:'draft/one ?',title:'Draft workbook',courseTitle:'Course one',status:'draft',mode:'teaching',version:3,caseCount:2};
const published={id:'published/β ?#',title:'Published workbook',courseTitle:'Course two',status:'published',mode:'assessment',version:2,caseCount:1};

test('zero authorised workbooks gives one course path and no dead filters or table header',()=>{
  for(const queue of ['all','editing']){
    const h=harness(queue),html=h.render([]);
    assert.match(html,/<h2 id="workbook-list-title">Find a workbook<\/h2>/);
    assert.match(html,/0 of 0 workbooks/);
    assert.match(html,/No workbooks yet\./);
    assert.match(html,/href="\/studio\/courses">Go to courses/);
    assert.doesNotMatch(html,/<input|<select|<header|>Clear<|Show all workbooks|No workbooks match these filters/);
    assert.equal((html.match(/href="\/studio\/courses"/g)??[]).length,1);
  }
});

test('filtered-empty populated collection retains controls, table header, and Show all reset',()=>{
  const h=harness('editing');
  let html=h.render([published]);
  assert.match(html,/0 of 1 workbooks/);
  assert.match(html,/No workbooks match these filters\./);
  assert.match(html,/Show all workbooks/);
  assert.match(html,/<header>/);
  assert.doesNotMatch(html,/No workbooks yet|Go to courses/);
  h.find(node=>node.type==='button'&&node.props.children==='Show all workbooks').props.onClick();
  html=h.render([published]);
  assert.match(html,/1 of 1 workbooks/);
  assert.match(html,/Published workbook/);
  assert.match(html,/href="\/studio\/workbooks\/published%2F%CE%B2%20%3F%23\/builder"/);
  assert.match(html,/aria-label="Open Published workbook"/);
});

test('same component can move empty → populated → filtered-empty → empty without stale empty actions',()=>{
  const h=harness();
  assert.match(h.render([]),/No workbooks yet\./);
  let html=h.render([draft,published]);
  assert.match(html,/2 of 2 workbooks/);
  assert.match(html,/href="\/studio\/workbooks\/draft%2Fone%20%3F\/builder"/);
  assert.match(html,/aria-label="Edit Draft workbook"/);
  const search=h.find(node=>node.type==='input'&&node.props.type==='search');
  assert(search);
  search.props.onChange({target:{value:'no such workbook'}});
  html=h.render([draft,published]);
  assert.match(html,/0 of 2 workbooks/);
  assert.match(html,/No workbooks match these filters\./);
  assert.doesNotMatch(html,/Go to courses/);
  html=h.render([]);
  assert.match(html,/0 of 0 workbooks/);
  assert.match(html,/No workbooks yet\./);
  assert.doesNotMatch(html,/No workbooks match these filters|<input|<header/);
  h.find(node=>node.type==='a'&&node.props.href==='/studio/courses');
  html=h.render([draft,published]);
  assert.match(html,/0 of 2 workbooks/,'filter state remains available when the collection returns');
  h.find(node=>node.type==='button'&&node.props.children==='Show all workbooks').props.onClick();
  assert.match(h.render([draft,published]),/2 of 2 workbooks/);
});

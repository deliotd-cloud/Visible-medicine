import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=new URL('../',import.meta.url);
const css=readFileSync(new URL('components/imaging-atlas-shell.css',root),'utf8');
function compile(path,imports){
  const source=readFileSync(new URL(path,root),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)(name=>imports[name]??(name.endsWith('.css')?{}:require(name)),mod,mod.exports);
  return mod.exports;
}
const {focusImagingPane}=compile('lib/imaging-pane-focus.ts',{});
const {ImagingPaneNavigation}=compile('components/ImagingPaneNavigation.tsx',{'../lib/imaging-pane-focus':{focusImagingPane}});

function harness(){
  const slots=[];
  let cursor=0, effects=[], dirty=false, tree, props, cleanups=[];
  const hooks={
    useRef(value){const index=cursor++;return slots[index]??(slots[index]={current:value});},
    useState(value){const index=cursor++;if(!(index in slots))slots[index]=value;return [slots[index],next=>{const value=typeof next==='function'?next(slots[index]):next;if(value!==slots[index]){slots[index]=value;dirty=true;}}];},
    useEffect(){cursor++;},
    useLayoutEffect(fn){cursor++;effects.push(fn);},
  };
  const {ImagingAtlasShell}=compile('components/ImagingAtlasShell.tsx',{
    react:hooks,
    'next/link':{__esModule:true,default:({children})=>children},
    './AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:()=>null},
    './ImagingPaneNavigation':{ImagingPaneNavigation},
    '../lib/imaging-pane-focus':{focusImagingPane},
  });
  function nodes(node){
    if(!node||typeof node!=='object')return [];
    const children=node.props?.children;
    return [node,...(Array.isArray(children)?children.flatMap(nodes):nodes(children))];
  }
  function find(predicate){return nodes(tree).find(predicate);}
  function prepare(next=props){
    props=next;
    cursor=0;effects=[];dirty=false;
    tree=ImagingAtlasShell(props);
    return tree;
  }
  function commit(){
    for(let attempt=0;attempt<5;attempt++){
      const pending=effects;
      effects=[];dirty=false;
      for(const effect of pending){
        const cleanup=effect();
        if(typeof cleanup==='function'&&!cleanups.includes(cleanup))cleanups.push(cleanup);
      }
      if(!dirty)break;
      prepare(props);
    }
    return tree;
  }
  function render(next=props){prepare(next);return commit();}
  function unmount(){for(const cleanup of cleanups)cleanup();cleanups=[];}
  function pane(name){return find(node=>node.props?.['data-imaging-pane']===name);}
  function toggle(){return find(node=>node.props?.className==='imaging-image-focus-toggle');}
  function shortcutHandler(name){
    const nav=find(node=>node.type===ImagingPaneNavigation);
    const buttons=ImagingPaneNavigation(nav.props).props.children;
    const button=buttons.find(item=>item.key===name);
    return button.props.onClick;
  }
  function shortcut(name,origin){shortcutHandler(name)({currentTarget:origin});}
  const calls=[];
  const origin={isConnected:true,closest:()=>({querySelector:selector=>{
    const name=selector.match(/data-imaging-pane="([^"]+)"/)?.[1];
    const target=pane(name);
    assert.notEqual(target.props.hidden,true,`focus target ${name} must be visible after commit`);
    return {ownerDocument:{defaultView:{innerHeight:800,innerWidth:1200}},getBoundingClientRect:()=>({top:100,bottom:500,left:100,right:900}),focus:()=>calls.push(name)};
  }})};
  return {render,prepare,commit,unmount,pane,toggle,shortcut,shortcutHandler,origin,calls,find};
}

const base={title:'CT head',modality:'ct',regionId:'head-neck',notice:'Education',sidebar:{id:'index-state'},children:{id:'native-scan-state'},info:{id:'learning-state'}};

test('opt-in focus expands the image while retaining mounted pane children and restores panels',()=>{
  const h=harness(),study={id:'study-a'};
  h.render({...base,canFocusImages:true,imageFocusContext:study});
  assert.equal(h.toggle().props.children,'Focus images');
  h.toggle().props.onClick();h.render();
  assert.equal(h.toggle().props.children,'Restore panels');
  assert.equal(h.toggle().props['aria-pressed'],true);
  assert.equal(h.pane('index').props.hidden,true);
  assert.equal(h.pane('learning').props.hidden,true);
  assert.equal(h.pane('image').props.hidden,undefined);
  assert.equal(h.pane('index').props.children,base.sidebar);
  assert.equal(h.pane('learning').props.children,base.info);
  assert.equal(h.pane('image').props.children.at(-1).props.children,base.children);
  assert.match(h.find(node=>String(node.props?.className).includes('imaging-workspace-grid')).props.className,/is-image-focused/);
  h.toggle().props.onClick();h.render();
  assert.equal(h.pane('index').props.hidden,false);
  assert.equal(h.pane('learning').props.hidden,false);
});

test('context and availability changes retire focus without sticky reactivation',()=>{
  const h=harness(),a={},b={};
  const ready={...base,canFocusImages:true,imageFocusContext:a};
  h.render(ready);h.toggle().props.onClick();h.render();
  h.render({...ready,imageFocusContext:b});
  assert.equal(h.pane('index').props.hidden,false);
  h.render(ready);assert.equal(h.pane('index').props.hidden,false);
  h.toggle().props.onClick();h.render();
  h.render({...ready,canFocusImages:false});
  assert.equal(h.toggle(),undefined);assert.equal(h.pane('learning').props.hidden,false);
  h.render(ready);assert.equal(h.pane('index').props.hidden,false);
  h.toggle().props.onClick();h.render();
  h.render({...ready,comparison:'Comparison'});
  assert.equal(h.toggle(),undefined);assert.equal(h.pane('learning').props.hidden,false);
  h.render(ready);assert.equal(h.pane('index').props.hidden,false);
  h.render({...ready,imageFocusContext:null});assert.equal(h.toggle(),undefined);
});

test('pane shortcuts restore before focusing, while image shortcut preserves focus mode',()=>{
  const h=harness(),study={};h.render({...base,canFocusImages:true,imageFocusContext:study});
  h.toggle().props.onClick();h.render();
  h.shortcut('image',h.origin);assert.deepEqual(h.calls,['image']);assert.equal(h.pane('index').props.hidden,true);
  h.shortcut('learning',h.origin);assert.deepEqual(h.calls,['image']);
  h.render();assert.deepEqual(h.calls,['image','learning']);assert.equal(h.pane('learning').props.hidden,false);
  h.toggle().props.onClick();h.render();
  h.shortcut('index',h.origin);h.render();assert.deepEqual(h.calls,['image','learning','index']);
});

test('abandoned and stale restoration requests never focus a hidden or replacement pane',()=>{
  const h=harness(),a={},b={};const ready={...base,canFocusImages:true,imageFocusContext:a};
  h.render(ready);h.toggle().props.onClick();h.render();
  h.shortcut('learning',h.origin);h.shortcut('image',h.origin);h.render();
  assert.deepEqual(h.calls,['image']);
  h.toggle().props.onClick();h.render();
  h.shortcut('index',h.origin);h.render({...ready,imageFocusContext:b});
  assert.deepEqual(h.calls,['image']);assert.equal(h.pane('index').props.hidden,false);
});

test('handlers from abandoned, replaced and unmounted renders cannot change focus state',()=>{
  const h=harness(),a={},b={};
  const first={...base,canFocusImages:true,imageFocusContext:a};
  const replacement={...base,canFocusImages:true,imageFocusContext:b};
  h.render(first);
  const committedToggle=h.toggle().props.onClick;
  const committedShortcut=h.shortcutHandler('image');

  h.prepare(replacement);
  const abandonedToggle=h.toggle().props.onClick;
  const abandonedShortcut=h.shortcutHandler('image');
  abandonedToggle();abandonedShortcut({currentTarget:h.origin});
  h.prepare(first);h.commit();
  assert.equal(h.pane('index').props.hidden,false);
  assert.deepEqual(h.calls,[]);

  h.render(replacement);
  committedToggle();committedShortcut({currentTarget:h.origin});
  h.render();
  assert.equal(h.pane('index').props.hidden,false);
  assert.deepEqual(h.calls,[]);

  const finalToggle=h.toggle().props.onClick;
  const finalShortcut=h.shortcutHandler('index');
  h.unmount();
  finalToggle();finalShortcut({currentTarget:h.origin});
  assert.deepEqual(h.calls,[]);
});

test('scoped responsive image layout fills the grid and preserves small-screen panel layout',()=>{
  assert.match(css,/\.imaging-workspace-grid\.is-image-focused\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(css,/\.imaging-workspace-grid\.is-image-focused>\.imaging-workspace-viewer\{grid-column:1;min-width:0\}/);
  assert.match(css,/\.imaging-workspace-grid\.is-image-focused>aside\[hidden\]\{display:none\}/);
  assert.match(css,/@media\(max-width:520px\)/);
  assert.match(css,/\.imaging-workspace-grid\{display:flex;flex-direction:column\}/);
  assert.match(css,/\[data-imaging-pane\]:focus-visible\{outline:2px solid var\(--imaging-teal\)/);
});

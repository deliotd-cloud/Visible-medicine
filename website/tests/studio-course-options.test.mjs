import { loadOutlineHelper } from './studio-outline-helper-loader.mjs';
import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const source=readFileSync(new URL('../components/StudioCourseEditor.tsx',import.meta.url),'utf8');
const outlineHelper = loadOutlineHelper(ts, new URL('../components/StudioCourseEditor.tsx', import.meta.url));
function editor(){
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const slots=[],layouts=new Map();let cursor=0;
 const react={
  useRef(initial){const i=cursor++;return slots[i]??={current:initial};},
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],()=>{}];},
  useMemo(factory,deps){const i=cursor++,old=slots[i];if(!old||deps.some((value,at)=>!Object.is(value,old.deps[at])))slots[i]={deps,value:factory()};return slots[i].value;},
  useEffect(){cursor++;},
  useLayoutEffect(effect,deps){const i=cursor++,old=layouts.get(i);if(!old||deps.some((value,at)=>!Object.is(value,old.deps[at])))layouts.set(i,{deps,effect,cleanup:old?.cleanup,pending:true});},
 };
 const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 const mocks={'../lib/studio-outline-navigation.ts': outlineHelper,react,'react/jsx-runtime':jsx,'next/link':'a','next/navigation':{useSearchParams:()=>null},'./StudioForms':{CreateWorkbookForm:'create',DuplicateCourseButton:'duplicate',EditCourseDetailsForm:'edit',ReleaseDraftForm:'release'}};
 const module={exports:{}};new Function('require','module','exports',code)(name=>{assert(Object.hasOwn(mocks,name),name);return mocks[name];},module,module.exports);
 const scope={actorId:'edu:synthetic-editor',organizationId:'synthetic-org'};
 const tree=module.exports.StudioCourseEditor({course:{id:'synthetic-course'},workbooks:[],releases:[],recoveryScope:scope});
 for(const layout of layouts.values())if(layout.pending){layout.pending=false;layout.cleanup?.();layout.cleanup=layout.effect();}
 const all=n=>Array.isArray(n)?n.flatMap(all):n?.props?[n,...all(n.props.children)]:[];return{nodes:all(tree),scope};
}
test('course options remain a native disclosure with a labelled bounded panel and trusted duplicate scope',()=>{
 const {nodes,scope}=editor(),details=nodes.find(n=>n.type==='details'&&n.props.className==='course-options'),summary=nodes.find(n=>n.type==='summary'&&n.props.children==='Course options'),panel=nodes.find(n=>n.props.id==='course-options-panel');
 assert(details);assert.equal(details.props.open,undefined);assert.equal(summary.props['aria-controls'],panel.props.id);assert.equal(panel.props.role,'group');assert.equal(panel.props['aria-label'],'Course options');
 const duplicate=nodes.find(n=>n.type==='duplicate');assert.equal(duplicate.props.recoveryScope,scope);assert.equal(duplicate.props.courseId,'synthetic-course');
 const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');assert.match(css,/\.course-options-panel\s*\{[^}]*position: absolute;[^}]*max-width: calc\(100vw - 48px\)/);assert.match(css,/\.course-options:not\(\[open\]\) > \.course-options-panel\s*\{ display: none; \}/);
});
test('Escape closes an open options panel, restores summary focus and does not change ordinary keys',()=>{
 const details=editor().nodes.find(n=>n.props.className==='course-options');let focused=0,prevented=0,stopped=0;
 const target={open:true,querySelector(selector){assert.equal(selector,'summary');return{focus(){focused++;}};}};
 const event={currentTarget:target,key:'Tab',preventDefault(){prevented++;},stopPropagation(){stopped++;}};details.props.onKeyDown(event);assert.equal(target.open,true);assert.equal(focused,0);
 event.key='Escape';details.props.onKeyDown(event);assert.equal(target.open,false);assert.equal(focused,1);assert.equal(prevented,1);assert.equal(stopped,1);
 details.props.onKeyDown(event);assert.equal(focused,1);
});
test('focus within options keeps it open; leaving the disclosure closes it without moving focus',()=>{
 const details=editor().nodes.find(n=>n.props.className==='course-options'),inside={};const target={open:true,contains(node){return node===inside;}};
 details.props.onBlur({currentTarget:target,relatedTarget:inside});assert.equal(target.open,true);
 details.props.onBlur({currentTarget:target,relatedTarget:{}});assert.equal(target.open,false);
 target.open=true;details.props.onBlur({currentTarget:target,relatedTarget:null});assert.equal(target.open,false);
});

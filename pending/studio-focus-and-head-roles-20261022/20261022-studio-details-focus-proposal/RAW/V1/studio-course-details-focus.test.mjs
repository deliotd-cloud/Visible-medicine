import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A staged run must name both the real dependency root and the proposed source.
const site = resolve(process.env.STUDIO_SITE_ROOT ?? fileURLToPath(new URL('../', import.meta.url)));
const sourcePath = resolve(process.env.STUDIO_EDITOR_SOURCE ?? resolve(site, 'components/StudioCourseEditor.tsx'));
const ts = createRequire(resolve(site, 'package.json'))('typescript');
const code = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
const jsx = (type, props) => ({type, props});
const nodes = n => Array.isArray(n) ? n.flatMap(nodes) : n?.props ? [n, ...nodes(n.props.children)] : [];

function fixture() {
  let url = new URL('https://example.test/studio/courses/one?pane=content');
  let course = {id:'one'}, tree, cursor = 0, dirty = false, focusCount = 0, summaryFocus = 0, tabFocus = 0;
  const slots = [], effects = [], listeners = new Set();
  const options = {open:true};
  const title = {focus(){focusCount++; document.activeElement=title;},closest(selector){return selector==='#course-details-editor'?{}:null;}};
  const document = {
    activeElement:null,
    querySelector(selector){assert(['.course-options','#course-details-editor:not([hidden]) input[name="title"]'].includes(selector));return selector==='.course-options'?options:visible()?title:null;},
    getElementById(id){return id.startsWith('course-')&&id.endsWith('-tab')?{focus(){tabFocus++;document.activeElement={closest:()=>null};}}:null;},
  };
  const window = {get location(){return url;},history:{state:{},pushState(state,_title,path){this.state=state;url=new URL(path,url);}},addEventListener(_name,fn){listeners.add(fn);},removeEventListener(_name,fn){listeners.delete(fn);}};
  const hooks = {
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],update=>{const value=typeof update==='function'?update(slots[i]):update;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},
    useEffect(fn,deps){const i=cursor++,prior=effects[i];if(!prior||deps.some((value,j)=>!Object.is(value,prior.deps[j])))effects[i]={fn,deps,cleanup:prior?.cleanup,pending:true};},
  };
  const mocks = {react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},'next/link':'a','next/navigation':{useSearchParams:()=>new URLSearchParams(url.search)},'./StudioForms':{CreateWorkbookForm:'create',DuplicateCourseButton:'duplicate',EditCourseDetailsForm:'edit',ReleaseDraftForm:'release'}};
  const module={exports:{}};
  new Function('require','module','exports','window','document',code)(name=>{assert(Object.hasOwn(mocks,name),name);return mocks[name];},module,module.exports,window,document);
  const find=predicate=>{const node=nodes(tree).find(predicate);assert(node);return node;};
  const visible=()=>!find(n=>n.props.id==='course-details-editor').props.hidden&&!find(n=>n.props.id==='course-content').props.hidden;
  function render(){for(let pass=0;pass<12;pass++){dirty=false;cursor=0;tree=module.exports.StudioCourseEditor({course,workbooks:[],releases:[],recoveryScope:{actorId:'synthetic',organizationId:'org'}}); // JSX is committed before effects run.
    for(const effect of effects)if(effect?.pending){effect.pending=false;effect.cleanup?.();effect.cleanup=effect.fn();}
    if(!dirty)return; }throw Error('Unstable render');}
  const toggle=()=>nodes(find(n=>n.props.className==='course-options')).find(n=>n.type==='button'&&n.props['aria-controls']==='course-details-editor').props.onClick();
  const recovery=()=>find(n=>n.type==='edit').props.onDraftRecoveryChange('recovered');
  render();
  return {render,toggle,recovery,find,options,title,document,get focusCount(){return focusCount;},get summaryFocus(){return summaryFocus;},get tabFocus(){return tabFocus;},setUrl(path){url=new URL(path,url);for(const fn of listeners)fn();},setCourse(id){course={id};},close(){for(const effect of effects)effect?.cleanup?.();}};
}

test('explicit options open closes disclosure and focuses real title only after visible commit; hide preserves outside focus',()=>{
  const app=fixture();try{assert.equal(app.focusCount,0);app.toggle();assert.equal(app.focusCount,0);app.render();assert.equal(app.options.open,false);assert.equal(app.focusCount,1);app.toggle();app.render();assert.equal(app.find(n=>n.props.id==='course-details-editor').props.hidden,true);assert.equal(app.focusCount,1);}finally{app.close();}
});
test('recovery notice alone is passive; its explicit action focuses title across pane transition',()=>{
  const app=fixture();try{app.setUrl('/studio/courses/one?pane=review');app.render();app.recovery();app.render();assert.equal(app.focusCount,0);const status=app.find(n=>n.props.id==='course-details-draft-status');nodes(status).find(n=>n.type==='button').props.onClick();assert.equal(app.focusCount,0);app.render();assert.equal(app.focusCount,1);assert.equal(app.find(n=>n.props.id==='course-review').props.hidden,true);}finally{app.close();}
});
test('closing via pane transition moves focus out of hidden form; course or route changes discard pending focus',()=>{
  const app=fixture();try{app.toggle();app.render();app.document.activeElement=app.title;app.setUrl('/studio/courses/one?pane=preview');app.render();assert.equal(app.tabFocus,1);app.toggle();app.setCourse('two');app.setUrl('/studio/courses/two?pane=content');app.render();assert.equal(app.focusCount,1);app.toggle();app.setUrl('/studio/courses/other?pane=content');app.render();assert.equal(app.focusCount,1);}finally{app.close();}
});

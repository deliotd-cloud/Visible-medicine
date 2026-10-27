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
  let course = {id:'one'}, scope={actorId:'synthetic',organizationId:'org'}, tree, cursor = 0, dirty = false, focusCount = 0, summaryFocus = 0, tabFocus = 0, repeatEffects=false;
  const slots = [], effects = [], listeners = new Set();
  const summary={focus(){summaryFocus++;document.activeElement=summary;},closest:()=>null};
  const options = {open:true,querySelector(selector){assert.equal(selector,'summary');return summary;}};
  const menuButton={closest(selector){assert.equal(selector,'details.course-options');return options;}};
  const title = {focus(){focusCount++; document.activeElement=title;},closest(selector){return selector==='#course-details-editor'?{}:null;}};
  const document = {
    activeElement:null,
    querySelector(selector){assert(['.course-options','#course-details-editor:not([hidden]) input[name="title"]'].includes(selector));return selector==='.course-options'?options:visible()?title:null;},
    getElementById(id){return id.startsWith('course-')&&id.endsWith('-tab')?{focus(){tabFocus++;document.activeElement={closest:()=>null};}}:null;},
  };
  const window = {get location(){return url;},history:{state:{},pushState(state,_title,path){this.state=state;url=new URL(path,url);}},addEventListener(_name,fn){listeners.add(fn);},removeEventListener(_name,fn){listeners.delete(fn);}};
  const hooks = {
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],update=>{const value=typeof update==='function'?update(slots[i]):update;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},
    useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useEffect(fn,deps){const i=cursor++,prior=effects[i];if(!prior||deps.some((value,j)=>!Object.is(value,prior.deps[j])))effects[i]={fn,deps,cleanup:prior?.cleanup,pending:true};},
    useMemo(factory, deps) {
      const i = cursor++, prior = slots[i];
      if (!prior || deps.some((value, j) => !Object.is(value, prior.deps[j])))
        slots[i] = {deps, value: factory()};
      return slots[i].value;
    },
    // This editor registers the layout hook before every passive hook.
    useLayoutEffect(callback, deps) { hooks.useEffect(callback, deps); },
  };
  const mocks = {react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},'next/link':'a','next/navigation':{useSearchParams:()=>new URLSearchParams(url.search)},'./StudioForms':{CreateWorkbookForm:'create',DuplicateCourseButton:'duplicate',EditCourseDetailsForm:'edit',ReleaseDraftForm:'release'}};
  const module={exports:{}};
  new Function('require','module','exports','window','document',code)(name=>{assert(Object.hasOwn(mocks,name),name);return mocks[name];},module,module.exports,window,document);
  const find=predicate=>{const node=nodes(tree).find(predicate);assert(node);return node;};
  const visible=()=>!find(n=>n.props.id==='course-details-editor').props.hidden&&!find(n=>n.props.id==='course-content').props.hidden;
  function render(){for(let pass=0;pass<12;pass++){dirty=false;cursor=0;tree=module.exports.StudioCourseEditor({course,workbooks:[],releases:[],recoveryScope:scope}); // JSX is committed before effects run.
    for(const effect of effects)if(effect?.pending){effect.pending=false;effect.cleanup?.();const cleanup=effect.fn();if(repeatEffects)effect.fn();effect.cleanup=cleanup;}
    if(!dirty)return; }throw Error('Unstable render');}
  const toggle=()=>nodes(find(n=>n.props.className==='course-options')).find(n=>n.type==='button'&&n.props['aria-controls']==='course-details-editor').props.onClick({currentTarget:menuButton});
  const recovery=()=>find(n=>n.type==='edit').props.onDraftRecoveryChange('recovered');
  render();
  return {render,toggle,recovery,find,options,title,summary,document,get focusCount(){return focusCount;},get summaryFocus(){return summaryFocus;},get tabFocus(){return tabFocus;},setUrl(path){url=new URL(path,url);for(const fn of listeners)fn();},setCourse(id){course={id};},setScope(actorId,organizationId){scope={actorId,organizationId};},repeatEffects(value){repeatEffects=value;},close(){for(const effect of effects)effect?.cleanup?.();}};
}

test('options open focuses committed title; keyboard Hide returns focus from menu button to visible summary',()=>{
  const app=fixture();try{assert.equal(app.focusCount,0);app.toggle();assert.equal(app.focusCount,0);app.render();assert.equal(app.options.open,false);assert.equal(app.focusCount,1);app.options.open=true;app.document.activeElement={closest:()=>app.options};app.toggle();assert.equal(app.summaryFocus,1);assert.equal(app.document.activeElement,app.summary);app.render();assert.equal(app.find(n=>n.props.id==='course-details-editor').props.hidden,true);assert.equal(app.focusCount,1);assert.equal(app.document.activeElement,app.summary);}finally{app.close();}
});
test('recovery notice alone is passive; its explicit action focuses title across pane transition',()=>{
  const app=fixture();try{app.setUrl('/studio/courses/one?pane=review');app.render();app.recovery();app.render();assert.equal(app.focusCount,0);const status=app.find(n=>n.props.id==='course-details-draft-status');nodes(status).find(n=>n.type==='button').props.onClick();assert.equal(app.focusCount,0);app.render();assert.equal(app.focusCount,1);assert.equal(app.find(n=>n.props.id==='course-review').props.hidden,true);}finally{app.close();}
});
test('closing via pane transition moves focus out of hidden form; course or route changes discard pending focus',()=>{
  const app=fixture();try{app.toggle();app.render();app.document.activeElement=app.title;app.setUrl('/studio/courses/one?pane=preview');app.render();assert.equal(app.tabFocus,1);app.toggle();app.setCourse('two');app.setUrl('/studio/courses/two?pane=content');app.render();assert.equal(app.focusCount,1);app.toggle();app.setUrl('/studio/courses/other?pane=content');app.render();assert.equal(app.focusCount,1);}finally{app.close();}
});
test('recovery Hide keeps focus on its visible notice action',()=>{
  const app=fixture();try{app.recovery();app.render();const action=nodes(app.find(n=>n.props.id==='course-details-draft-status')).find(n=>n.type==='button');action.props.onClick();app.render();const button={closest:()=>null};app.document.activeElement=button;nodes(app.find(n=>n.props.id==='course-details-draft-status')).find(n=>n.type==='button').props.onClick();app.render();assert.equal(app.document.activeElement,button);assert.equal(app.summaryFocus,0);assert.equal(app.find(n=>n.props.id==='course-details-editor').props.hidden,true);}finally{app.close();}
});
test('queued focus expires on actor, organization, or same-course pane change before commit',()=>{
  for(const [kind,change] of [['actor',app=>app.setScope('other','org')],['organization',app=>app.setScope('synthetic','other')],['pane',app=>app.setUrl('/studio/courses/one?pane=preview')]]){
    const app=fixture();try{app.toggle();change(app);app.render();assert.equal(app.focusCount,0,kind);app.render();assert.equal(app.focusCount,0,`${kind} repeat`);}finally{app.close();}
  }
});
test('repeated effect setup delivers explicit focus once and passive recovery never focuses',()=>{
  const app=fixture();try{app.repeatEffects(true);app.recovery();app.render();assert.equal(app.focusCount,0);app.toggle();app.render();assert.equal(app.focusCount,1);app.render();assert.equal(app.focusCount,1);}finally{app.close();}
});

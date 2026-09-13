import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
import {initialNoteNavigation, chooseNoteGroup, chooseNoteSection, noteGroups} from '../lib/atlas-note-navigation.ts';

let checks = 0;
const same = (a,b) => {checks++; assert.deepEqual(a,b);};
const unchanged = (a,b) => {checks++; assert.equal(a,b);};
const fresh = initialNoteNavigation();
same(fresh, {group:'anatomy',sections:{anatomy:'anatomy',clinical:'clinical',imaging:'ct'}});
assert.notEqual(fresh, initialNoteNavigation());
assert.notEqual(fresh.sections, initialNoteNavigation().sections);
// Visit every inner tab, leave its group and return. Other groups stay intact.
for(const group of noteGroups) for(const [tab] of group.sections) {
  let state=chooseNoteGroup(fresh, group.id, false);
  const before=structuredClone(state);
  state=chooseNoteSection(state, group.id, tab, false);
  same(state.sections[group.id],tab);
  for(const other of noteGroups.filter(g=>g.id!==group.id))same(state.sections[other.id],before.sections[other.id]);
  const alternate=noteGroups.find(g=>g.id!==group.id);
  state=chooseNoteGroup(state,alternate.id,false);
  state=chooseNoteGroup(state,group.id,false);
  same(state.sections[group.id],tab);
  for(const target of noteGroups) {
    unchanged(chooseNoteGroup(state,target.id,true),state);
    for(const [inner] of target.sections)unchanged(chooseNoteSection(state,target.id,inner,true),state);
  }
  for(const bad of [undefined,null,{},[],0,'','quiz','__proto__','constructor','foreign']) {
    unchanged(chooseNoteGroup(state,bad,false),state);
    unchanged(chooseNoteSection(state,group.id,bad,false),state);
    unchanged(chooseNoteSection(state,bad,tab,false),state);
  }
  for(const other of noteGroups.filter(g=>g.id!==group.id))for(const [wrong] of other.sections)unchanged(chooseNoteSection(state,group.id,wrong,false),state);
}
same(fresh,initialNoteNavigation());
let a=chooseNoteGroup(initialNoteNavigation(),'imaging',false);
a=chooseNoteSection(a,'imaging','mri',false);
const b=chooseNoteSection(initialNoteNavigation(),'anatomy','function',false);
same(a.sections.imaging,'mri');same(b.sections.imaging,'ct');
same(a.sections.anatomy,'anatomy');same(b.sections.anatomy,'function');

// Render actual provider and Base UI tabs with injected initial state. This
// proves panel wiring/rendering, not mounting or device behaviour (browser QA).
const source=await readFile('app/atlas-workspace.tsx','utf8');
assert.equal(source.split('useState(initialNoteNavigation)').length,2);
assert(!source.includes('localStorage')&&!source.includes('sessionStorage'));
const result=await build({
  stdin:{contents:"export {AtlasWorkspace,GroupedAnatomyNotes} from './app/atlas-workspace';",resolveDir:process.cwd(),loader:'tsx'},
  bundle:true,write:false,format:'cjs',platform:'node',
  plugins:[{name:'note-initial-state-fixture',setup(api){api.onLoad({filter:/atlas-workspace\.tsx$/},()=>({loader:'tsx',contents:source.replace('useState(initialNoteNavigation)','useState(() => globalThis.__notes ?? initialNoteNavigation())')}));}}],
});
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const mod={exports:{}};
const context={module:mod,exports:mod.exports,require:(id)=>id==='next/link'?({children,href})=>React.createElement('a',{href},children):require(id),console,process:{env:{NODE_ENV:'test'}}};
runInNewContext(result.outputFiles[0].text,context);
const {AtlasWorkspace,GroupedAnatomyNotes}=mod.exports;
let rendered=0,blocked=0;
for(const group of noteGroups)for(const [tab] of group.sections){
  context.__notes=chooseNoteSection(chooseNoteGroup(initialNoteNavigation(),group.id,false),group.id,tab,false);
  const view=(exam,child)=>React.createElement(AtlasWorkspace,{exam},React.createElement(GroupedAnatomyNotes,null,child));
  const html=render(view(false,id=>React.createElement('p',null,'note:'+id)));
  assert(html.includes('aria-label="Structure information"'));
  assert(html.includes('note:'+tab));
  const selectedLabels = [...html.matchAll(/<button\b[^>]*aria-selected="true"[^>]*>([\s\S]*?)<\/button>/g)]
    .map(match => match[1].replace(/<[^>]*>/g, '').trim());
  same(selectedLabels, [group.title, group.sections.find(([id]) => id === tab)[1]]);
  assert(!html.includes('note:quiz'));
  rendered++;
  let calls=0;
  const locked=render(view(true,()=>{calls++;return 'secret teaching';}));
  same(calls,0);assert(!locked.includes('Structure information'));assert(!locked.includes('secret teaching'));blocked++;
}
console.log(JSON.stringify({checks,actualPanelRenders:rendered,examSuppressedRenders:blocked,storageUsed:false,contentChanged:false,scope:'Pure transitions and actual server-rendered provider/tabs; resize/remount is separately browser-tested'}));

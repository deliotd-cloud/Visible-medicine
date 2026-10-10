import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const result=await build({stdin:{contents:"export {bodySystemToggle} from './lib/body-system-toggle';export {Switch} from './components/ui/switch';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'});
const module={exports:{}};runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,URL,TextEncoder,TextDecoder,console});
const {bodySystemToggle,Switch}=module.exports;
test('unavailable systems display unchecked and disabled without changing visibility intent',()=>{
 for(const enabled of [true,false])for(const locked of [true,false]){
  const state=bodySystemToggle(0,enabled,locked);assert.equal(state.available,false);assert.equal(state.checked,false);assert.equal(state.disabled,true);
  const html=renderToStaticMarkup(React.createElement(Switch,{checked:state.checked,disabled:state.disabled,'aria-label':'Show Nervous'}));
  assert.match(html,/role="switch"/);assert.match(html,/aria-checked="false"/);assert.match(html,/disabled/);
 }
});
test('available and exam-locked systems retain their real checked state',()=>{
 for(const count of [1,59,372])for(const enabled of [true,false])for(const locked of [true,false]){
  const state=bodySystemToggle(count,enabled,locked);assert.equal(state.available,true);assert.equal(state.checked,enabled);assert.equal(state.disabled,locked);
 }
 const restored=bodySystemToggle(59,true);assert.equal(restored.checked,true,'Empty region must not erase later region visibility intent');
});
test('regional controls use availability consistently without adding controls or changing stored state',()=>{
 const source=readFileSync('app/body-explorer.tsx','utf8');
 assert(source.includes('toggle = bodySystemToggle(count, systems[system], exam)'));
 assert(source.includes("className={toggle.checked ? 'active' : ''}"));
 assert(source.includes('checked={toggle.checked}'));assert(source.includes('disabled={toggle.disabled}'));
 assert(source.includes("!toggle.available ? 'No source structures are available for this system in this region.'"));
 assert(source.includes('setSystems((prev) => ({ ...prev, [system]: checked }))'));
});

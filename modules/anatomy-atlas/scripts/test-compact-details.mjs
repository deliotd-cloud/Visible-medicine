import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import postcss from 'postcss';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react');
let context;
const built=await build({stdin:{contents:"export {StructureDetailsButton} from './app/atlas-workspace';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'}});
const module={exports:{}};
runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,process:{env:{NODE_ENV:'test'}},require:id=>id==='react'?{...React,useContext:()=>context}:id==='next/link'?()=>null:require(id)});
for(const mode of ['explore','dissect','practice']){
  const calls=[];context={mode,chooseMode:value=>calls.push(value),showInfo:()=>calls.push('info')};
  const element=module.exports.StructureDetailsButton();
  assert.equal(element.props.className,'atlas-structure-details');
  assert.equal(element.props.children,'Details');
  element.props.onClick();
  assert.deepEqual(calls,mode==='practice'?['explore','info']:['info']);
}
const css=postcss.parse(await readFile('app/atlas-workspace.css','utf8'));
const compactRules=[];
css.walkRules(rule=>{if(rule.selector.includes('atlas-structure-details'))compactRules.push(rule);});
assert.equal(compactRules.length,2);
const expected=[
  ".body-app:not([data-workspace-mode='practice'])[data-panel-info='true'] .body-view-row > .atlas-structure-details",
  ".body-app:not([data-workspace-mode='practice'])[data-focus-view='true'] .body-view-row > .atlas-structure-details",
  ".body-app:not([data-workspace-mode='practice']) .body-view-row > .atlas-structure-details",
];
assert.deepEqual(compactRules.flatMap(rule=>rule.selectors),expected);
for(const rule of compactRules)assert(rule.nodes.some(n=>n.prop==='display'&&n.value==='none'));
assert.equal(compactRules[0].parent.type,'root');
assert.equal(compactRules[1].parent.name,'media');
assert.equal(compactRules[1].parent.params,'(max-width: 700px)');
const rail=await readFile('app/anatomy-control-rail.tsx','utf8');
assert(rail.includes("info ? 'body-info-launcher' : 'body-controls-launcher'"));
assert(rail.includes("onOpenChange={(value) => setPanelOpen(info, value)}"));
assert(rail.includes("? 'Practice'"));
assert(rail.includes(": 'Structure info'"));
console.log(JSON.stringify({actualButtonModes:3,scopedSelectors:3,practiceShortcutPreserved:true,existingInfoLauncherPreserved:true,browserSizingClaim:false}));

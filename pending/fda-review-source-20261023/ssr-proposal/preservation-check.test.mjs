import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=value=>createHash('sha256').update(value).digest('hex');
const source=name=>readFileSync(new URL(name,import.meta.url));
const replace=(text,before,after)=>{
 assert.equal(text.split(before).length,2,'Exactly one declared SSR fixture seam');
 return text.replace(before,after);
};
const cases=[
 {
  name:'validate-specimen-review.mjs',
  preimage:'f22750acb3bc95f888f24b7fc1d1aeb4abd7c3e0af5d2733ca4f63d93f02b765',
  edits:[
   ['import { build as componentBuild } from "./workspace-component-test-build.mjs";',
    'import { build as componentBuild } from "./workspace-component-test-build.mjs";\nimport {vinextNavigation,withVinextAppRouter} from \'./review-ssr-vinext-navigation.mjs\';'],
   ['  require,\n  console,','  require: id => id === \'next/navigation\' ? vinextNavigation : require(id),\n  console,'],
   ['    React.createElement(module.exports.SpecimenReviewWorkspace, {',
    '    withVinextAppRouter(React,React.createElement(module.exports.SpecimenReviewWorkspace, {'],
   ['      invalid: false,\n    }),','      invalid: false,\n    })),'],
  ],
 },
 {
  name:'test-review-entry-track.mjs',
  preimage:'64365d493661fa1c3a2c08897a9cf479047ab323c68e3d2a176fa69b7cd4f4f2',
  edits:[
   ["import { build } from './workspace-component-test-build.mjs';",
    "import { build } from './workspace-component-test-build.mjs';\nimport {vinextNavigation,withVinextAppRouter} from './review-ssr-vinext-navigation.mjs';"],
   ["    if (id === 'react') return hookedReact;",
    "    if (id === 'react') return hookedReact;\n    if (id === 'next/navigation') return vinextNavigation;"],
   ['  renderToStaticMarkup(React.createElement(component, props));',
    '  renderToStaticMarkup(withVinextAppRouter(React,React.createElement(component, props)));'],
  ],
 }
];

test('both entire SSR harnesses retain every original assertion, refusal and source fixture',()=>{
 for(const {name,preimage,edits} of cases){
  const originalBytes=source(`./${name}.preimage`);
  const original=originalBytes.toString('utf8');
  const actual=source(`./atlas/scripts/${name}`).toString('utf8');
  assert.equal(sha(originalBytes),preimage,name+' exact preimage');
  let forward=original;
  for(const [before,after] of edits)forward=replace(forward,before,after);
  assert.equal(actual,forward,name+' whole-file forward');
  let inverse=actual;
  for(const [before,after] of edits.toReversed())inverse=replace(inverse,after,before);
  assert.equal(sha(inverse),preimage,name+' byte-exact inverse');
 }
});

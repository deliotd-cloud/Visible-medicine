import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const postcss=require('postcss');
const source=readFileSync(new URL('../app/atlas/head-neck-3d/head-learning.css',import.meta.url),'utf8');
const ast=postcss.parse(source);
const guided=[...ast.nodes].filter(node=>node.type==='atrule'&&node.name==='media'&&/min-width\s*:\s*1200px/.test(node.params)&&node.nodes.some(child=>child.type==='rule'&&child.selector.includes('.head-guided-module-page')&&child.selector.includes('.atlas-3d-workspace-page')));
const declaration=(rule,name)=>rule.nodes.find(node=>node.type==='decl'&&node.prop===name)?.value;
const find=(rules,suffix)=>rules.find(rule=>rule.selector.endsWith(suffix));

test('full stylesheet parses and the guided desktop grid keeps a 360px model with notes in page flow',()=>{
  assert.equal(guided.length,1,'one dedicated guided desktop block');
  const rules=[];guided[0].walkRules(rule=>rules.push(rule));
  const page=find(rules,'.atlas-3d-workspace-page.head-guided-module-page');assert(page);
  assert.equal(declaration(page,'height'),'auto');
  assert.equal(declaration(page,'min-height'),'calc(100dvh - 64px)');
  assert.equal(declaration(page,'grid-template-rows'),'auto auto auto minmax(360px, 1fr) auto');
  const frame=find(rules,'> .shoulder-module-frame'),notes=find(rules,'> .shoulder-module-notes');
  assert.equal(declaration(frame,'grid-row'),'4');assert.equal(declaration(frame,'min-height'),'360px');
  assert.equal(declaration(notes,'grid-row'),'5');
  const caption=find(rules,'> .head-tour-caption');assert(caption);
  assert.equal(declaration(caption,'max-height'),'none');assert.equal(declaration(caption,'overflow'),'visible');
});

test('guided desktop rules keep controls readable and long revision hashes wrapping',()=>{
  const rules=[];guided[0].walkRules(rule=>rules.push(rule));
  assert(rules.length>=19);
  for(const rule of rules){
    if(!rule.selector.includes('.head-guided-module-page'))assert.match(rule.selector,/^\.anatomy-site-frame:has\(\.head-guided-module-page\)$/);
    rule.walkDecls(decl=>{
      assert(!decl.important);
      if(decl.prop==='display')assert(!['none','contents'].includes(decl.value));
      if(decl.prop==='position')assert(!['absolute','fixed'].includes(decl.value));
      if(decl.prop==='overflow')assert(!['hidden','clip'].includes(decl.value));
      assert(!['visibility','opacity','font-size','pointer-events'].includes(decl.prop));
    });
  }
  const hash=find(rules,'.head-tour-caption :is(code, a)');assert.equal(declaration(hash,'overflow-wrap'),'anywhere');
  const playback=find(rules,".head-tour-playback > [role='status']");assert.equal(declaration(playback,'flex-basis'),'180px');
  assert(!guided[0].toString().includes('.head-comparison-module-page'));
});

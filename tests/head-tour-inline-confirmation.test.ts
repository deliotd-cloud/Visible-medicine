import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_SELECTION_PROTOCOL} from '../lib/head-live-selection.ts';

// Reuse the existing real-component protocol harness without changing its
// historical fixture or executing its tests. Only synthetic events are used.
const path=new URL('./head-inline-frame.test.ts',import.meta.url),source=readFileSync(path,'utf8');
const ast=ts.createSourceFile('fixture.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const selected=ast.statements.filter(n=>ts.isImportDeclaration(n)||ts.isFunctionDeclaration(n)&&n.name?.text==='withInlineFrame').map(n=>n.getText(ast)).join('\n');
const code=ts.transpileModule(selected.replaceAll('import.meta.url',JSON.stringify(path.href))+'\nexport {withInlineFrame};',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const require=createRequire(import.meta.url),mod={exports:{} as {withInlineFrame:(run:(h:any)=>void)=>void}};
new Function('require','module','exports',code)(require,mod,mod.exports);
const fixture=mod.exports.withInlineFrame;

test('playback receives matching readiness only from exact iframe origin/source/session selection',()=>fixture(h=>{
  const reports:any[]=[];h.update({onPlaybackStatus:(value:any)=>reports.push(value)});h.reload();
  h.deliver(h.selected('brainstem-pons',1),'https://untrusted.test');assert(!reports.some(r=>r.status==='matched'));
  h.deliver(h.selected('brainstem-pons',1),undefined,{});assert(!reports.some(r=>r.status==='matched'));
  h.deliver(h.selected('brainstem-pons',1,'retired-session'));assert(!reports.some(r=>r.status==='matched'));
  h.deliver(h.selected('brainstem-pons',1));assert.deepEqual(reports.at(-1),{conceptId:'brainstem-pons',status:'matched'});
}));
test('target changes require current focus ACK and a newer matching selection before autoplay readiness',()=>fixture(h=>{
  const reports:any[]=[];h.update({onPlaybackStatus:(value:any)=>reports.push(value)});h.reload();h.deliver(h.selected('brainstem-pons',1));
  h.update({conceptId:'brainstem-midbrain'});const command=h.command();assert(command);
  assert.deepEqual(reports.at(-1),{conceptId:'brainstem-midbrain',status:'waiting'});
  h.deliver(h.selected('brainstem-midbrain',2));assert.equal(reports.at(-1).status,'waiting');
  h.deliver(h.ack(command.command));assert.equal(reports.at(-1).status,'waiting');
  h.deliver(h.selected('brainstem-midbrain',3));assert.deepEqual(reports.at(-1),{conceptId:'brainstem-midbrain',status:'matched'});
}));
for(const reason of ['practice','guided','unavailable'])test(`model ${reason} immediately reports blocked rather than permitting scan autoplay`,()=>fixture(h=>{
  const reports:any[]=[];h.update({onPlaybackStatus:(value:any)=>reports.push(value)});h.reload();h.deliver(h.selected('brainstem-pons',1));
  h.deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:h.sourceRevision,session:h.session(),sequence:2,status:'blocked',reason});
  assert.deepEqual(reports.at(-1),{conceptId:'brainstem-pons',status:'blocked'});
}));
test('unready native annotation and a manually different model never report a matching target',()=>fixture(h=>{
  const reports:any[]=[];h.update({onPlaybackStatus:(value:any)=>reports.push(value)});h.reload();h.deliver(h.selected('brainstem-pons',1));
  h.update({selectionReady:false});assert.equal(reports.at(-1).status,'waiting');
  h.deliver(h.selected('brainstem-pons',2));assert.equal(reports.at(-1).status,'waiting');
  h.update({selectionReady:true});const command=h.command();h.deliver(h.ack(command.command));h.deliver(h.selected('brainstem-pons',3));
  h.deliver(h.selected('brainstem-midbrain',4));assert.equal(reports.at(-1).status,'blocked');
}));

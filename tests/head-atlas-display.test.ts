import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import {annotationInk,headLabel,headSideLabel,headRepresentationLabel} from '../lib/head-atlas-display.ts';

test('readable metadata retains source codes and never infers unknown side or representation',()=>{
  const entry=Object.freeze({laterality:'midline_or_unpaired',representation:'partial-mask'});
  assert.equal(headSideLabel(entry.laterality),'Midline or unpaired');
  assert.equal(headRepresentationLabel(entry.representation),'Partial mask');
  assert.equal(entry.laterality,'midline_or_unpaired');assert.equal(entry.representation,'partial-mask');
  for(const [code,label]of Object.entries({left:'Left',right:'Right',midline:'Midline',unpaired:'Unpaired',bilateral:'Bilateral'}))assert.equal(headSideLabel(code),label);
  for(const [code,label]of Object.entries({mask:'Mask',point:'Point locator',curve:'Regional course',mesh:'Surface mesh'}))assert.equal(headRepresentationLabel(code),label);
  for(const label of [headSideLabel,headRepresentationLabel]){
    assert.equal(label(undefined),'Not specified');assert.equal(label(''),'Not specified');
    for(const unknown of ['custom_source_code','__proto__','constructor'])assert.equal(label(unknown),unknown);
  }
});

test('display helper bytes are bound to the actual Review renderer provenance',()=>{
  const inputs=JSON.parse(readFileSync(new URL('../atlas-review/integration-inputs.json',import.meta.url),'utf8'));
  const row=inputs.inputs.find((r:{path:string})=>r.path==='lib/head-atlas-display.ts');assert(row,'Presentation helper must not escape renderer source binding');
  assert.equal(row.sha256,createHash('sha256').update(readFileSync(new URL('../lib/head-atlas-display.ts',import.meta.url))).digest('hex'));
});

test('actual viewer metadata uses readable labels while all source filter values stay exact',()=>{
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  const tree=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const nodes:ts.JsxElement[]=[];
  const visit=(node:ts.Node):void=>{if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(tree)==='dl'&&node.getText(tree).includes('selected.entry'))nodes.push(node);ts.forEachChild(node,visit);};visit(tree);
  assert.equal(nodes.length,1,'Use the actual selected-structure metadata, not a parallel markup fixture');
  const code=ts.transpileModule(`export const render=(selected,familyNames)=>(${nodes[0].getText(tree)});`,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{} as {render:(selected:unknown,names:Record<string,string>)=>Parameters<typeof renderToStaticMarkup>[0]}};
  new Function('require','module','exports','headSideLabel','headRepresentationLabel',code)(createRequire(import.meta.url),module,module.exports,headSideLabel,headRepresentationLabel);
  const entry=Object.freeze({family:'bst',representation:'partial-mask',laterality:'midline_or_unpaired'});
  const html=renderToStaticMarkup(module.exports.render({entry},{bst:'Brainstem'}));
  assert.match(html,/<dt>Representation<\/dt><dd>Partial mask<\/dd>/);assert.match(html,/<dt>Side<\/dt><dd>Midline or unpaired<\/dd>/);
  assert.doesNotMatch(html,/midline_or_unpaired|partial-mask/);assert.equal(entry.laterality,'midline_or_unpaired');assert.equal(entry.representation,'partial-mask');
  assert.match(source,/value=\{`side:\$\{value\}`\}>\{headSideLabel\(value\)\}/);
  assert.match(source,/value=\{`type:\$\{value\}`\}>\{headRepresentationLabel\(value\)\}/);
  assert.match(source,/entry.laterality\?` · \$\{headSideLabel\(entry.laterality\)\}`:''/);
});

test('display labels omit only the regional-mask suffix and never mutate source identities or scope',()=>{
  const entry={id:'mrb.bst.medulla',label:'Medulla oblongata — regional mask',source:{declared_scope:'Partial regional mask only.'}};
  assert.equal(headLabel(entry),'Medulla oblongata');
  assert.equal(entry.label,'Medulla oblongata — regional mask');assert.equal(entry.source.declared_scope,'Partial regional mask only.');
  assert.equal(headLabel({label:'Left peduncle - Regional mask'}),'Left peduncle');
  assert.equal(headLabel({label:'Left peduncle — point locator'}),'Left peduncle — point locator');
  assert.equal(headLabel({label:'Left peduncle — limited region'}),'Left peduncle — limited region');
});
test('annotation ink preserves bright colours and lifts dark colours without changing the mask colour array',()=>{
  const bright=[1,.8,.4],dark=[.05,.1,.3];
  assert.equal(annotationInk(bright),'rgb(255,204,102)');
  const channels=annotationInk(dark).match(/\d+/g)!.map(Number);
  assert.ok(channels[2]>channels[1]&&channels[1]>channels[0],'hue ordering preserved');
  assert.ok(channels[0]>128,'dark blue becomes readable ink');assert.deepEqual(dark,[.05,.1,.3]);
});
test('canvas labels remain vivid while leaders are softer dashed lines with isolated drawing state',()=>{
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(source,/const ink=annotationInk\(color\)/);
  assert.match(source,/ctx.save\(\);ctx.setLineDash\(\[4,5\]\);ctx.lineCap='round'/);
  assert.match(source,/ctx.strokeStyle='rgba\(0,0,0,.45\)';ctx.lineWidth=3.5/);
  assert.match(source,/ctx.strokeStyle=ink;ctx.globalAlpha=.8;ctx.lineWidth=1.5;ctx.stroke\(\);ctx.restore\(\);\s+ctx.beginPath\(\);ctx.arc\(anchor.x,anchor.y,4/);
  assert.match(source,/ctx.strokeText\(label/);assert.match(source,/ctx.fillStyle=ink;ctx.fillText\(label/);
  assert.match(source,/headLabel\(selected.entry\)/);assert.match(source,/headLabel\(entry\)/);
});

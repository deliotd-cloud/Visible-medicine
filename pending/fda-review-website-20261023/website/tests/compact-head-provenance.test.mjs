import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root)),sha=b=>createHash('sha256').update(b).digest('hex');
const stage='F:/VisibleMedicine/staging/20261023-compact-head-provenance',transition=JSON.parse(readFileSync(stage+'/AUTHORED_TRANSITION.json'));
const source=read('components/HeadAtlasViewer.tsx').toString(),old=readFileSync(stage+'/preimages/components/HeadAtlasViewer.tsx.raw').toString();
const require=createRequire(import.meta.url),ast=s=>ts.createSourceFile('viewer.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function sourceBlock(s){const tree=ast(s),found=[];function visit(n){if(ts.isJsxElement(n)&&n.openingElement.getText(tree).includes('className="head-source-note"'))found.push(n);ts.forEachChild(n,visit);}visit(tree);assert.equal(found.length,1);return found[0].getText(tree);}
function render(s,context){const code=ts.transpileModule(`export const render=()=>(${sourceBlock(s)});`,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};new Function('require','module','exports',...Object.keys(context),code)(require,module,module.exports,...Object.values(context));return module.exports.render();}
const elements=n=>n==null?[]:Array.isArray(n)?n.flatMap(elements):typeof n==='object'?[n,...elements(n.props?.children)]:[];
const text=n=>n==null?'':Array.isArray(n)?n.map(text).join(''):typeof n==='object'?text(n.props?.children):String(n);
const ctx=(modality='CT',oblique=true,preserveScanTab=false)=>({modality,count:modality==='CT'?355:117,study:oblique===null?null:{geometry:{oblique}},preserveScanTab,headDisclosureKeyDown,Link:({children,prefetch:_,...props})=>React.createElement('a',props,children)});

test('exact two-seam inverse retains the complete preceding viewer and all clinical/access/image logic',()=>{
 const receiptBytes=readFileSync('F:/VisibleMedicine/staging/20261023-tour-reading-website/SOURCE_BOUND.json');assert.equal(sha(receiptBytes),'56f24d066ff24320b5058a2c027c76d085482b85ecd53f38c1aa3d3f01083d9e');
 const receipt=JSON.parse(receiptBytes),row=receipt.sourceRows.find(r=>r.path==='components/HeadAtlasViewer.tsx');assert.equal(sha(old),row.sha256);assert.equal(row.sha256,'596981f13b27a295fc31713f23f9bf8328eb6e3337550ed27ea234c82c886fae');
 assert.equal(sha(source),transition.afterSha256);assert.equal(source.split(transition.newBlock).length,2);assert.equal(source.replace(transition.newBlock,transition.oldBlock),old);
 assert.equal(transition.oldBlock,sourceBlock(old));assert.equal(transition.newBlock,sourceBlock(source));
});

test('provenance is natively collapsed, with an always-visible non-registration and display-only reminder',()=>{
 const node=render(source,ctx()),all=elements(node),details=all.filter(n=>n.type==='details');assert.equal(details.length,2);
 const outer=details[0];assert.equal(outer.props.open,undefined);assert.equal(outer.props.onKeyDown,headDisclosureKeyDown);
 assert.deepEqual(Object.keys(outer.props).sort(),['children','onKeyDown']);
 const children=Array.isArray(node.props.children)?node.props.children:[node.props.children];assert.equal(children[0].type,'p');assert.equal(children[0].props.className,'head-source-reminder');
 assert.equal(text(children[0]),'Display approval only · no spatial registration to the reference 3D model.');
 assert.equal(text(elements(outer).find(n=>n.type==='summary')),'Study information & provenance');
 assert.equal(details[1].props.open,undefined);assert.equal(text(elements(details[1]).find(n=>n.type==='summary')),'Annotation count and review scope');
 assert.doesNotMatch(renderToStaticMarkup(node),/<details[^>]*\sopen(?:\s|=|>)/);
});

for(const modality of ['CT','MRI'])test(`${modality}: every original source paragraph, scope, nested disclosure and link is preserved`,()=>{
 for(const oblique of [true,false,null])for(const preserveScanTab of [false,true]){
  const context=ctx(modality,oblique,preserveScanTab),before=render(old,context),after=render(source,context);
  const details=elements(after).filter(n=>n.type==='details')[0],content=elements(details).find(n=>n.props?.className==='head-source-content');assert(content);
  const originalHtml=renderToStaticMarkup(before).replace('<h3>Study information</h3>','');
  assert.equal(renderToStaticMarkup(React.createElement('div',{className:'head-source-note'},content.props.children)),originalHtml);
  const html=renderToStaticMarkup(content);assert.match(html,/display only/);assert.match(html,/listed annotations/);assert.match(html,/does not establish complete boundaries, teaching approval or clinical sign-off/);assert.match(html,/CT and MRI are different subjects/);assert.match(html,/not registered to this study/);assert.equal(html.includes('Native oblique planes'),oblique===true);
  assert.match(html,modality==='CT'?/Unmodified CT native intensity/:/MRI intensity is not HU/);
  const anchor=elements(content).find(n=>n.type===context.Link);assert.equal(anchor.props.href,'/atlas/head-neck-3d');assert.equal(anchor.props.prefetch,false);assert.equal(anchor.props.target,preserveScanTab?'_blank':undefined);assert.equal(anchor.props.rel,preserveScanTab?'noopener noreferrer':undefined);
 }
});

test('scoped CSS is purely additive, retains old bytes and keeps native marker, 44px target and visible focus',()=>{
 const css=read('components/head-atlas.css').toString(),before=readFileSync(stage+'/preimages/components/head-atlas.css.raw').toString();assert.equal(sha(before),'fb22ea6087e7ea2b09cc63e8f769f8bf2c93c7aa00b8a8710d9b164f3813eb8a');assert.equal(css,before+transition.addition);
 assert.match(transition.addition,/min-height:44px/);assert.match(transition.addition,/list-style-position:inside/);assert.match(transition.addition,/:focus-visible\{outline:3px solid var\(--imaging-teal\)/);assert.match(transition.addition,/overflow-wrap:anywhere/);assert.doesNotMatch(transition.addition,/@import|https?:|display:none|visibility:hidden|animation|transition:/);
});

test('historical UI proposal retains its refusal while the new binding admits exact current bytes',()=>{
 const oldRoot='F:/VisibleMedicine/staging/20261023-compact-head-provenance/website/';
 const binding=JSON.parse(readFileSync(oldRoot+'atlas-review/integration-inputs.json'));
 assert.equal(binding.sha256,'7608d1452572576d0f004cbb1db3b341e8a1a80a87427e5692a85e8c9fdd3532');
 for(const p of ['components/HeadAtlasViewer.tsx','components/head-atlas.css']){const row=binding.inputs.find(r=>r.path===p);assert(row);assert.notEqual(sha(read(p)),row.sha256,'A fresh source-bound build is still required');}
 assert.equal(JSON.parse(readFileSync(oldRoot+'public/atlas-review-viewer/manifest.json')).websiteIntegrationSha256,binding.sha256);
 const current=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(current.sourceCommit,'e3a901e103e9fb495a18d9bd1622190dfc0d034b');assert.notEqual(current.sha256,binding.sha256);
 assert.equal(current.sha256,sha(JSON.stringify(current.inputs)));
 for(const p of ['components/HeadAtlasViewer.tsx','components/head-atlas.css']){const row=current.inputs.find(r=>r.path===p);assert(row);assert.equal(sha(read(p)),row.sha256);}
 assert.equal(JSON.parse(read('public/atlas-review-viewer/manifest.json')).websiteIntegrationSha256,current.sha256);
});

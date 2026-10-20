import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

type FrameNode = ts.JsxSelfClosingElement;
function tags(source:string,name:string):FrameNode[]{
  const ast=ts.createSourceFile('frame-contract.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const result:FrameNode[]=[];
  function visit(node:ts.Node){
    if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)===name)result.push(node);
    ts.forEachChild(node,visit);
  }
  visit(ast);
  return result;
}
function value(node:FrameNode,name:string):string|undefined{
  const attr=node.attributes.properties.find(item=>ts.isJsxAttribute(item)&&item.name.getText()===name);
  if(!attr||!ts.isJsxAttribute(attr))return undefined;
  if(!attr.initializer)return 'true';
  if(ts.isStringLiteral(attr.initializer))return attr.initializer.text;
  if(ts.isJsxExpression(attr.initializer))return attr.initializer.expression?.getText();
  return undefined;
}
function inspectPage(source:string,expectedSrc:string){
  assert.match(source,/import\s*\{\s*AtlasRuntimeFrame\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/components\/AtlasRuntimeFrame['"]/);
  const frames=tags(source,'AtlasRuntimeFrame');
  assert.equal(frames.length,1,'Exactly one AtlasRuntimeFrame is owned by this page');
  const frame=frames[0];
  assert.equal(value(frame,'src'),expectedSrc,'The page forwards its audited Atlas source');
  assert.equal(value(frame,'referrerPolicy'),'same-origin','The frame retains same-origin referrer policy');
  assert.equal(value(frame,'allowFullScreen'),'true','The frame retains fullscreen permission');
  assert(value(frame,'title'),'The frame remains labelled');
}
function inspectComponent(){
  const source=readFileSync(new URL('../components/AtlasRuntimeFrame.tsx',import.meta.url),'utf8');
  for(const name of ['AtlasRuntimeSource','AtlasRuntimeAttempt']){
    const node=tags(source,name);
    assert.equal(node.length,1,`One ${name} forwards the frame`);
    for(const property of ['src','title','className','referrerPolicy','allowFullScreen'])
      assert.equal(value(node[0],property),property,`${name} forwards ${property}`);
  }
  const frame=tags(source,'iframe');
  assert.equal(frame.length,1,'The shared component emits one iframe');
  for(const property of ['src','title','className','referrerPolicy','allowFullScreen'])
    assert.equal(value(frame[0],property),property,`The iframe receives ${property}`);
}
export function assertRuntimeFramePage(source:string,expectedSrc:string){
  inspectComponent();
  inspectPage(source,expectedSrc);
  const original=expectedSrc==='source'||expectedSrc==='moduleHref'?`src={${expectedSrc}}`:`src="${expectedSrc}"`;
  const frame=tags(source,'AtlasRuntimeFrame')[0].getText();
  assert(frame.includes(original),'The declared source occurs on the frame');
  const titleAttribute=frame.match(/\btitle=(?:"[^"]*"|\{[^}]+\})/)?.[0];
  assert(titleAttribute,'The authored frame has a title attribute');
  const mutate=(before:string,after:string)=>source.replace(frame,frame.replace(before,after));
  assert.throws(()=>inspectPage(mutate(original,'src="/wrong-source"'),expectedSrc),/audited Atlas source/);
  assert.throws(()=>inspectPage(mutate('referrerPolicy="same-origin"','referrerPolicy="no-referrer"'),expectedSrc),/same-origin referrer policy/);
  assert.throws(()=>inspectPage(mutate('allowFullScreen',''),expectedSrc),/fullscreen permission/);
  assert.throws(()=>inspectPage(mutate(titleAttribute,''),expectedSrc),/frame remains labelled/);
  assert.throws(()=>inspectPage(mutate('<AtlasRuntimeFrame','<iframe'),expectedSrc),/Exactly one AtlasRuntimeFrame/);
  return {title:value(tags(source,'AtlasRuntimeFrame')[0],'title')!,className:value(tags(source,'AtlasRuntimeFrame')[0],'className')!};
}

type RealFrame = typeof import('../components/AtlasRuntimeFrame').AtlasRuntimeFrame;
let realComponent:Promise<RealFrame>|undefined;
async function loadRealComponent(){
  realComponent??=(async()=>{
    const path=fileURLToPath(new URL('../components/AtlasRuntimeFrame.tsx',import.meta.url));
    const result=await build({entryPoints:[path],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',loader:{'.css':'empty'},packages:'external'});
    const module:{exports:Record<string,unknown>}={exports:{}};
    new Function('require','module','exports',Buffer.from(result.outputFiles[0].contents).toString())(createRequire(import.meta.url),module,module.exports);
    assert.equal(typeof module.exports.AtlasRuntimeFrame,'function');
    return module.exports.AtlasRuntimeFrame as RealFrame;
  })();
  return realComponent;
}
export async function assertRealRuntimeFrameMarkup(source:string,expectedSrc:string,resolvedSrc:string){
  const {title,className}=assertRuntimeFramePage(source,expectedSrc);
  const Component=await loadRealComponent();
  const html=renderToStaticMarkup(createElement(Component,{src:resolvedSrc,title,className,referrerPolicy:'same-origin',allowFullScreen:true}));
  const frames=[...html.matchAll(/<iframe\b[^>]*>/g)];
  assert.equal(frames.length,1,'The real shared component renders one iframe');
  const frame=frames[0][0];
  for(const [name,expected] of [['src',resolvedSrc],['title',title],['class',className],['referrerPolicy','same-origin']])
    assert(frame.includes(`${name}="${expected}"`),`Emitted iframe retains ${name}`);
  assert.match(frame,/\ballowFullScreen(?:="")?(?:\s|>)/,'Emitted iframe permits fullscreen');
  assert(!frame.includes('scanUrl')&&!frame.includes('patientId')&&!frame.includes('token='),'The frame emits no private query');
}

// Synthetic real-React browser fixture. It never imports scan data, auth or owner state.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-head-pan-interruption',site=stage+'/website',root=stage+'/browser';
const base='F:/VisibleMedicine/staging/20261023-window-drag-bound/website';
const require=createRequire(base+'/package.json'),ts=require('typescript'),esbuild=require('esbuild');
if(process.argv.includes('--repair-layout')){
 const before=read(root+'/fixture.css');fs.writeFileSync(root+'/fixture.before.css',before,{flag:'wx'});
 const css=before.toString().replace('.head-view{margin-top:18px;background:#061e24}',
  '.head-view{margin-top:18px;background:#061e24;height:540px;--imaging-ink:#eef6f2;--imaging-muted:#b4c9c4;--imaging-line:#476a64}')+'\n.head-slice-area{flex:none}.head-view header{flex:none}.head-slice-footer,.head-slice-help{flex:none}\n';
 assert.notEqual(css,before.toString());fs.writeFileSync(root+'/fixture.css',css);
 // The screenshot API supplied JPEG bytes, despite the initial requested suffix.
 const image=read(root+'/QA.png');assert.equal(image.subarray(0,3).toString('hex'),'ffd8ff');
 fs.renameSync(root+'/QA.png',root+'/QA-initial.jpeg');
 fs.writeFileSync(root+'/BUILD_LAYOUT.json',JSON.stringify({at:new Date().toISOString(),parentBuildSha256:sha(read(root+'/BUILD.json')),originalCssSha256:sha(before),cssSha256:sha(css),sourceSha256:sha(read(site+'/components/HeadAtlasViewer.tsx')),reason:'Standalone fixture lacked the full viewer parent height; its own flex parent clipped the image. Set an explicit fixture height only. Initial probes remain synthetic interaction evidence, not visual acceptance.',initialScreenshot:'QA-initial.jpeg',sourceChanged:false,previewChanged:false},null,2)+'\n',{flag:'wx'});console.log('Standalone fixture height corrected; original CSS/screenshot retained.');process.exit(0);
}
assert(!fs.existsSync(root));fs.mkdirSync(root);fs.symlinkSync(base+'/node_modules',root+'/node_modules','junction');
const source=read(site+'/components/HeadAtlasViewer.tsx').toString(),ast=ts.createSourceFile('viewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const matches=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='NativeSlice');assert.equal(matches.length,1);
const native=matches[0].getText(ast),clamp=ast.statements.find(n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(ast)==='clamp'));assert(clamp);
const jsx=ts.transpileModule(clamp.getText(ast)+'\n'+native,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.React,jsxFactory:'fixtureElement',jsxFragmentFactory:'React.Fragment',target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});assert.equal(jsx.diagnostics?.length,0);
const imports=[['headSliceViewport,zoomHeadSliceViewport,fitHeadMaskViewport,nearestHeadMaskSlice',site+'/lib/head-slice-viewport.ts'],['headSliceKey,headSliceNumber',site+'/lib/head-atlas-slice-controls.ts'],['headDisclosureKeyDown',site+'/lib/head-disclosure-keyboard.ts'],['headLabel,annotationInk',site+'/lib/head-atlas-display.ts'],['bindSliceWheel',base+'/lib/slice-wheel.mjs'],['canvasVoxel',site+'/lib/head-atlas-practice.ts'],['headMaskHits',base+'/lib/head-mask-picking.ts'],['layoutHeadLabels',base+'/lib/head-atlas-overlays.ts'],['bindHeadWindowDrag',base+'/lib/head-window-drag.ts']].map(([names,p])=>`import {${names}} from ${JSON.stringify(p)};`).join('\n');
const module=`import React,{useEffect,useRef,useState} from 'react';\n${imports}\nlet lastProps;export const canvasProps=()=>lastProps;\nfunction fixtureElement(type,props,...children){if(type==='canvas'&&props.role==='img')lastProps=props;return React.createElement(type,props,...children);}\n// Playback is explicitly disabled by the fixture; no player substitute is exercised.\nconst HeadSlicePlayback=()=>null;\n${jsx.outputText}`;
fs.writeFileSync(root+'/native-slice.jsx',module,{flag:'wx'});
const entry=`import React,{useMemo,useState} from 'react';import {createRoot} from 'react-dom/client';
import {NativeSlice,canvasProps} from './native-slice.jsx';import {createNativeVolumeGeometry} from ${JSON.stringify(site+'/lib/head-atlas-geometry.mjs')};
const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
function App(){const geometry=useMemo(()=>createNativeVolumeGeometry({shape_kji:[5,5,5],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}),[]);
 const study=useMemo(()=>({geometry,data:Int16Array.from({length:125},(_,i)=>i)}),[geometry]);
 const[cursor,setCursor]=useState([2,2,2]),[version,setVersion]=useState(0),[result,setResult]=useState('Not run'),[answers,setAnswers]=useState(0);
 const probe=async(kind)=>{const element=document.querySelector('canvas[role=img]'),props=canvasProps();let captured=false,releases=0;
  if(!element?.getAttribute('aria-label')?.includes('Pan mode')){setResult('Enable Pan image and zoom in first.');return;}
  const methods=['setPointerCapture','hasPointerCapture','releasePointerCapture'].map(k=>[k,Object.getOwnPropertyDescriptor(element,k)]);
  Object.defineProperties(element,{setPointerCapture:{configurable:true,value:()=>{captured=true;}},hasPointerCapture:{configurable:true,value:()=>captured},releasePointerCapture:{configurable:true,value:()=>{captured=false;releases++;}}});
  try{const event=(x,y,buttons)=>({pointerId:7,button:0,buttons,clientX:x,clientY:y,currentTarget:element,preventDefault(){}});
   props.onPointerDown(event(80,80,1));const before=element.style.left+':'+element.style.top;
   if(kind==='released')props.onPointerMove(event(140,120,0));else if(kind==='blur')window.dispatchEvent(new Event('blur'));else setVersion(v=>v+1);
   await frame();const committed=element.style.left+':'+element.style.top;
   canvasProps().onPointerMove(event(160,140,1));await frame();
   const unchanged=(element.style.left+':'+element.style.top)===(kind==='reset'?committed:before);
   setResult(kind+': '+(unchanged&&!captured&&releases===1?'PASS':'FAIL')+' · synthetic capture releases='+releases+' · cursor='+cursor.join(',')+' · answers='+answers);
  }finally{for(const[k,d]of methods){if(d)Object.defineProperty(element,k,d);else delete element[k];}}
 };
 return <main><h1>Native image pan · isolated QA</h1><p>Synthetic125-voxel gradient only. Real React and NativeSlice; pointer capture is a test double. No scans, masks, login or owner data. This is not clinical or full Website acceptance.</p>
 <div className='probe'><button onClick={()=>probe('released')}>Probe released button</button><button onClick={()=>probe('blur')}>Probe owning-window blur</button><button onClick={()=>probe('reset')}>Probe view reset</button><output role='status'>{result}</output></div>
 <NativeSlice plane='axial' study={study} selected={null} layers={[]} groupLabels={false} opacity={1} layerOpacity={{}} cursor={cursor} windowing={[60,120]} overlay={false} regionalCourse={false} showCrosshair={false} onCursor={setCursor} expanded={false} showName={false} onAnswer={()=>setAnswers(n=>n+1)} viewResetVersion={version} allowPlayback={false}/>
 <p>Cursor: {cursor.join(',')} · Answer calls: {answers}</p></main>;
}createRoot(document.getElementById('root')).render(<App/>);`;
fs.writeFileSync(root+'/entry.jsx',entry,{flag:'wx'});
const result=await esbuild.build({absWorkingDir:root,entryPoints:[root+'/entry.jsx'],bundle:true,format:'esm',platform:'browser',outfile:root+'/bundle.js',jsx:'automatic',write:true});
fs.writeFileSync(root+'/index.html',`<!doctype html><html lang="en"><meta charset="UTF-8"><title>Isolated native image pan QA</title><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/bundle.js"></script></html>`,{flag:'wx'});
const css=read(base+'/components/head-atlas.css').toString()+`\nbody{margin:0;background:#eff5f2;color:#12363c;font:16px system-ui}main{max-width:1000px;margin:25px auto;padding:0 20px}.head-view{margin-top:18px;background:#061e24}.head-slice-area{height:380px!important;position:relative}h1{font-size:24px}.probe{display:grid;gap:8px;grid-template-columns:repeat(3,1fr)}.probe output{grid-column:1/-1;padding:12px;background:white;border:1px solid #bad1ca}button{padding:8px;cursor:pointer}`;
fs.writeFileSync(root+'/fixture.css',css,{flag:'wx'});
fs.writeFileSync(root+'/BUILD.json',JSON.stringify({at:new Date().toISOString(),sourceSha256:sha(read(site+'/components/HeadAtlasViewer.tsx')),exactNativeSliceFunctionSha256:sha(native),clampSha256:sha(clamp.getText(ast)),warnings:result.warnings,files:['native-slice.jsx','entry.jsx','bundle.js','index.html','fixture.css'].map(p=>({path:p,sha256:sha(read(root+'/'+p))})),syntheticCapture:true,realReact:true,privateDataLoaded:false,previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({root,sourceSha256:sha(source),warnings:result.warnings.length}));

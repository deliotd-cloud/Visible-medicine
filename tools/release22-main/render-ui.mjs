import fs from 'node:fs';import {createRequire} from 'node:module';import http from 'node:http';
const site='G:/VisibleMedicine-temp/staging/20261031-release20-final/website',proposal='G:/VisibleMedicine-temp/proposals/20261031-atlas-hub-compact';
const require=createRequire(site+'/package.json'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
const nav={exports:{}};new Function('require','module','exports',compile(site+'/lib/atlas-navigation.ts'))(require,nav,nav.exports);
const imageLogic={exports:{}};new Function('require','module','exports',compile(site+'/lib/site-image.ts'))(require,imageLogic,imageLogic.exports);
const imageModule={exports:{}};new Function('require','module','exports',compile(site+'/components/SiteImage.tsx'))(name=>name==='../lib/site-image'?imageLogic.exports:require(name),imageModule,imageModule.exports);
const component={exports:{}};
new Function('require','module','exports',compile(proposal+'/files/components/AtlasModalityCards.tsx'))(name=>{
 if(name==='next/link')return ({children,...props})=>React.createElement('a',props,children);
 if(name==='next/image')return ({unoptimized,...props})=>React.createElement('img',props);
 if(name==='./SiteImage')return imageModule.exports;
 if(name==='../lib/atlas-navigation')return nav.exports;return require(name);
},component,component.exports);
const cards=renderToStaticMarkup(React.createElement(component.exports.AtlasModalityCards,{layout:'list'}));
const notes=renderToStaticMarkup(React.createElement(component.exports.AtlasImageNotes));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Atlas navigation candidate — local QA</title><base href="http://127.0.0.1:3000/"><link rel="stylesheet" href="/app/globals.css"><link rel="stylesheet" href="/app/atlas-navigation.css"></head><body><main class="wrap page atlas-hub-page"><header class="page-head"><h1>Anatomy atlas</h1><p>Choose a modality, then a body region.</p></header>'+cards+notes+'</main></body></html>';
fs.writeFileSync(proposal+'/PREVIEW.html',html,{flag:'wx'});
http.createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(html);}).listen(0,'127.0.0.1',function(){console.log(JSON.stringify({url:'http://127.0.0.1:'+this.address().port+'/',pid:process.pid,scope:'Actual proposed component rendered with React; local installed CSS; no site installation'}));});

// Synthetic, read-only SSR/compiled-CSS fixture. No auth route or database is used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-coherent-usability-candidate',site=stage+'/website';
const verified=json(stage+'/VERIFIED.json');assert(verified.fullLocalBuildPassed);assert.equal(verified.nativeCounts.pass,116);
const followup=process.argv[2]==='--v2';assert.equal(process.argv.length,followup?3:2);if(followup)assert(json(stage+'/LAYOUT_FOLLOWUP_VERIFIED.json').fullLocalBuildPassed);
const require=createRequire(site+'/package.json'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const Link=({children,href,...props})=>React.createElement('a',{href,...props},children);
function compile(file,imports){const source=read(site+'/'+file).toString(),code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,mod={exports:{}};new Function('require','module','exports',code)(name=>{assert(Object.hasOwn(imports,name),'Unexpected fixture dependency:'+name);return imports[name];},mod,mod.exports);return mod.exports;}
const runtime=require('react/jsx-runtime');
const queues=compile('lib/studio-queues.ts',{});
const navigation=compile('components/StudioNavigation.tsx',{'next/link':{__esModule:true,default:Link},'next/navigation':{usePathname:()=>'/studio/workbooks'},'react/jsx-runtime':runtime});
const shell=compile('components/StudioShell.tsx',{'next/link':{__esModule:true,default:Link},'./StudioNavigation':navigation,'./studio-workspace.css':{},'react/jsx-runtime':runtime});
const {StudioWorkbookTable}=compile('components/StudioWorkbookTable.tsx',{'next/link':{__esModule:true,default:Link},react:React,'../lib/studio-queues.ts':queues,'react/jsx-runtime':runtime});
const cssRoot=site+'/dist/client/_next/static/css';
const globalCss=fs.readdirSync(cssRoot).filter(n=>/^index\..+\.css$/.test(n)&&read(cssRoot+'/'+n).toString().includes('--ink:#132c32'));
const studioCss=fs.readdirSync(cssRoot).filter(n=>/^StudioShell\..+\.css$/.test(n));assert.equal(globalCss.length,1);assert.equal(studioCss.length,1);
const styles=[...globalCss,...studioCss].map(name=>({name,bytes:read(cssRoot+'/'+name)}));assert(styles[1].bytes.toString().includes('header[role=row]'));
const assets=new Map(styles.map(r=>['/css/'+r.name,{bytes:r.bytes,type:'text/css'}]));
const fontRoot=site+'/dist/client/_next/static/media';for(const name of fs.readdirSync(fontRoot).filter(n=>n.endsWith('.woff2')))assets.set('/_next/static/media/'+name,{bytes:read(fontRoot+'/'+name),type:'font/woff2'});
const workbooks=[{id:'synthetic-draft',title:'Synthetic teaching workbook',courseTitle:'Synthetic course',status:'draft',mode:'teaching',version:3,caseCount:2},{id:'synthetic-published',title:'Synthetic assessment workbook',courseTitle:'Synthetic course',status:'published',mode:'assessment',version:2,caseCount:6}];
const stylesHtml=styles.map(r=>'<link rel="stylesheet" href="/css/'+r.name+'">').join('');
const page=empty=>{
 const snapshot={organization:{name:'Synthetic QA organization',role:'instructor'},educationRoles:['instructor']};
 const component=React.createElement(shell.StudioShell,{snapshot,eyebrow:'Workbooks',title:'Workbooks',description:'Synthetic local layout verification only — no user workbooks or saved changes.'},React.createElement(StudioWorkbookTable,{workbooks:empty?[]:workbooks}));
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic workbook layout</title>'+stylesHtml+'</head><body>'+renderToStaticMarkup(component)+'</body></html>';
};
const pages=new Map([['/desktop',page(false)],['/narrow',page(false)],['/empty',page(true)],['/','<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Workbook layout QA</title></head><body style="margin:0;padding:12px;font:14px sans-serif"><h1>Synthetic workbook layout verification</h1><p>Actual components and production-compiled CSS. Read-only static fixture, not the signed-in application.</p><iframe title="Desktop workbook layout 1280 by720" src="/desktop" width="1280" height="720" style="border:1px solid #bbb;display:block"></iframe><h2>Narrow layout</h2><iframe title="Narrow workbook layout640 by900" src="/narrow" width="640" height="900" style="border:1px solid #bbb;display:block"></iframe><h2>Empty collection</h2><iframe title="Empty workbook collection1280 by480" src="/empty" width="1280" height="480" style="border:1px solid #bbb;display:block"></iframe></body></html>']]);
const server=http.createServer((req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;
 res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src 'self'; base-uri 'none'; form-action 'none'");res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 if(pages.has(path)){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(pages.get(path));return;}
 const asset=assets.get(path);if(asset){res.setHeader('Content-Type',asset.type);res.end(asset.bytes);return;}
 res.writeHead(404);res.end();
});
server.listen(0,'127.0.0.1',()=>{const port=server.address().port;const info={at:new Date().toISOString(),pid:process.pid,url:'http://127.0.0.1:'+port+'/',port,loopbackOnly:true,variant:followup?'corrected-header-v2':'original-header-v1',actualSourceFiles:['components/StudioWorkbookTable.tsx','components/StudioShell.tsx','components/StudioNavigation.tsx','lib/studio-queues.ts'].map(path=>({path,sha256:sha(read(site+'/'+path))})),compiledCss:styles.map(r=>({name:r.name,sha256:sha(r.bytes)})),staticSyntheticFixture:true,privateDataUsed:false,authRouteBypassed:false,fullSignedInApplicationAcceptance:false};fs.writeFileSync(stage+'/LAYOUT_QA_SERVER'+(followup?'-v2':'')+'.json',JSON.stringify(info,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(info));});
process.stdin.setEncoding('utf8');process.stdin.on('data',data=>{if(data.trim()==='stop')server.close(()=>{process.stdin.pause();console.log('Owned synthetic fixture stopped.');});});

// Isolated real-component browser acceptance, not the full Atlas or a deployment.
import {build} from 'esbuild';
import {createServer} from 'node:http';
const root=process.cwd();
const result=await build({stdin:{contents:`import React,{useState} from 'react';
import{createRoot}from'react-dom/client';
import{StructureQuickCheck}from'./app/structure-quick-check';
import{structures}from'./app/anatomy-data';
function Preview(){const [index,setIndex]=useState(0);const s=structures[index],q=s.sections.quiz;return <main><h1>Structure check</h1><p>Local interaction preview · draft teaching</p><label>Structure <select value={index} onChange={e=>setIndex(Number(e.target.value))}>{structures.map((s,i)=><option value={i} key={s.id}>{s.name}</option>)}</select></label><StructureQuickCheck key={s.id} question={q.body} choices={q.bullets??[]} correctAnswer={q.correctAnswer??null} explanation={q.explanation}/></main>}
createRoot(document.getElementById('root')).render(<Preview/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,outdir:'.local/quick-check-preview',format:'esm',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).contents;
const css=result.outputFiles.find(f=>f.path.endsWith('.css')).contents;
const server=createServer((req,res)=>{
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
 res.setHeader('Cache-Control','no-store');
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/test.js'){res.setHeader('Content-Type','text/javascript');return res.end(js);}
 if(path==='/test.css'){res.setHeader('Content-Type','text/css');return res.end(css);}
 if(path!=='/'){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Structure check · local preview</title><link rel="stylesheet" href="/test.css"><style>body{margin:0;font:16px Arial,sans-serif;color:#174e4b;background:#f4faf8}main{max-width:420px;margin:24px auto;padding:20px;background:white}select{max-width:100%;min-height:44px;font:inherit}h1{font-size:24px}</style><div id="root"></div><script type="module" src="/test.js"></script></html>');
});
server.listen(0,'127.0.0.1',()=>console.log(`Component preview: http://127.0.0.1:${server.address().port}/`));

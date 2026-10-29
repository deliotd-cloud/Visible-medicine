import {createServer} from 'node:http';
import fs from 'node:fs';
const root='G:/VisibleMedicine-temp/staging/20261029-course-catalogue-browser';
const header='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic course catalogue QA</title><style>body{font-family:system-ui;margin:24px}header{padding:12px;background:#fff1cc}input,select,button{margin:8px;padding:8px}label{display:inline-block}a{display:block;margin:20px 0}a h2{font-size:20px}small,span{margin-right:8px}</style></head><body><header>Synthetic local browser check · no real courses or accounts</header>';
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(url.pathname==='/bundle.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(fs.readFileSync(root+'/bundle.js'));return;}
 res.setHeader('Content-Type','text/html; charset=utf-8');
 if(url.pathname==='/courses'){res.end(header+'<main id="root"></main><script src="/bundle.js" defer></script></body></html>');return;}
 if(['/courses/ct-mri','/courses/xray','/courses/shoulder','/courses/mri'].includes(url.pathname)){res.end(header+'<main><h1>Synthetic course detail</h1><p>Use browser Back to return to your filtered catalogue.</p></main></body></html>');return;}
 res.statusCode=404;res.end(header+'<p>Unknown synthetic route</p></body></html>');
});
server.listen(0,'127.0.0.1',()=>{const value={pid:process.pid,port:server.address().port,at:new Date().toISOString()};fs.writeFileSync(root+'/SERVER.json',JSON.stringify(value));console.log(JSON.stringify(value));});

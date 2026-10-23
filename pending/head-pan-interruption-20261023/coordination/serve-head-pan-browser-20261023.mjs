import fs from 'node:fs';import http from 'node:http';
const root='F:/VisibleMedicine/staging/20261023-head-pan-interruption/browser';
const files=new Map([['/',['index.html','text/html']],['/bundle.js',['bundle.js','text/javascript']],['/fixture.css',['fixture.css','text/css']]]);
const server=http.createServer((req,res)=>{const target=files.get(req.url);if(!target){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':target[1],'cache-control':'no-store'});fs.createReadStream(root+'/'+target[0]).pipe(res);});
server.listen({host:'127.0.0.1',port:3052},()=>console.log(JSON.stringify({pid:process.pid,url:'http://127.0.0.1:3052/',root,syntheticOnly:true,ownerPreviewChanged:false})));

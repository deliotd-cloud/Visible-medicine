import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('./app.js',import.meta.url));
const html='<!doctype html><html lang="en"><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Synthetic scan recovery check</title><style>body{font:16px system-ui;max-width:900px;margin:32px auto;padding:16px;color:#092c34}button{font:inherit;padding:10px}:focus{outline:3px solid #008090;outline-offset:3px}</style><div id="root"></div><script type="module" src="/app.js"></script></html>';
const server=createServer((req,res)=>{res.setHeader('Cache-Control','no-store');if(req.method!=='GET'){res.writeHead(405).end();return;}if(req.url==='/app.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end(script);return;}if(req.url==='/baseline'||req.url==='/candidate'){res.writeHead(200,{'Content-Type':'text/html'}).end(html);return;}res.writeHead(404).end();});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({pid:process.pid,url:'http://127.0.0.1:'+server.address().port,syntheticOnly:true})));

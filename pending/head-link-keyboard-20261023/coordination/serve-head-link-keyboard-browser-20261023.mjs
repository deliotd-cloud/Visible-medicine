// Owned, ephemeral, loopback-only fixture; no real API or arbitrary file serving.
import fs from 'node:fs';import http from 'node:http';import assert from 'node:assert/strict';
const root='F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard/browser',allowed=new Set(['index.html','bundle.js','bundle.css']);
assert(fs.existsSync(root+'/BUILD.json'));let port,sequence=0;
const server=http.createServer(async(req,res)=>{res.setHeader('Cache-Control','no-store');try{
 if(req.method==='POST'&&req.url==='/evidence'){
  if(req.headers.origin!=='http://127.0.0.1:'+port){res.writeHead(403).end();return;}
  let body='';for await(const part of req){body+=part;if(Buffer.byteLength(body)>32768)throw Error('Oversized synthetic evidence');}
  const value=JSON.parse(body);fs.writeFileSync(root+'/ui-'+(++sequence)+'.json',JSON.stringify({at:new Date().toISOString(),...value},null,2)+'\n',{flag:'wx'});
  res.end('Evidence saved');return;
 }
 const name=req.url==='/'?'index.html':req.url.slice(1);
 if(req.method!=='GET'||!allowed.has(name)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(root+'/'+name));
 }catch(error){res.writeHead(500).end('Synthetic fixture failed');console.error(error);}
});
server.listen(0,'127.0.0.1',()=>{port=server.address().port;const value={at:new Date().toISOString(),pid:process.pid,url:'http://127.0.0.1:'+port+'/',previewChanged:false,syntheticOnly:true};fs.writeFileSync(root+'/STARTED.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(value));});

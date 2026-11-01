import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261101-focus-native-runtime/export/public/atlas-runtime/head-neck';
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json'));
const files=new Map(manifest.files.map(row=>[row.path,row]));
const prefix='/atlas-runtime/head-neck/';
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)||!/^127\.0\.0\.1:\d+$/.test(req.headers.host??'')){res.writeHead(403);return res.end();}
 const u=new URL(req.url,'http://127.0.0.1');let rel;try{rel=decodeURIComponent(u.pathname.slice(prefix.length));}catch{res.writeHead(400);return res.end();}
 const row=u.pathname.startsWith(prefix)?files.get(rel):null;
 if(!row){res.writeHead(404);return res.end();}
 const data=fs.readFileSync(path.join(root,rel));
 if(crypto.createHash('sha256').update(data).digest('hex')!==row.sha256){res.writeHead(409);return res.end();}
 const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.txt':'text/plain'}[path.extname(rel)]??'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime,'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:data);
});
server.listen(0,'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port+prefix+'index.html?region=pelvis';const state={at:new Date().toISOString(),pid:process.pid,url,sourceCommit:manifest.sourceCommit,installed:false,privateDataIncluded:false};fs.writeFileSync('G:/VisibleMedicine-temp/proposals/20261101-focus-native-runtime/BROWSER_SERVER_STARTED.json',JSON.stringify(state,null,2)+'\n');console.log(JSON.stringify(state));});



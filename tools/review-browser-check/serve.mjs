import http from 'node:http';import fs from 'node:fs';
const root='G:/VisibleMedicine-temp/proposals/20261031-review-browser-check';
const names=new Map([['/','index.html'],['/app.js','app.js'],['/app.css','app.css']]);
const server=http.createServer((req,res)=>{const name=names.get(req.url);if(req.method!=='GET'||!name){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'none'"});res.end(fs.readFileSync(root+'/public/'+name));});
server.listen(0,'127.0.0.1',()=>{const state={pid:process.pid,port:server.address().port,address:'127.0.0.1',scope:'Synthetic isolated component only'};fs.writeFileSync(root+'/SERVER.json',JSON.stringify(state,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(state));});

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const stage='F:/VisibleMedicine/staging/20261023-fda-shoulder-reference',atlas=stage+'/atlas',root=stage+'/visual-qa';
const require=createRequire(atlas+'/package.json');
const esbuild=require('esbuild');
await esbuild.build({entryPoints:[root+'/entry.tsx'],outfile:root+'/app.js',bundle:true,format:'esm',platform:'browser',jsx:'automatic',nodePaths:[atlas+'/node_modules'],legalComments:'eof',define:{'process.env.NODE_ENV':'"production"'}});
const allow=new Map([['/','index.html','text/html'],['/app.js','app.js','application/javascript'],['/app.css','app.css','text/css']].map(([u,p,t])=>[u,{path:root+'/'+p,type:t}]));
for(const p of ['catalog.json','reference.glb'])allow.set('/models/fda-shoulder-draft/'+p,{path:atlas+'/public/models/fda-shoulder-draft/'+p,type:p.endsWith('.json')?'application/json':'model/gltf-binary'});
const server=http.createServer((req,res)=>{
 const match=allow.get(new URL(req.url,'http://127.0.0.1').pathname);console.log(req.method+' '+req.url+' '+(match?200:404));
 if(!match||req.method!=='GET'){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':match.type,'Content-Length':fs.statSync(match.path).size,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'"});fs.createReadStream(match.path).pipe(res);
});
const sources=['app/fda-shoulder-reference.tsx','app/fda-shoulder-reference.css','lib/fda-reference-model-loader.ts','lib/fda-shoulder-reference.ts','lib/fda-reference-review.ts','public/models/fda-shoulder-draft/catalog.json','public/models/fda-shoulder-draft/reference.glb'];
fs.writeFileSync(root+'/BUILT.json',JSON.stringify({at:new Date().toISOString(),productionReact:true,actualComponent:true,source:sources.map(p=>({path:p,sha256:createHash('sha256').update(fs.readFileSync(atlas+'/'+p)).digest('hex')})),outputs:['app.js','app.css'].map(p=>({path:p,sha256:createHash('sha256').update(fs.readFileSync(root+'/'+p)).digest('hex')}))},null,2)+'\n');
if(!process.argv.includes('--build-only'))server.listen(0,'127.0.0.1',()=>console.log('LOCAL_QA_URL=http://127.0.0.1:'+server.address().port+'/'));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));

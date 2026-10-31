import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const files=new Map([['/',[resolve(here,'index.html'),'text/html']],['/public/baseline.js',[resolve(here,'public/baseline.js'),'text/javascript']],
  ['/public/proposal.js',[resolve(here,'public/proposal.js'),'text/javascript']],['/atlas-runtime/head-neck/index.html',[resolve(here,'iframe.html'),'text/html']]]);
const port=Number(process.env.QA_PORT??3108);
createServer(async(req,res)=>{const entry=files.get(new URL(req.url??'/',`http://127.0.0.1:${port}`).pathname);
  if(!entry){res.writeHead(404);res.end('Not found');return;}
  try{res.writeHead(200,{'content-type':entry[1]+'; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(await readFile(entry[0]));}
  catch{res.writeHead(500);res.end('Fixture asset missing: run build.mjs first');}
}).listen(port,'127.0.0.1',()=>console.log(`Synthetic comparison fixture: http://127.0.0.1:${port}/?variant=baseline or ?variant=proposal`));

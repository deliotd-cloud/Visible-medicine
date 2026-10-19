// Actual installed Vite, isolated synthetic module, no app/plugin/storage load.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import test from 'node:test';
import { localPreviewServerOptions } from '../scripts/local-preview-policy.mjs';

test('installed Vite keeps a loaded module stable across edits, then loads the new version after restart',async()=>{
  const stage='F:/VisibleMedicine/staging/20261015-stable-preview/watch-fixtures';
  mkdirSync(stage,{recursive:true});
  const root=mkdtempSync(resolve(stage,'synthetic-'));
  const file=resolve(root,'fixture.mjs');
  writeFileSync(file,"export const value='before';\n");
  async function open(){
    const server=await createServer({configFile:false,root,appType:'custom',logLevel:'silent',
      server:{...localPreviewServerOptions({command:'serve',stable:'1'}),port:0},
      plugins:[{name:'synthetic-module-request',configureServer(server){
        server.middlewares.use('/synthetic',async(_request,response,next)=>{
          try{const module=await server.ssrLoadModule('/fixture.mjs');response.end(module.value);}
          catch(error){next(error);}
        });
      }}]});
    await server.listen();
    const address=server.httpServer.address();
    return {server,url:`http://127.0.0.1:${address.port}/synthetic`};
  }
  const read=async url=>{
    const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(5000)});
    assert.equal(response.status,200);return response.text();
  };
  const first=await open();
  try{
    assert.equal(first.server.config.server.watch,null);
    assert.equal(first.server.config.server.hmr,false);
    assert.equal(await read(first.url),'before');
    writeFileSync(file,"export const value='after';\n");
    // Exercise multiple requests after the completed write, not a timing-only
    // assertion. No watcher exists to invalidate the loaded module.
    for(let cycle=0;cycle<5;cycle++)assert.equal(await read(first.url),'before');
  }finally{await first.server.close();}
  const second=await open();
  try{assert.equal(await read(second.url),'after');}
  finally{await second.server.close();}
});

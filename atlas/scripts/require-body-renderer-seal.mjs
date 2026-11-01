// Read-only gate for delivery paths that consume the saved body review seal.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const defaultRoot=fileURLToPath(new URL('../',import.meta.url));

export function requireBodyRendererSeal({root=defaultRoot,generator=resolve(root,'scripts/body-renderer-revisions.mjs'),run=spawnSync}={}){
  const command=generator;
  const result=run(process.execPath,[command,'--check'],{
    cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:1024*1024,
  });
  if(result.error||result.signal||result.status!==0)
    throw new Error('Body renderer revision is stale; regenerate and require re-review',
      {cause:result.error??new Error(result.stderr?.trim()||`Checker exited ${result.status}`)});
}

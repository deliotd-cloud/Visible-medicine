// Async equivalent of the website's emittedTeaching helper for proposal-only blob reads.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export async function emittedTeaching(base:string,files:{path:string;sha256:string}[],allReachable=false,readArtifact:(path:string)=>Promise<Buffer>) {
  const read=async(path:string)=>{
    const file=files.find(file=>file.path===path);assert.ok(file,`${path} in manifest`);
    const bytes=await readArtifact(base+path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,path);
    return bytes.toString();
  };
  const reachable=new Set<string>();
  const visit=async(path:string):Promise<void>=>{
    if(reachable.has(path))return;
    reachable.add(path);
    const text=await read(path);
    for(const match of text.matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))await visit('assets/'+match[1]);
  };
  await visit('index.html');
  const teaching=files.filter(file=>/^assets\/body-content-[^/]+\.js$/.test(file.path));
  assert.equal(teaching.length,1,'One emitted deferred teaching module');
  assert.ok(reachable.has(teaching[0].path),'Teaching is reachable through emitted entry imports');
  if(!allReachable)return read(teaching[0].path);
  const scripts=[...reachable].filter(path=>path.endsWith('.js'));
  const parts=[];
  for(const path of scripts)parts.push(await read(path));
  return parts.join('\n');
}

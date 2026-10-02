import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

/** Verify teaching bytes and their actual import path from the emitted entry. */
export function emittedTeaching(base:string,files:{path:string;sha256:string}[],allReachable=false,readArtifact:(path:string)=>Buffer=readFileSync) {
  const read=(path:string)=>{
    const file=files.find(file=>file.path===path);assert.ok(file,`${path} in manifest`);
    const bytes=readArtifact(base+path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,path);
    return bytes.toString();
  };
  const reachable=new Set<string>();
  const visit=(path:string)=>{
    if(reachable.has(path))return;
    reachable.add(path);
    const text=read(path);
    for(const match of text.matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))visit('assets/'+match[1]);
  };
  visit('index.html');
  const teaching=files.filter(file=>/^assets\/body-content-[^/]+\.js$/.test(file.path));
  assert.equal(teaching.length,1,'One emitted deferred teaching module');
  assert.ok(reachable.has(teaching[0].path),'Teaching is reachable through emitted entry imports');
  return allReachable?[...reachable].filter(path=>path.endsWith('.js')).map(read).join('\n'):read(teaching[0].path);
}

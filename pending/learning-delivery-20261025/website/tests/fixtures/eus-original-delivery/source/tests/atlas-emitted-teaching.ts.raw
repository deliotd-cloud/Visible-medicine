import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {StringDecoder} from 'node:string_decoder';

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

/** Same manifested DFS text search without retaining every viewer script. */
export function emittedTeachingSearch(base:string,files:{path:string;sha256:string}[],readArtifact:(path:string)=>Buffer=readFileSync){
  const records=new Map(files.map(file=>[file.path,file]));
  assert.equal(records.size,files.length,'Unique emitted paths');
  const read=(path:string)=>{
    const record=records.get(path);assert(record,`${path} in manifest`);
    const bytes=readArtifact(base+path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,path);
    return bytes;
  };
  const reachable=new Set<string>();
  const visit=(path:string)=>{
    if(reachable.has(path))return;
    reachable.add(path);
    for(const match of read(path).toString().matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))visit('assets/'+match[1]);
  };
  visit('index.html');
  const teaching=files.filter(file=>/^assets\/body-content-[^/]+\.js$/.test(file.path));
  assert.equal(teaching.length,1,'One emitted deferred teaching module');
  assert(reachable.has(teaching[0].path),'Teaching is reachable through emitted entry imports');
  const scripts=[...reachable].filter(path=>path.endsWith('.js'));
  return Object.freeze({includes(needle:string){
    assert.equal(typeof needle,'string');
    let tail='',found=needle.length===0;
    const accept=(text:string)=>{
      if(found)return;
      const joined=tail+text;
      found=joined.includes(needle);
      tail=needle.length>1?joined.slice(1-needle.length):'';
    };
    for(const [index,path]of scripts.entries()){
      // Recheck every reachable script, including after an early match.
      const bytes=read(path);
      if(found)continue;
      if(index)accept('\n');
      const decoder=new StringDecoder('utf8');
      for(let offset=0;offset<bytes.length&&!found;offset+=65536)
        accept(decoder.write(bytes.subarray(offset,offset+65536)));
      if(!found)accept(decoder.end());
    }
    return found;
  }});
}

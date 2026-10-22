// Owned native Node test coordinator. This same PID waits for its Windows
// identity to be recorded before it starts any test file.
import {createWriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {run} from 'node:test';
import {spec,tap} from 'node:test/reporters';

const parentPid=Number(process.env.VM_CHUNK_PARENT_PID);
const token=process.env.VM_CHUNK_HANDSHAKE_TOKEN;
if(!Number.isSafeInteger(parentPid)||parentPid<=0||process.ppid!==parentPid||
  typeof token!=='string'||!/^[0-9a-f-]{36}$/.test(token)||typeof process.send!=='function')
  throw Error('Owned test-child handshake required');

const [tapArg,...files]=process.argv.slice(2);
if(!tapArg?.startsWith('--tap=')||!files.length||files.some(file=>!/^tests\/[A-Za-z0-9._-]+\.test\.(?:ts|mjs)$/.test(file)))
  throw Error('Frozen native test arguments required');
const tapPath=tapArg.slice('--tap='.length);

await new Promise(resolve=>{
  let released=false;
  const stop=()=>{if(!released)process.exit(77);};
  const onMessage=message=>{
    if(message?.type!=='vm-child-release'||message.token!==token)return;
    released=true;
    process.off('message',onMessage);
    process.off('disconnect',stop);
    process.off('SIGTERM',stop);
    process.off('SIGINT',stop);
    if(process.connected)process.disconnect();
    resolve();
  };
  process.on('message',onMessage);
  process.once('disconnect',stop);
  process.once('SIGTERM',stop);
  process.once('SIGINT',stop);
  process.send({type:'vm-child-ready',token,pid:process.pid});
});

const tests=run({files,concurrency:1});
let failed=false;
tests.on('test:fail',()=>{failed=true;});
tests.on('error',()=>{failed=true;});
const specOutput=tests.compose(spec);
const tapOutput=tests.compose(tap);
specOutput.pipe(process.stdout);
const tapFile=createWriteStream(tapPath,{flags:'wx'});
tapOutput.pipe(tapFile);
await Promise.all([finished(specOutput),finished(tapFile)]);
if(failed)process.exitCode=1;

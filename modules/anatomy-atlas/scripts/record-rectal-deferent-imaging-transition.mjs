import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import pins from '../content/rectal-deferent-imaging-pins.json' with {type:'json'};

const compiled=await build({stdin:{contents:"export {bodyLesson} from './app/body-content';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const result={parentCommit:pins.sourceCommit,entries:pins.entries.map(e=>({id:e.identity.id,sections:Object.fromEntries(e.topics.map(t=>{const l=api.bodyLesson(e.identity,t);assert.equal(l.readiness,'draft');return[t,sha(l)];}))}))};
const file='content/rectal-deferent-imaging.transition.json',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(file,'utf8')).replace(/\r\n/g,'\n'),text);else await writeFile(file,text,{flag:'wx'});
console.log(JSON.stringify({pinsHash:sha(pins),transitionHash:sha(result),placements:12}));

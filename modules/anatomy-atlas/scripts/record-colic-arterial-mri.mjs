import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import pins from '../content/colic-arterial-mri-pins.json' with {type:'json'};
import {build} from './workspace-component-test-build.mjs';
const root=process.cwd(),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const result=await build({stdin:{contents:"export {bodyLesson} from './app/body-content';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
const module={exports:{}},require=createRequire(root+'/package.json');
runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,structuredClone,URL,URLSearchParams});
const transition={parentCommit:pins.parentCommit,pinsHash:hash(pins),entries:pins.entries.flatMap(e=>e.topics.map(tab=>{
 const lesson=module.exports.bodyLesson(e.identity,tab);assert.equal(lesson.readiness,'draft');
 return{id:e.identity.id,tab,previousHash:hash(e.previous[tab]),currentHash:hash(lesson)};
}))};
assert.equal(transition.entries.length,9);const text=JSON.stringify(transition,null,2)+'\n',path='content/colic-arterial-mri-transition.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({pinsHash:hash(pins),transitionHash:hash(transition),placements:9}));

import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const built=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const rows=catalog.structures.filter(s=>s.bundle!=='corpus-spongiosum'),bundles=catalog.bundles.filter(b=>b.id!=='corpus-spongiosum');
const tabs=['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'];
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(rows.length,1101);
const result={sourceCommit:'4516a19b5f61b0f3118786e87ce70c831e5c10d9',structures:rows.length,topics:rows.length*tabs.length,recordsSha256:sha(rows),bundlesSha256:sha(bundles),topicsSha256:sha(rows.map(s=>({id:s.id,lessons:tabs.map(t=>api.bodyLesson(s,t))})))};
const path='content/corpus-spongiosum-baseline.json',output=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),output);
else {assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),result.sourceCommit);await writeFile(path,output,{flag:'wx'});}
console.log(JSON.stringify(result));

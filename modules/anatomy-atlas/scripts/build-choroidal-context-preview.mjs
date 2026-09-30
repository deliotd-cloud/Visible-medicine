import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {choroidalContextReport} from './choroidal-context-report.mjs';
import {contextScene} from './choroidal-context-scene.mjs';
import {hash} from './anterior-choroidal-source-report.mjs';

const {report,meshes}=await choroidalContextReport();
assert.equal((await readFile('content/choroidal-context-review.json','utf8')).replaceAll('\r\n','\n'),JSON.stringify(report,null,2)+'\n','Saved context report stale');
const destination=resolve('../work/choroidal-context-preview-20260930');
await mkdir(destination,{recursive:true});
const refresh=process.argv.includes('--refresh');
if(refresh){const previous=JSON.parse(await readFile(resolve(destination,'manifest.json')));assert.equal(previous.purpose,report.purpose);assert(previous.files.every(f=>['app.js','index.html','scene.json','THIRD_PARTY_NOTICES.txt'].includes(f.name)));for(const f of previous.files)assert.equal(hash(await readFile(resolve(destination,f.name))),f.sha256,'Existing preview changed outside builder');}
const built=await build({entryPoints:['scripts/choroidal-context-viewer.mjs'],bundle:true,platform:'browser',format:'esm',write:false,minify:true,legalComments:'eof',tsconfigRaw:{}});
const files={'index.html':await readFile('scripts/choroidal-context-preview.html'),'app.js':built.outputFiles[0].contents,
  'scene.json':Buffer.from(JSON.stringify(contextScene(report,meshes))),
  'THIRD_PARTY_NOTICES.txt':Buffer.concat([Buffer.from(report.credit+'\nLicense: CC-BY-4.0\nhttps://creativecommons.org/licenses/by/4.0/\nhttps://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html\nOriginal geometry unchanged. Review colours, opacity and camera presentation added.\n\nThree.js and OrbitControls\n'),await readFile('node_modules/three/LICENSE')])};
const manifest={purpose:report.purpose,reportSha256:hash(JSON.stringify(report,null,2)+'\n'),files:[]};
for(const [name,bytes] of Object.entries(files)){await writeFile(resolve(destination,name),bytes,{flag:refresh?'w':'wx'});manifest.files.push({name,bytes:bytes.length,sha256:hash(bytes)});}
await writeFile(resolve(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:refresh?'w':'wx'});
console.log(JSON.stringify({destination,structures:meshes.length,manifest,admissions:0,clinicalValidation:false}));

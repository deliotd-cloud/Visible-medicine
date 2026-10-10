import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {discSourceReviewReport,discHash} from './disc-source-review-report.mjs';
import {discReviewPacket} from './disc-source-review-packet.mjs';
const {report,meshes}=await discSourceReviewReport();assert.equal((await readFile('docs/unresolved-disc-source-review.json','utf8')).replaceAll('\r\n','\n'),JSON.stringify(report,null,2)+'\n','Saved report stale');
const scene=discReviewPacket(report,meshes),destination=resolve('../work/unresolved-disc-preview-20261002');
try{await access(destination);throw Error('Preserve existing preview '+destination);}catch(error){if(error.code!=='ENOENT')throw error;}
const built=await build({entryPoints:['scripts/disc-source-review-viewer.mjs'],bundle:true,platform:'browser',format:'esm',write:false,minify:true,legalComments:'eof',tsconfigRaw:{}});
const files={'index.html':Buffer.from((await readFile('scripts/disc-source-review-preview.html','utf8')).replace('__REPORT_HASH__',scene.reportSha256)),
 'app.js':built.outputFiles[0].contents,'scene.json':Buffer.from(JSON.stringify(scene)),
 'THIRD_PARTY_NOTICES.txt':Buffer.concat([await readFile('LICENSES/unresolved-disc-source-review.md'),Buffer.from('\nThree.js and OrbitControls\n'),await readFile('node_modules/three/LICENSE')])};
await mkdir(destination,{recursive:true});const manifest={purpose:report.purpose,reportSha256:scene.reportSha256,admissions:0,levelAssigned:false,files:[]};
for(const [name,bytes]of Object.entries(files)){await writeFile(resolve(destination,name),bytes,{flag:'wx'});manifest.files.push({name,bytes:bytes.length,sha256:discHash(bytes)});}
await writeFile(resolve(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({destination,reportSha256:scene.reportSha256,meshes:8,admissions:0,levelAssigned:false}));

import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {opticAlternativeReport} from './optic-alternative-report.mjs';
import {opticAlternativeScene,opticHash} from './optic-alternative-scene.mjs';
const {report,meshes}=await opticAlternativeReport();
const saved=await readFile('docs/optic-nerve-alternatives.json','utf8');
assert.equal(saved.replaceAll('\r\n','\n'),JSON.stringify(report,null,2)+'\n','Saved optic report stale');
const scene=opticAlternativeScene(report,meshes);
const destination=resolve(process.argv.includes('--v2')?'../work/optic-alternative-preview-20261002-v2':'../work/optic-alternative-preview-20261002');
try{await access(destination);throw Error('Preserve existing preview: '+destination);}catch(error){if(error.code!=='ENOENT')throw error;}
const built=await build({entryPoints:['scripts/optic-alternative-viewer.mjs'],bundle:true,platform:'browser',format:'esm',write:false,minify:true,legalComments:'eof',tsconfigRaw:{}});
const files={'index.html':await readFile('scripts/optic-alternative-preview.html'),'app.js':built.outputFiles[0].contents,
 'scene.json':Buffer.from(JSON.stringify(scene)),
 'THIRD_PARTY_NOTICES.txt':Buffer.concat([Buffer.from(report.credit+'\nLicense: '+report.license+'\nhttps://creativecommons.org/licenses/by/4.0/\nhttps://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html\nOriginal mesh coordinates and topology unchanged. Review camera, colours and transparency added. No patient data.\n\nThree.js and OrbitControls\n'),await readFile('node_modules/three/LICENSE')])};
await mkdir(destination,{recursive:true});const manifest={purpose:report.purpose,reportSha256:scene.reportSha256,files:[]};
for(const[name,bytes]of Object.entries(files)){await writeFile(resolve(destination,name),bytes,{flag:'wx'});manifest.files.push({name,bytes:bytes.length,sha256:opticHash(bytes)});}
await writeFile(resolve(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,reportSha256:scene.reportSha256,meshes:meshes.length,files:manifest.files.length,admissions:0,clinicalValidation:false}));

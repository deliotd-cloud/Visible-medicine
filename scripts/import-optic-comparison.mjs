import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
// Original held geometry is LOCAL, server-only and ignored, never public/ or Git.
const revision='d9cd141f1fefae6842754e134a1ef18d5661c727';
const position=process.argv.indexOf('--source');
assert(position>=0&&process.argv[position+1],'Pass --source <existing Atlas checkout>');
const source=resolve(process.argv[position+1]),git=(...args)=>execFileSync('git',args,{cwd:source,encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),revision,'Unreviewed Atlas inspector revision');
assert.equal(git('status','--porcelain'),'','Preserve and finish Atlas work before import');
const {opticAlternativeScene}=await import(pathToFileURL(join(source,'scripts/optic-alternative-scene.mjs')));
const website=process.cwd();let replay;
try{
 process.chdir(source);
 const {opticAlternativeReport}=await import(pathToFileURL(join(source,'scripts/optic-alternative-report.mjs')));
 replay=await opticAlternativeReport();
}finally{process.chdir(website);}
const {report,meshes}=replay;
assert.equal((await readFile(join(source,'docs/optic-nerve-alternatives.json'),'utf8')).replaceAll('\r\n','\n'),JSON.stringify(report,null,2)+'\n');
const scene=opticAlternativeScene(report,meshes);
assert.equal(scene.meshes.length,10);assert.equal(scene.pairs.length,2);
assert.equal(scene.meshes.filter(m=>m.role==='candidate'&&m.held===true).length,4);
assert.equal(scene.admissions,0);assert.equal(scene.clinicalValidation,false);assert.equal(scene.sourceGeometryChanged,false);
const {build}=await import(pathToFileURL(join(source,'node_modules/esbuild/lib/main.js')));
const bundled=await build({absWorkingDir:source,entryPoints:['scripts/optic-alternative-viewer.mjs'],bundle:true,platform:'browser',format:'esm',write:false,minify:true,legalComments:'eof',tsconfigRaw:{}});
let html=await readFile(join(source,'scripts/optic-alternative-preview.html'),'utf8');
for(const name of ['app.js','THIRD_PARTY_NOTICES.txt']){
 const before='./'+name;assert.equal(html.split(before).length,2,'Ambiguous inspector URL');
 html=html.replace(before,before+'?revision='+scene.reportSha256);
}
const notices=Buffer.concat([Buffer.from(report.credit+'\nLicense: '+report.license+'\nhttps://creativecommons.org/licenses/by/4.0/\nhttps://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html\nOriginal mesh coordinates/topology unchanged. Presentation only. Held; no clinical approval or patient data.\n\nThree.js and OrbitControls\n'),await readFile(join(source,'node_modules/three/LICENSE'))]);
const assets={'index.html':Buffer.from(html),'app.js':Buffer.from(bundled.outputFiles[0].contents),'scene.json':Buffer.from(JSON.stringify(scene)),'THIRD_PARTY_NOTICES.txt':notices};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest={schemaVersion:1,purpose:scene.purpose,atlasInspectorRevision:revision,reportSha256:scene.reportSha256,admissions:0,clinicalValidation:false,sourceGeometryChanged:false,
 license:scene.license,credit:scene.credit,meshCount:10,pairs:scene.pairs.map(p=>({id:p.id,side:p.side,files:p.files,held:true})),
 meshes:report.meshes.map(m=>({key:m.key,id:m.id,side:m.side,role:m.role,held:m.held,sources:m.sources,geometrySha256:m.geometrySha256})),
 files:Object.entries(assets).map(([name,bytes])=>({name,bytes:bytes.length,sha256:hash(bytes)}))};
const manifestText=JSON.stringify(manifest,null,2)+'\n';
const moduleText="import 'server-only';\n// Generated local-only held source packet. Regenerate with scripts/import-optic-comparison.mjs.\nexport const opticComparisonAssets: Record<string,string> = "+JSON.stringify(Object.fromEntries(Object.entries(assets).map(([name,bytes])=>[name,bytes.toString('base64')])))+';\n';
if(process.argv.includes('--check')){
 assert.equal((await readFile('lib/optic-comparison-manifest.json','utf8')).replaceAll('\r\n','\n'),manifestText,'Comparison metadata stale');
 assert.equal(await readFile('.local/optic-review/assets.ts','utf8'),moduleText,'Local server-only packet stale');
}else{
 await mkdir('.local/optic-review',{recursive:true});
 await writeFile('.local/optic-review/assets.ts',moduleText);
 await writeFile('lib/optic-comparison-manifest.json',manifestText);
}
console.log(JSON.stringify({checked:process.argv.includes('--check'),revision,reportSha256:scene.reportSha256,files:manifest.files.length,meshes:10,admissions:0,rawAssets:'ignored server-only module; no public assets'}));

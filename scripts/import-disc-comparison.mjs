import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
// Pinned local-only held source; never copy to public/ or admitted review exports.
const revision='952d758104102f5853e00e846cb3448511daa960';
const position=process.argv.indexOf('--source');
assert(position>=0&&process.argv[position+1],'Pass --source <existing Atlas checkout>');
const source=resolve(process.argv[position+1]),git=(...args)=>execFileSync('git',args,{cwd:source,encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),revision,'Unreviewed Atlas inspector revision');
assert.equal(git('status','--porcelain'),'','Finish Atlas work before importing');
const website=process.cwd();let replay;
try {process.chdir(source);const {discSourceReviewReport}=await import(pathToFileURL(join(source,'scripts/disc-source-review-report.mjs')));replay=await discSourceReviewReport();}
finally {process.chdir(website);}
const {report,meshes}=replay;
assert.equal((await readFile(join(source,'docs/unresolved-disc-source-review.json'),'utf8')).replaceAll('\r\n','\n'),JSON.stringify(report,null,2)+'\n');
const {discReviewPacket}=await import(pathToFileURL(join(source,'scripts/disc-source-review-packet.mjs')));
const scene=discReviewPacket(report,meshes);
assert.equal(scene.meshes.length,8);assert.equal(scene.admissions,0);assert.equal(scene.levelAssigned,false);assert.equal(scene.clinicalValidation,false);
const {build}=await import(pathToFileURL(join(source,'node_modules/esbuild/lib/main.js')));
const bundled=await build({absWorkingDir:source,entryPoints:['scripts/disc-source-review-viewer.mjs'],bundle:true,platform:'browser',format:'esm',write:false,minify:true,legalComments:'eof',tsconfigRaw:{}});
let html=(await readFile(join(source,'scripts/disc-source-review-preview.html'),'utf8')).replace('__REPORT_HASH__',scene.reportSha256);
assert(!html.includes('__REPORT_HASH__'),'Unbound report hash');
for(const name of ['app.js','THIRD_PARTY_NOTICES.txt']) {const before='./'+name;assert.equal(html.split(before).length,2);html=html.replace(before,before+'?revision='+scene.reportSha256);}
const notices=Buffer.concat([await readFile(join(source,'LICENSES/unresolved-disc-source-review.md')),Buffer.from('\nThree.js and OrbitControls\n'),await readFile(join(source,'node_modules/three/LICENSE'))]);
const assets={'index.html':Buffer.from(html),'app.js':Buffer.from(bundled.outputFiles[0].contents),'scene.json':Buffer.from(JSON.stringify(scene)),'THIRD_PARTY_NOTICES.txt':notices};
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest={schemaVersion:1,purpose:scene.purpose,atlasInspectorRevision:revision,reportSha256:scene.reportSha256,admissions:0,clinicalValidation:false,sourceGeometryChanged:false,levelAssigned:false,
 license:scene.license,credit:scene.credit,meshCount:8,meshes:report.meshes,
 files:Object.entries(assets).map(([name,bytes])=>({name,bytes:bytes.length,sha256:hash(bytes)}))};
const manifestText=JSON.stringify(manifest,null,2)+'\n';
const moduleText="import 'server-only';\n// Generated local-only held source packet. Regenerate with scripts/import-disc-comparison.mjs.\nexport const discComparisonAssets: Record<string,string> = "+JSON.stringify(Object.fromEntries(Object.entries(assets).map(([name,bytes])=>[name,bytes.toString('base64')])))+';\n';
if(process.argv.includes('--check')) {
 assert.equal((await readFile('lib/disc-comparison-manifest.json','utf8')).replaceAll('\r\n','\n'),manifestText,'Disc comparison metadata stale');
 assert.equal(await readFile('.local/disc-review/assets.ts','utf8'),moduleText,'Local server-only packet stale');
} else {await mkdir('.local/disc-review',{recursive:true});await writeFile('.local/disc-review/assets.ts',moduleText);await writeFile('lib/disc-comparison-manifest.json',manifestText);}
console.log(JSON.stringify({checked:process.argv.includes('--check'),revision,reportSha256:scene.reportSha256,meshes:8,admissions:0,levelAssigned:false,rawAssets:'ignored server-only module; no public assets'}));

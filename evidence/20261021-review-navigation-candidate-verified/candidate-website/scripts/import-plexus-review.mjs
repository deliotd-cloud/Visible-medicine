import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join,dirname,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {plexusFingerprints} from './plexus-review-fingerprints.mjs';

// Fixed, independently authored code only. Never import models, scans or held donor data.
const sourceCommit='de82626457fb60c3b92b4e4d87a0016b6c3c09ce';
const arg=process.argv.indexOf('--source');
assert(arg>=0&&process.argv[arg+1],'Pass --source <existing Atlas checkout>');
const source=resolve(process.argv[arg+1]),website=process.cwd();
const git=(...args)=>execFileSync('git',args,{cwd:source,encoding:'utf8',windowsHide:true}).trim();
assert.equal(git('rev-parse','HEAD'),sourceCommit,'Unreviewed schematic source revision');
assert.equal(git('status','--porcelain'),'','Schematic source must be clean');
const hash=b=>createHash('sha256').update(b).digest('hex');
const importCode=async options=>{
  const result=await build({...options,bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
};
const {originalPlexusStudy:study,validateOriginalPlexusStudy}=await importCode({entryPoints:[join(source,'lib/original-plexus.ts')]});
assert.deepEqual(validateOriginalPlexusStudy(study),[]);assert.equal(study.parts.length,35);assert.equal(study.connections.length,38);
assert.deepEqual(study.frame,{kind:'diagrammatic',units:'arbitrary',patientRegistration:false});
assert.equal(study.clinicalApproved,false);assert.equal(study.learnerCatalogAdmission,false);
const {plexusChecklists,plexusChecklistVersion}=await importCode({entryPoints:['lib/plexus-review-contract.ts']});
const wrapper=await readFile('scripts/plexus-review-viewer/main.tsx','utf8');
const bundled=await build({absWorkingDir:source,stdin:{contents:wrapper,resolveDir:source,sourcefile:'plexus-private-frame.tsx',loader:'tsx'},jsx:'automatic',bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof',metafile:true,outfile:'app.js',define:{'process.env.NODE_ENV':'"production"'},
  plugins:[{name:'owned-plexus-only',setup(b){
    b.onResolve({filter:/^vm-plexus-viewer$/},()=>({path:join(source,'app/review/candidates/plexus/viewer.tsx')}));
    b.onResolve({filter:/^vm-plexus-css$/},()=>({path:join(source,'app/review/candidates/plexus/viewer.css')}));
    b.onResolve({filter:/^\.\/frame\.css$/},()=>({path:join(website,'scripts/plexus-review-viewer/frame.css')}));
  }}]});
const js=bundled.outputFiles.find(f=>f.path.endsWith('/app.js')||f.path.endsWith('\\app.js'));
const css=bundled.outputFiles.find(f=>f.path.endsWith('/app.css')||f.path.endsWith('\\app.css'));
assert(js&&css&&bundled.outputFiles.length===2,'Unexpected bitmap/font/mesh export');
// Inventory the packages actually contributing bytes, not all tree-shaken Drei imports.
const emittedInputs=new Set(Object.values(bundled.metafile.outputs).flatMap(o=>Object.entries(o.inputs).filter(([,v])=>v.bytesInOutput>0).map(([p])=>p)));
const packageDirs=new Set();
for(const path of emittedInputs){
  const absolute=resolve(source,path);
  if(!absolute.replaceAll('\\','/').includes('/node_modules/')) continue;
  let dir=dirname(absolute);
  while(dir!==dirname(dir)){
    try{const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'));if(pkg.name&&pkg.version){packageDirs.add(dir);break;}}catch{/* no package marker here */}
    dir=dirname(dir);
  }
}
const allowed=new Set(['MIT','ISC','BSD-2-Clause','BSD-3-Clause','Apache-2.0','Zlib']);
const packages=[];let notices='Original Visible Medicine brachial plexus procedural schematic\nMIT-authored application code; no copied mesh, image, font or texture.\nDiagrammatic arbitrary units; no learner admission or spatial/imaging validation.\n\n'+await readFile(join(source,'LICENSE'),'utf8');
for(const dir of [...packageDirs].sort()){
  const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'));
  assert(allowed.has(pkg.license),`Hold unknown/incompatible package licence: ${pkg.name}: ${pkg.license}`);
  let licence,licenceFile;
  for(const name of ['LICENSE','LICENSE.txt','LICENSE.md','LICENSE-MIT','license','license.txt','license.md','LICENCE']){
    try{licence=await readFile(join(dir,name));licenceFile=join(dir,name);break;}catch{/* try exact conventional spelling */}
  }
  // This exact installed package omits its licence file. Reuse the source's
  // previously audited version-specific upstream MIT notice, never infer a grant.
  if(!licence&&pkg.name==='@react-three/fiber'&&pkg.version==='9.7.0'){
    licenceFile=join(source,'LICENSES/react-three-fiber-9.7.0-MIT.txt');licence=await readFile(licenceFile);
  }
  assert(licence?.length,`Missing complete licence text: ${pkg.name}`);
  const licencePath=relative(source,licenceFile).replaceAll('\\','/');
  assert(!licencePath.startsWith('../')&&!isAbsolute(licencePath),'Dependency escaped pinned source checkout');
  packages.push({name:pkg.name,version:pkg.version,license:pkg.license,licensePath:licencePath,licenseSha256:hash(licence),packageSha256:hash(await readFile(join(dir,'package.json')))});
  notices+='\n\n'+pkg.name+' '+pkg.version+' ('+pkg.license+')\n'+licence.toString('utf8');
}
packages.sort((a,b)=>a.name.localeCompare(b.name));
const assets={'app.js':Buffer.from(js.contents),'app.css':Buffer.from(css.contents),'study.json':Buffer.from(JSON.stringify(study)),'THIRD_PARTY_NOTICES.txt':Buffer.from(notices)};
const topologyPaths=['lib/original-plexus.ts'];
const presentationPaths=['lib/original-plexus-presentation.ts','app/review/candidates/plexus/viewer.tsx','app/review/candidates/plexus/viewer.css'];
const governancePaths=['scripts/plexus-review-fingerprints.mjs','lib/plexus-review-contract.ts','lib/plexus-review-decisions.ts','lib/plexus-review-api.ts','lib/plexus-review-store.ts','app/api/atlas-review/plexus-review/route.ts','lib/clinical-review-server.ts','lib/clinical-review-access.ts','app/chatgpt-auth.ts','atlas-review/lib/review-http.ts','atlas-review/lib/body-review-decisions.ts'];
const websitePresentationPaths=['lib/clinical-review-navigation-guard.ts','components/GroupedReviewConfirmation.tsx','lib/review-draft-autosave.ts','scripts/import-plexus-review.mjs','scripts/verify-plexus-review.mjs','scripts/plexus-review-viewer/main.tsx','scripts/plexus-review-viewer/frame.css','components/PlexusReviewWorksheet.tsx','components/plexus-review.css','lib/plexus-review-delivery.ts','lib/clinical-review-fetch.ts','app/workspace/atlas-review/layout.tsx','app/workspace/atlas-review/website-review.css','app/workspace/atlas-review/source-comparisons/plexus/page.tsx','app/api/atlas-review/source-comparisons/plexus/[asset]/route.ts','package-lock.json'];
const pins=async(root,paths,kind)=>Promise.all(paths.map(async path=>({kind,path,sha256:hash(await readFile(join(root,path)))})));
const topologyInputs=[...await pins(source,topologyPaths,'atlas'),...await pins(website,governancePaths,'website')];
const presentationInputs=[...await pins(source,presentationPaths,'atlas'),...await pins(website,websitePresentationPaths,'website')];
const {topologyHash,presentationHash,materialHash}=plexusFingerprints({study,topologyInputs,presentationInputs,assets:Object.entries(assets).map(([name,b])=>({name,sha256:hash(b)})),packages,checklistVersion:plexusChecklistVersion,checklists:plexusChecklists});
const context={catalogScope:'independent-schematic',candidateId:study.id,candidateName:'Original brachial plexus schematic — right',sourceCommit,frame:study.frame,partCount:35,connectionCount:38,clinicalApproved:false,learnerCatalogAdmission:false,materialHash,topologyHash,presentationHash,checklistVersion:plexusChecklistVersion,checklists:plexusChecklists,revisions:{topology:topologyHash,presentation:presentationHash}};
let html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Private original plexus schematic</title><link rel="stylesheet" href="./app.css"></head><body><div id="plexus-root"></div><script type="module" src="./app.js"></script></body></html>';
for(const name of ['app.js','app.css'])html=html.replace('./'+name,'./'+name+'?revision='+materialHash);
assets['index.html']=Buffer.from(html);
// Notice link must carry the same immutable material identity, even from the JS bundle.
// Delivery refuses unversioned assets; no rewrite at request time or mutable query default.
// The wrapper uses location.search only for this same-origin static notice link.
const manifest={schemaVersion:1,purpose:'private-original-plexus-schematic-review',admissions:0,clinicalValidation:false,patientDataIncluded:false,context,study,packages,topologyInputs,presentationInputs,
  files:Object.entries(assets).map(([name,b])=>({name,bytes:b.length,sha256:hash(b)}))};
const manifestText=JSON.stringify(manifest,null,2)+'\n';
const moduleText="import 'server-only';\n// Generated ONLY by import-plexus-review.mjs; ignored, authenticated delivery only.\nexport const plexusReviewAssets: Record<string,string> = "+JSON.stringify(Object.fromEntries(Object.entries(assets).map(([name,b])=>[name,b.toString('base64')])))+';\n';
if(process.argv.includes('--check')){
  assert.equal((await readFile('lib/plexus-review-manifest.json','utf8')).replaceAll('\r\n','\n'),manifestText,'Stale private schematic manifest');
  assert.equal(await readFile('.local/plexus-review/assets.ts','utf8'),moduleText,'Stale private schematic assets');
}else{
  await mkdir('.local/plexus-review',{recursive:true});await writeFile('.local/plexus-review/assets.ts',moduleText);await writeFile('lib/plexus-review-manifest.json',manifestText);
}
console.log(JSON.stringify({checked:process.argv.includes('--check'),sourceCommit,materialHash,topologyHash,presentationHash,parts:35,connections:38,packages:packages.length,bytes:manifest.files.reduce((n,f)=>n+f.bytes,0),admissions:0,private:true}));

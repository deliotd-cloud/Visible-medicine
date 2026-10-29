import {build} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import {build as bundle} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {candidateDigest,validateCandidate,candidateContentType} from '../lib/clinical-review-candidate.ts';
import {collectRenderedPackages,assertReviewedPackages} from './review-license-notices.mjs';

// Explicit local output only. This creates a package, never stages/deploys it,
// grants access, changes decisions or edits a model/scan/mask.
const root=process.cwd(),args=process.argv.slice(2);
if(args.length<5||args[0]!=='--output'||args[2]!=='--label')throw Error('Use --output ABSOLUTE-NEW-DIRECTORY --label LABEL STRUCTURE-ID [STRUCTURE-ID…]');
const output=path.resolve(args[1]),label=args[3],remaining=args.slice(4);
const personal=remaining[0]==='--review';if(personal)remaining.shift();
let supersedes=null;if(remaining[0]==='--supersedes'){remaining.shift();supersedes=remaining.shift();if(!personal||!/^[a-f0-9]{64}$/.test(supersedes??''))throw Error('A valid superseded candidate requires --review.');}
const ids=remaining;if(!ids.length||ids.some(id=>id.startsWith('--')))throw Error('Choose explicit root-body structure IDs.');
if(supersedes){
 const registry=JSON.parse(fs.readFileSync('lib/clinical-review-candidate-registry.json','utf8'));
 const previous=registry.filter(c=>c.id===supersedes);if(previous.length!==1)throw Error('Superseded candidate is not uniquely registered.');
 await validateCandidate(previous[0]);
 if(JSON.stringify(previous[0].selections.map(s=>s.structureId).sort())!==JSON.stringify([...ids].sort()))throw Error('Supersession must preserve exact structure scope.');
}
if(!path.isAbsolute(args[1])||output===root||output.startsWith(path.resolve(root,'public')+path.sep)||fs.existsSync(output)||!label||label.length>160||ids.length>32||new Set(ids).size!==ids.length)throw Error('Choose a new private local directory, bounded label and unique selections.');
const sha=b=>createHash('sha256').update(b).digest('hex');
const currentReview=JSON.parse(fs.readFileSync('atlas-review/manifest.json'));
const currentViewer=JSON.parse(fs.readFileSync('public/atlas-review-viewer/manifest.json'));
const inventory=JSON.parse(fs.readFileSync('lib/atlas-model-inventory.json'));
if(currentViewer.mode!=='production'||currentViewer.websiteIntegrationSha256!==currentReview.websiteIntegrationSha256||currentViewer.sourceCommit!==currentReview.revision)throw Error('Current normal Review must be coherent before freezing.');
const regular=p=>{const stat=fs.lstatSync(p);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Only regular source files may be packaged');return stat;};
function writeNew(p,bytes){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes,{flag:'wx'});}
const work=path.resolve(root,'.local','candidate-builds',randomUUID());fs.mkdirSync(work,{recursive:true});
const entry=await bundle({stdin:{contents:`export {bodyReviewMaterial} from './atlas-review/lib/body-review-material.ts';export {bodyReviewContext} from './atlas-review/lib/body-review-context.ts';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response.ts';`,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
const modulePath=path.join(work,'material.mjs');writeNew(modulePath,entry.outputFiles[0].contents);
const {bodyReviewMaterial,bodyReviewContext,parseBodyReviewResponse}=await import(pathToFileURL(modulePath));
const selections=[];
for(const id of ids){
 if(typeof id!=='string'||id.length>256)throw Error('Invalid selection');
 const material=await bodyReviewMaterial(id),context=await bodyReviewContext(id);
 if(!material||!context||!await parseBodyReviewResponse(material,id)||material.materialHash!==context.materialHash||!material.atlasLink)throw Error('Selection lacks verified source-bound worksheet/model');
 const link=new URL(material.atlasLink,'https://saved.invalid');
 const region=material.source.structure.region;
 if(link.pathname!==`/regions/${region}`||link.searchParams.get('study')!=='1'||link.searchParams.get('structure')!==id||link.searchParams.get('source')!==material.source.bundle.sha256)throw Error('Only exact root-body study links can be frozen by this version');
 const query=new URLSearchParams({kind:'body',region,...Object.fromEntries(link.searchParams)});
 selections.push({material,context,modelQuery:query.toString()});
}
let packages=[];
const sourceAdapter=path.resolve(root,'atlas-review/lib/model-delivery.ts');
const oldGuard="!/^\\/atlas-runtime\\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(assetBase)";
const candidateGuard="!/^\\/api\\/atlas-review\\/candidates\\/[a-f0-9]{64}\\/assets\\/models\\/head-neck$/.test(assetBase)";
const framework=path.resolve(root,'scripts/clinical-review-viewer/framework.tsx');
await build({configFile:false,root:path.resolve(root,'scripts/clinical-review-candidate'),base:'./',publicDir:false,
 resolve:{alias:{'@':root}},css:{postcss:{plugins:[tailwind({base:root})]}},
 plugins:[react(),{name:'frozen-review-transport',enforce:'pre',
  resolveId(id){if(['next/link','next/image','next/dynamic'].includes(id))return '\0frozen-'+id;},
  load(id){if(id.startsWith('\0frozen-next/'))return 'export { '+({link:'Link',image:'Image',dynamic:'dynamic'}[id.split('/').at(-1)])+' as default } from '+JSON.stringify(framework)+';';},
  transform(code,id){if(path.resolve(id.split('?')[0])!==sourceAdapter)return;
   if(code.split(oldGuard).length!==2)throw Error('Frozen transport source changed; review the adapter instead of guessing.');
   return {code:code.replace(oldGuard,candidateGuard),map:null};},
  generateBundle(_options,bundles){packages=collectRenderedPackages(bundles);}
 }],build:{outDir:path.join(work,'rendered'),emptyOutDir:false,sourcemap:false,minify:true,
  rollupOptions:{input:{worksheet:path.resolve(root,'scripts/clinical-review-candidate/index.html'),viewer:path.resolve(root,'scripts/clinical-review-candidate/viewer/index.html')}}},
 define:{'process.env.NODE_ENV':JSON.stringify('production')}});
assertReviewedPackages(packages,currentViewer.packages);
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.mkdirSync(output,{recursive:false});
const files=[],objects=path.join(output,'objects');
function include(relative,bytes,storage='candidate'){
 const type=candidateContentType(relative);if(!type)throw Error('Unsupported candidate asset type: '+relative);
 const digest=sha(bytes),target=path.join(objects,digest);
 if(fs.existsSync(target)){if(sha(fs.readFileSync(target))!==digest)throw Error('Existing object mismatch');}else writeNew(target,bytes);
 files.push({path:relative,sha256:digest,bytes:bytes.length,contentType:type,storage});
}
function tree(dir,prefix=''){for(const name of fs.readdirSync(dir).sort()){const p=path.join(dir,name),stat=fs.lstatSync(p);if(stat.isSymbolicLink())throw Error('Symlink in frozen output');if(stat.isDirectory())tree(p,prefix+name+'/');else{regular(p);include(prefix+name,fs.readFileSync(p));}}}
tree(path.join(work,'rendered'));
include('worksheet.json',Buffer.from(JSON.stringify({schema:personal?'visible-medicine.frozen-body-inspection/2':'visible-medicine.frozen-body-inspection/1',decisionMode:personal?'personal-review':'inspection-only',selections},null,2)+'\n'));
const noticeBytes=fs.readFileSync('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt');
if(sha(noticeBytes)!==currentViewer.files.find(f=>f.path==='THIRD_PARTY_NOTICES.txt')?.sha256)throw Error('Normal licence notices changed');
include('assets/THIRD_PARTY_NOTICES.txt',noticeBytes);
const modelsBase=path.join(root,'public/atlas-runtime/head-neck/models');
for(const name of fs.readdirSync(modelsBase,{recursive:true}).sort()){
 const from=path.join(modelsBase,name),stat=fs.lstatSync(from);if(stat.isDirectory())continue;regular(from);
 const relative='models/head-neck/models/'+name.replaceAll('\\','/'),bytes=fs.readFileSync(from);
 if(name.endsWith('.glb')){
  const original='/atlas-runtime/head-neck/models/'+name.replaceAll('\\','/');
  const matches=inventory.models.filter(m=>m.paths.includes(original));
  if(matches.length!==1||matches[0].sha256!==sha(bytes)||matches[0].bytes!==bytes.length)throw Error('Unregistered or changed model: '+name);
  include(relative,bytes,'atlas-model');
 }else include(relative,bytes);
}
files.sort((a,b)=>a.path.localeCompare(b.path));
const rendererFiles=files.filter(f=>f.storage==='candidate'&&f.path!=='worksheet.json'&&!f.path.startsWith('models/'));
const rendererRevision=sha(JSON.stringify(rendererFiles));
const material={schema:personal?'visible-medicine.clinical-review-candidate/2':'visible-medicine.clinical-review-candidate/1',kind:personal?'root-body-review':'root-body-inspection',label,createdAt:new Date().toISOString(),atlasRevision:currentReview.revision,reviewRevision:currentReview.websiteIntegrationSha256,rendererRevision,decisionMode:personal?'personal-review':'inspection-only',...(personal?{supersedes}:{}),
 selections:selections.map(({material:m,context:c})=>({structureId:m.structureId,structureName:m.source.structure.name,region:m.source.structure.region,materialHash:m.materialHash,sourceHash:m.fingerprints.source,teachingHash:m.fingerprints.teaching,...(personal?{review:{checklistVersion:c.checklistVersion,checklists:c.checklists,blockers:c.blockers,teachingTabs:c.teachingTabs}}:{})})),files};
const candidate=await validateCandidate({...material,id:await candidateDigest(material)});
writeNew(path.join(output,'candidate.json'),JSON.stringify(candidate,null,2)+'\n');
writeNew(path.join(output,'build-evidence.json'),JSON.stringify({candidate:candidate.id,packages:packages.map(({name,version,license})=>({name,version,license})),sourceAdapterSha256:sha(fs.readFileSync(sourceAdapter)),builderSha256:sha(fs.readFileSync(import.meta.filename)),normalReviewRevision:currentReview.websiteIntegrationSha256,transportAdapter:'exact source guard transformed at build time; generated modules not edited',decisionsIncluded:false,patientImagesIncluded:false,clinicalApproval:false,publicDeployment:false},null,2)+'\n');
console.log(JSON.stringify({candidate:candidate.id,output,selections:selections.length,files:files.length,packages:packages.length,decisionMode:candidate.decisionMode}));

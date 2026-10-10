// Test-only Git replay. Every application import comes from the named commit.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {relative,dirname,extname,resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
import {createGitObjectReader} from './git-object-reader.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function exactSourceHistoryApi(commit, profile='display', sourceOverrides={}){
 const exportsByProfile={
  'hepatobiliary-quiz':"export {hepatobiliaryQuizLesson} from './lib/hepatobiliary-quiz';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export * from './lib/body-review-material';export * from './lib/body-review-response';",
  'regional-tour-security':"export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-decisions';export * from './lib/body-review-api';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);",
  'nested-teaching':"export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching';",
  'nested-review-security':"export * from './content/nested-teaching';export * from './lib/nested-teaching';export * from './lib/nested-anatomy';export * from './lib/nested-review-material';export * from './lib/nested-review-client';export * from './lib/nested-review-api';export * from './lib/nested-review';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson,bodyContent} from './app/body-content';export {bodyReviewMaterial} from './lib/body-review-material';export {contentTabs} from './lib/content-types';export {regionalTours} from './lib/regional-tours';",
  'eye-layer-guide-review':"export * from './lib/nested-review-material';export * from './lib/nested-review';export * from './lib/nested-review-api';export * from './lib/nested-review-client';export {eyeLayerGuide} from './lib/eye-layer-guide';",
  'toe-bone-ultrasound':"export * from './lib/toe-bone-ultrasound';export * from './content/toe-bone-ultrasound';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
  'wrist-correction':"export * from './lib/wrist-imaging';export * from './content/wrist-imaging-concepts';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
  'wrist-initial':"export * from './lib/wrist-imaging';export {bodyLesson,bodyContent} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {bodyContentRecords} from './lib/content-export';",
  'hand-bone-ultrasound':"export * from './lib/hand-bone-ultrasound';export * from './content/hand-bone-ultrasound';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
  'suprascapular-ultrasound':"export * from './lib/suprascapular-vessel-ultrasound';export {bodyLesson,bodyContent} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
  display:"export {bodyLesson} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';",
  'display-content':"export {bodyLesson} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {bodyContentRecords} from './lib/content-export';",
  'display-review':"export {bodyLesson,bodyContent} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {bodyContentRecords} from './lib/content-export';export {bodyReviewMaterial} from './lib/body-review-material';export {regionalTours} from './lib/regional-tours';",
  'review-security':"export {bodyLesson,bodyContent} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {bodyContentRecords} from './lib/content-export';export {regionalTours} from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-api';export * from './lib/body-review-decisions';",
  curriculum:"export {bodyContent,bodyLesson} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';export {contentTabs} from './lib/content-types';",
  copy:"export {bodyContent} from './app/body-content';export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';",
 };
 assert(Object.hasOwn(exportsByProfile,profile),'Unknown exact-history export profile');
 assert(/^[a-f0-9]{40}$/.test(commit));
 const gitOptions={cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:16e6};
 assert.equal(execFileSync('git',['rev-parse',commit+'^{commit}'],gitOptions).trim(),commit);
 const sourcePaths=new Map();
 for(const entry of execFileSync('git',['ls-tree','-r','-z','--full-tree',commit],gitOptions).split('\0')){
  if(!entry)continue;
  const match=/^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(entry);
  if(match)sourcePaths.set(match[3],match[2]); // Never follow historical symlinks/submodules.
 }
 assert(sourceOverrides&&typeof sourceOverrides==='object'&&!Array.isArray(sourceOverrides));
 for(const [path,contents] of Object.entries(sourceOverrides)){
  assert(sourcePaths.has(path),'Override must name a historical application file');
  assert(typeof contents==='string'||Buffer.isBuffer(contents),'Override must contain Git-backed bytes');
 }
 const reader=createGitObjectReader({cwd:root});
 let compiled;
 try { compiled=await build({stdin:{contents:exportsByProfile[profile],resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-application-git-replay',setup(b){
 b.onResolve({filter:/.*/},args=>{
  // Keep explicitly allowed installed dependencies with the hermetic builder;
  // resolve application paths against Git, including old-only/renamed files.
  if(relative(root,args.resolveDir||root).replaceAll('\\','/').startsWith('node_modules/'))return;
  let target;
  if(args.path.startsWith('@/'))target=resolve(root,args.path.slice(2));
  else if(args.path.startsWith('.')||isAbsolute(args.path))target=resolve(args.resolveDir||root,args.path);
  else return;
  const path=relative(root,target).replaceAll('\\','/');
  assert(path!=='..'&&!path.startsWith('../')&&!isAbsolute(path),'Historical import outside checkout');
  for(const suffix of ['','.ts','.tsx','.mjs','.js','.json','/index.ts','/index.tsx'])
   if(sourcePaths.has(path+suffix))return {path:resolve(root,path+suffix),namespace:'workspace-test'};
  throw Error('Missing historical application module: '+path);
 });
 b.onLoad({filter:/.*/,namespace:'workspace-test'},async args=>{
  const path=relative(root,args.path).replaceAll('\\','/');if(path.startsWith('node_modules/'))return;
  assert(!path.startsWith('../'));
  const contents=Object.hasOwn(sourceOverrides,path)?sourceOverrides[path]:await reader.readBlob(sourcePaths.get(path));
  return {contents:contents.toString('utf8'),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
 });}}]});
 } finally { await reader.close(); }
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

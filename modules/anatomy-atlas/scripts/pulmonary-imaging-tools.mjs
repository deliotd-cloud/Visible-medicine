import {build} from './workspace-test-build.mjs';
import {execFileSync} from 'node:child_process';
import {relative,dirname,extname} from 'node:path';
import {createHash} from 'node:crypto';
export const pulmonaryImagingBase='d8967e7e033ecabc174c372738e687d05affaeef';
export const pulmonaryImagingTransition='430c9abbf66b14d9e485acdf2502ab33e42379a7';
export const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const pulmonaryImagingSource=(revision,path)=>execFileSync('git',['show',revision+':'+path],{maxBuffer:16e6});
export async function pulmonaryImagingApi({revision,saved=false}={}){
 revision ??= saved?pulmonaryImagingBase:undefined;
 const root=process.cwd();
 const compiled=await build({stdin:{contents:"export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching';export {nestedTeachingFor,nestedTopicLesson} from './lib/nested-teaching';export {nestedStudyTargets} from './lib/nested-anatomy';export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:revision?[{name:'saved-pulmonary-imaging-stage',setup(b){b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');if(path.startsWith('node_modules/'))return;
  if(path.startsWith('../'))throw Error('History input escaped checkout');
  return {contents:pulmonaryImagingSource(revision,path).toString('utf8'),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
 });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

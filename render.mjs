import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire,registerHooks} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [mode]=process.argv.slice(2);assert(['before','after'].includes(mode));
const own='G:/VisibleMedicine-temp/proposals/20261101-renal-learner-checks';
const root='G:/VisibleMedicine-temp/staging/20261101-hepatic-native-integration/atlas';
const overlay='G:/VisibleMedicine-temp/proposals/20261101-renal-venous-xray/source';
const changed=new Set(['content/renal-teaching.ts','content/renal-venous-xray.ts']);
const hash=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(root+'/package.json');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const inputs=new Map();
registerHooks({
 resolve(specifier,context,next){
  if(specifier.startsWith('@/')||specifier.startsWith('.')&&context.parentURL?.startsWith('file:')){
   const target=specifier.startsWith('@/')?path.join(root,specifier.slice(2)):fileURLToPath(new URL(specifier,context.parentURL));
   const relative=path.relative(root,target).replaceAll('\\','/');
   if(!relative.startsWith('../')&&!path.isAbsolute(relative)){
    for(const suffix of ['','.ts','.tsx','.json']){
     const rel=relative+suffix;
     if((mode==='after'&&changed.has(rel))||fs.existsSync(path.join(root,rel))&&fs.statSync(path.join(root,rel)).isFile())
      return {url:pathToFileURL(path.join(root,rel)).href,shortCircuit:true};
    }
   }
  }
  return next(specifier,context);
 },
 load(url,context,next){
  if(url.startsWith('file:')){
   const relative=path.relative(root,fileURLToPath(url)).replaceAll('\\','/');
   if(!relative.startsWith('../')&&!path.isAbsolute(relative)&&!relative.startsWith('node_modules/')){
    const replaced=mode==='after'&&changed.has(relative),location=path.join(replaced?overlay:root,relative);
    const bytes=fs.readFileSync(location);inputs.set(relative,{path:relative,location,sha256:hash(bytes),origin:replaced?'overlay':'native'});
    if(relative.endsWith('.css'))return {format:'module',source:'export {};',shortCircuit:true};
    if(relative.endsWith('.json'))return {format:'module',source:'export default JSON.parse('+JSON.stringify(bytes.toString('utf8'))+');',shortCircuit:true};
    if(relative.endsWith('.tsx')){
     const result=ts.transpileModule(bytes.toString('utf8'),{fileName:location,reportDiagnostics:true,
      compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
     assert.deepEqual(result.diagnostics,[],'Component syntax errors');
     return {format:'module',source:result.outputText,shortCircuit:true};
    }
    if(replaced)return {format:'module-typescript',source:bytes.toString('utf8'),shortCircuit:true};
   }
  }
  return next(url,context);
 }
});
const {NestedTeaching}=await import(pathToFileURL(root+'/app/nested-teaching.tsx'));
const {nestedTeachingFor,nestedTopicLesson}=await import(pathToFileURL(root+'/lib/nested-teaching.ts'));
const pins=JSON.parse(fs.readFileSync(root+'/content/nested-teaching-bindings.v1.json'));
const chosen=pins.bindings.filter(b=>['renal-veins','renal-suprarenal-veins','renal-inferior-suprarenal-artery'].includes(b.conceptId));
const rendered=[];
for(const binding of chosen){
 const parent=pins.parents.find(p=>p.id===binding.parentId),props={parent,study:binding.study,selected:binding.structure,initialTopic:'xray'};
 const lesson=nestedTopicLesson(nestedTeachingFor(parent,binding.study,binding.structure),'xray');
 const html=renderToStaticMarkup(React.createElement(NestedTeaching,props));
 const ordinary=renderToStaticMarkup(React.createElement(NestedTeaching,{...props,initialTopic:undefined}));
 const forged=renderToStaticMarkup(React.createElement(NestedTeaching,{...props,selected:{...binding.structure,fmaId:'FMA000000'}}));
 const privateHidden=renderToStaticMarkup(React.createElement(NestedTeaching,{...props,reviewAvailable:false}));
 rendered.push({id:binding.structure.id,conceptId:binding.conceptId,html,ordinary,forged,privateHidden,lesson});
}
for(const row of inputs.values())assert.equal(hash(fs.readFileSync(row.location)),row.sha256);
const result={mode,sourceMode:'actual-component-and-installed-React-SSR',browserRendering:false,stylesEvaluated:false,fullTypes:false,
 rendererSha256:hash(fs.readFileSync(fileURLToPath(import.meta.url))),packageLockSha256:hash(fs.readFileSync(root+'/package-lock.json')),
 inputs:[...inputs.values()].sort((a,b)=>a.path.localeCompare(b.path)),rendered};
fs.mkdirSync(own+'/evidence',{recursive:true});
fs.writeFileSync(own+'/evidence/'+mode+'.json',JSON.stringify(result)+'\n',{flag:'wx'});
console.log(JSON.stringify({mode,renderedSelections:rendered.length,projectInputs:inputs.size,browser:false}));

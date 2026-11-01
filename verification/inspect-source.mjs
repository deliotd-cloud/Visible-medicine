import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
const [mode,out]=process.argv.slice(2);assert(['before','after'].includes(mode));assert(out);
const native='G:/VisibleMedicine-temp/staging/20261101-regional-teaching-types/atlas';
const overlay='G:/VisibleMedicine-temp/proposals/20261101-hepatic-vascular-xray/source';
const replacements=new Set(['content/nested-teaching.ts','content/hepatic-teaching.ts','content/hepatic-vascular-xray.ts']);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs=new Map();
registerHooks({
  resolve(specifier,context,next){
    if(specifier.startsWith('.') && context.parentURL?.startsWith('file:')){
      const absolute=fileURLToPath(new URL(specifier,context.parentURL));
      const relative=path.relative(native,absolute).replaceAll('\\','/');
      if(mode==='after' && replacements.has(relative+'.ts'))return {url:pathToFileURL(absolute+'.ts').href,shortCircuit:true};
      if(!path.extname(absolute)&&fs.existsSync(absolute+'.ts'))return next(specifier+'.ts',context);
    }
    return next(specifier,context);
  },
  load(url,context,next){
    if(url.startsWith('file:')){
      const relative=path.relative(native,fileURLToPath(url)).replaceAll('\\','/');
      if(!relative.startsWith('../')&&!path.isAbsolute(relative)){
        const replaced=mode==='after'&&replacements.has(relative);
        const location=path.join(replaced?overlay:native,relative),bytes=fs.readFileSync(location);
        inputs.set(relative,{path:relative,origin:replaced?'overlay':'native',sha256:hash(bytes),location});
        if(replaced)return {format:'module-typescript',source:bytes.toString('utf8'),shortCircuit:true};
      }
    }
    return next(url,context);
  },
});
const {nestedConcepts,nestedTeachingReferences}=await import(pathToFileURL(native+'/content/nested-teaching.ts'));
const {nestedTeachingFor,nestedTopicLesson}=await import(pathToFileURL(native+'/lib/nested-teaching.ts'));
const topics=['anatomy','function','clinical','pathology','ct','mri','xray','ultrasound','quiz'];
const conceptLessons=nestedConcepts.map(c=>({id:c.id,lessons:Object.fromEntries(topics.map(t=>[t,nestedTopicLesson(c,t)]))}));
const pins=JSON.parse(fs.readFileSync(native+'/content/nested-teaching-bindings.v1.json'));
const bindings=pins.bindings.filter(b=>['hepatic-arterial','hepatic-portal'].includes(b.conceptId));
assert.equal(bindings.length,4);
const actual=bindings.map(binding=>{
  const parent=pins.parents.find(p=>p.id===binding.parentId),child=binding.structure;
  const concept=nestedTeachingFor(parent,binding.study,child);assert(concept);
  assert.equal(nestedTeachingFor(parent,binding.study,{...child,laterality:'unspecified'}),null);
  assert.equal(nestedTeachingFor({...parent,name:parent.name+' changed'},binding.study,child),null);
  assert.equal(nestedTeachingFor(parent,binding.study,{...child,fmaId:'FMA000000'}),null);
  return {parentId:parent.id,id:child.id,fmaId:child.fmaId,conceptId:concept.id,lesson:nestedTopicLesson(concept,'xray')};
});
for(const row of inputs.values())assert.equal(hash(fs.readFileSync(row.location)),row.sha256,'Source changed during inspection');
fs.writeFileSync(out,JSON.stringify({mode,inputs:[...inputs.values()].sort((a,b)=>a.path.localeCompare(b.path)),nestedConcepts,nestedTeachingReferences,conceptLessons,actual,mutationsRejected:12})+'\n',{flag:'wx'});
console.log(JSON.stringify({mode,concepts:nestedConcepts.length,placements:conceptLessons.length*topics.length,exactSourceSelections:actual.length,mutationsRejected:12}));

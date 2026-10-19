import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {headTourStudyAdditions} from '../lib/head-tour-study-set.ts';
import type {HeadStudySet} from '../lib/head-study-set.ts';

const revision=HEAD_MANIFEST_SHA256;
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function entry(id:string,label:string,index:number):HeadEntry{
  return {id,label:`${label} — regional mask`,family:'synthetic',laterality:'midline_or_unpaired',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1},
    mask:{file:`${index}.bin`,sha256:index.toString(16).padStart(64,'0'),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:affine}};
}
function study(entries:HeadEntry[]):LoadedStudy{return {definition:{entries}} as LoadedStudy;}
const midbrain=entry('cth.bst.midbrain','Midbrain',1),pons=entry('cth.bst.pons','Pons',2),medulla=entry('cth.bst.medulla_oblongata','Medulla oblongata',3);

test('new exact tour masks follow canonical steps, dedupe the set, and respect remaining capacity',()=>{
  const extras=Array.from({length:49},(_,i)=>entry(`local.${i}`,`Other ${i}`,i+10));
  const active=study([medulla,pons,midbrain,...extras]);
  const previous:HeadStudySet={study:active,revision,entries:[pons,...extras.slice(0,48)]};
  assert.deepEqual(headTourStudyAdditions(previous,active,revision,'CT','brainstem'),{entries:[midbrain,medulla],targets:[midbrain]});
  assert.deepEqual(previous.entries,[pons,...extras.slice(0,48)],'existing selection is unchanged');
  assert.deepEqual(headTourStudyAdditions(null,active,revision,'CT','brainstem'),{entries:[midbrain,pons,medulla],targets:[midbrain,pons,medulla]});
  assert.deepEqual(headTourStudyAdditions({...previous,entries:[...previous.entries,extras[48]]},active,revision,'CT','brainstem').targets,[]);
});

test('points, shared geometry, replaced identities and absent slots never enter additions',()=>{
  const point={...midbrain,mask:undefined,points_ras_mm:[[0,0,0]]};
  const alias={...pons,source:{geometry_alias_of:'other'}};
  const replaced={...medulla,label:'Wrong source identity'};
  const active=study([point,alias,replaced]);
  assert.deepEqual(headTourStudyAdditions(null,active,revision,'CT','brainstem'),{entries:[],targets:[]});
  const repeated={...pons,mask:{...pons.mask!,file:'copy.bin'}};
  assert.deepEqual(headTourStudyAdditions(null,study([pons,repeated]),revision,'CT','brainstem').entries,[]);
  const distinct={...pons,mask:{...pons.mask!,file:'other.bin',sha256:'f'.repeat(64)}};
  assert.deepEqual(headTourStudyAdditions(null,study([pons,distinct]),revision,'CT','brainstem').entries,[],
    'two saved masks claiming one source concept remain ambiguous even with different bytes');
});

test('invalid context fails closed',()=>{
  const active=study([midbrain,pons,medulla]);
  for(const [input,rev,modality,sequence] of [
    [null,revision,'CT','brainstem'],[active,'stale','CT','brainstem'],[active,revision,'PET','brainstem'],[active,revision,'CT','unknown'],
  ] as const)assert.deepEqual(headTourStudyAdditions(null,input,rev,modality as 'CT',sequence),{entries:[],targets:[]});
  assert.deepEqual(headTourStudyAdditions(null,active,revision,'MRI','brainstem'),{entries:[],targets:[]});
});

type Element={type:unknown;props:Record<string,unknown>};
const jsx=(type:unknown,props:Record<string,unknown>):Element=>({type,props});
function nodes(value:unknown):Element[]{
  if(Array.isArray(value))return value.flatMap(nodes);
  if(!value||typeof value!=='object'||!('type' in value))return [];
  const node=value as Element;return [node,...nodes(node.props.children)];
}
function content(value:unknown):string{
  if(Array.isArray(value))return value.map(content).join('');
  if(value&&typeof value==='object'&&'props' in value)return content((value as Element).props.children);
  return value==null?'':String(value);
}
const source=readFileSync(new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const require=createRequire(import.meta.url);
function component(add?:{count:number;total:number;onAdd:()=>void}){
  const mod={exports:{} as Record<string,(props:Record<string,unknown>)=>Element>};
  const layout:Array<()=>void>=[];
  new Function('require','module','exports',compiled)((id:string)=>{
    if(id==='react')return {useEffect:()=>{},useLayoutEffect:(create:()=>void)=>layout.push(create),useRef:(initial:unknown)=>({current:initial}),useState:()=>['locate',()=>{}]};
    if(id==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:Symbol('Fragment')};
    if(id==='next/link'||id==='./HeadAtlasTeaching'||id==='./HeadLearningBookmark')return id==='next/link'?{__esModule:true,default:()=>null}:{HeadAtlasTeaching:()=>null,HeadLearningBookmark:()=>null};
    if(id==='./HeadAtlasConceptTeaching')return {HeadAtlasConceptTeaching:()=>null};
    return require(id.startsWith('../lib/')&&!id.endsWith('.ts')?`${id}.ts`:id);
  },mod,mod.exports);
  const tree=mod.exports.HeadAtlasGuidedLearning({study:study([midbrain]),modality:'CT',position:{sequenceId:'brainstem',conceptId:null},
    onPositionChange:()=>{},onSelect:()=>{},onPractice:()=>{},studySetAdd:add});
  layout.forEach(commit=>commit());return tree;
}

test('optional action stays in collapsed Sequence steps and click only calls add',()=>{
  let calls=0;
  const tree=component({count:1,total:2,onAdd:()=>{calls++;}});
  const details=nodes(tree).find(node=>node.type==='details'&&node.props.className==='head-practice-help head-sequence-steps');
  assert(details);assert.equal(details.props.open,undefined);
  const button=nodes(details).find(node=>node.type==='button'&&content(node)==='Add tour to study set (1)');
  assert(button);assert.equal(button.props.disabled,false);
  (button.props.onClick as ()=>void)();assert.equal(calls,1);
  assert.match(content(details),/1 of 2 new masks fit/);
  assert.match(content(details),/Existing study set entries stay in place/);
  assert.equal(nodes(component()).filter(node=>node.type==='button'&&content(node).startsWith('Add tour')).length,0);
  const none=nodes(component({count:0,total:0,onAdd:()=>{calls++;}})).find(node=>node.type==='button'&&content(node)==='Add tour to study set (0)');
  assert(none);assert.equal(none.props.disabled,true);(none.props.onClick as ()=>void)();assert.equal(calls,1);
});

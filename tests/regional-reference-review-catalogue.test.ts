import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as contract from '../lib/regional-reference-review-index-contract.ts';

const require = createRequire(import.meta.url);
type Node = {type: any; props: Record<string, any>};
const nodes = (value: any): Node[] => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' && 'type' in value && 'props' in value ? [value, ...nodes(value.props.children)] : [];
const words = (value: any): string => Array.isArray(value) ? value.map(words).join('') : value && typeof value === 'object' && 'props' in value ? words(value.props.children) : typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const atlasRevision = 'a'.repeat(40), mappingRevision = 'b'.repeat(64), teachingRevision = 'c'.repeat(64);
const makeRow = (n: number, relation: contract.RegionalReferenceReviewRow['relation'] = 'same-structure') => {
  const id = `vm:reference:item-${n}`;
  const request = {target:id, relation, atlasRevision, mappingRevision, teachingRevision};
  return {key:JSON.stringify([id,relation]),id,label:`Reference ${n}`,kind:n % 2 ? 'body' as const : 'specimen' as const,
    side:n % 4 ? 'left' as const : 'right' as const,relation,teachingRevision,
    href:'/workspace/atlas-review/reference-learning?'+new URLSearchParams(request),
    draftTopics:n === 3 ? 7 : 8,pendingTopics:n === 3 ? 1 : 0,identityTopics:0};
};
const makeIndex = (rows = Array.from({length:15},(_,i)=>makeRow(i+1,i === 2 ? 'parent-reference' : i === 3 ? 'group-reference' : 'same-structure'))) =>
  ({schema:'vm-regional-reference-teaching-index-1' as const,atlasRevision,mappingRevision,rows,approval:false as const});
const copy = <T>(value:T):T => JSON.parse(JSON.stringify(value)) as T;

function harness() {
  const source = readFileSync(new URL('../components/RegionalReferenceReviewCatalogue.tsx',import.meta.url),'utf8');
  const compiled = ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const slots:any[] = [];
  let cursor = 0, focuses = 0, fetches = 0, histories = 0;
  const hooks = {useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(value:any)=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useRef(){const i=cursor++;if(!(i in slots))slots[i]={current:{focus(){focuses++;}}};return slots[i];}};
  const jsx = (type:any,props:any) => ({type,props});
  const mod = {exports:{} as {RegionalReferenceReviewCatalogue:(props:{index:unknown})=>Node}};
  const load = (id:string) => id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('Fragment')}:id==='../lib/regional-reference-review-index-contract'?contract:id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports','fetch','history',compiled)(load,mod,mod.exports,()=>{fetches++;throw new Error('no fetch');},{pushState(){histories++;throw new Error('no history');}});
  const render = (index:unknown) => {cursor=0;return mod.exports.RegionalReferenceReviewCatalogue({index});};
  const listRows = (tree:Node) => nodes(tree).filter(n=>n.type==='li');
  const links = (tree:Node) => nodes(tree).filter(n=>n.type==='a');
  const click = (tree:Node,label:string) => {const button=nodes(tree).find(n=>n.type==='button'&&words(n)===label);assert(button,`button ${label}`);assert(!button.props.disabled);button.props.onClick();};
  const field = (tree:Node,type:string,label:string) => {const control=nodes(tree).find(n=>n.type==='label'&&words(n).startsWith(label));assert(control,`label ${label}`);const input=nodes(control).find(n=>n.type===type);assert(input);return input;};
  const change = (tree:Node,type:string,label:string,value:string) => field(tree,type,label).props.onChange({target:{value}});
  return {render,listRows,links,click,field,change,get focuses(){return focuses;},get fetches(){return fetches;},get histories(){return histories;}};
}

test('compact 12-row source list uses exact same-page draft anchors and honest counts',()=>{
  const h=harness(), index=makeIndex(), tree=h.render(index), rows=h.listRows(tree);
  assert.equal(rows.length,12);
  assert.deepEqual(h.links(tree).map(link=>link.props.href),index.rows.slice(0,12).map(row=>row.href));
  assert(h.links(tree).every(link=>link.props.target===undefined&&link.props.onClick===undefined));
  assert.equal(h.links(tree)[2].props['aria-label'],'Open Reference 3, left, Whole parent teaching draft');
  assert.equal(h.field(tree,'input','Search references').props.maxLength,160);
  assert.match(words(tree),/15 reference draft packets in this source/);
  assert.match(words(tree),/not a count of MRI annotations, approved items, completed teaching, or saved notes/);
  assert.match(words(tree),/Source side may differ from an MRI selection/);
  assert.match(words(tree),/not mirrored, registered to a scan/);
  assert.match(words(rows[2]),/Whole parent/);
  assert.match(words(rows[2]),/1 topic pending/);
  assert.match(words(rows[3]),/Grouped reference/);
  assert(!words(rows[0]).includes('pending'));
  assert.equal(nodes(tree).filter(n=>n.type==='details').length,1);
  assert.equal(h.fetches,0);assert.equal(h.histories,0);
});

test('paging, multiword search, combined filters, no-match state and reset',()=>{
  const h=harness(), index=makeIndex();let tree=h.render(index);
  h.click(tree,'Next');tree=h.render(index);assert.equal(h.listRows(tree).length,3);assert.match(words(tree),/Page 2 of 2/);
  h.change(tree,'input','Search references','SPECIMEN RIGHT grouped');tree=h.render(index);
  assert.equal(h.listRows(tree).length,1);assert.match(words(h.listRows(tree)[0]),/Reference 4/);assert(!words(tree).includes('Page 2 of 2'));
  h.change(tree,'select','Source','specimen');tree=h.render(index);
  h.change(tree,'select','Side','right');tree=h.render(index);
  h.change(tree,'select','Reference relationship','group-reference');tree=h.render(index);
  assert.equal(h.listRows(tree).length,1);
  h.change(tree,'select','Side','left');tree=h.render(index);assert.equal(h.listRows(tree).length,0);
  assert.match(words(tree),/No reference draft packets match these filters/);
  h.click(tree,'Reset filters');tree=h.render(index);
  assert.equal(h.listRows(tree).length,12);assert.equal(h.focuses,1);
  assert.equal(h.field(tree,'input','Search references').props.value,'');
  assert.equal(h.field(tree,'select','Source').props.value,'all');
  assert.equal(h.field(tree,'select','Side').props.value,'all');
  assert.equal(h.field(tree,'select','Reference relationship').props.value,'all');
  h.change(tree,'input','Search references','item-15');tree=h.render(index);
  assert.equal(h.listRows(tree).length,1);assert.match(words(tree),/Reference 15/);
});

test('replacement source resets old page and filters and exposes only new exact URLs',()=>{
  const h=harness(), first=makeIndex();let tree=h.render(first);
  h.click(tree,'Next');tree=h.render(first);assert.match(words(tree),/Page 2 of 2/);
  h.change(tree,'input','Search references','Reference 14');assert.equal(h.listRows(h.render(first)).length,1);
  const second=makeIndex([makeRow(21,'parent-reference')]);tree=h.render(second);
  assert.equal(h.field(tree,'input','Search references').props.value,'');
  assert.deepEqual(h.links(tree).map(link=>link.props.href),[second.rows[0].href]);
  assert.match(words(tree),/1 matching reference draft packet/);
  assert(!words(tree).includes('Page 2'));
});

test('invalid, unsafe and duplicate projections refuse all links without fallback',()=>{
  const h=harness(), valid=makeIndex();
  const mutations=[
    (v:any)=>{v.rows[0].href='https://elsewhere.invalid/draft';},
    (v:any)=>{v.rows[0].href='javascript:alert(1)';},
    (v:any)=>{v.rows[1].href=v.rows[0].href;},
    (v:any)=>{v.rows[1]=copy(v.rows[0]);},
    (v:any)=>{v.rows[0].pendingTopics=2;},
    (v:any)=>{v.approval=true;},
  ];
  for(const mutate of mutations){const bad=copy(valid);mutate(bad);const tree=h.render(bad);assert.equal(contract.parseRegionalReferenceReviewIndex(bad),null);assert.equal(h.links(tree).length,0);assert.match(words(tree),/source index is invalid/);}
  const empty=h.render(makeIndex([]));assert.equal(h.links(empty).length,0);assert.match(words(empty),/No reference draft packets are available/);
  assert.equal(h.fetches,0);assert.equal(h.histories,0);
});

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {atlasStudySuffix} from '../lib/atlas-study-transport.ts';
import {atlasBodyRegions, selectedBodyRegion} from '../lib/atlas-navigation.ts';
import ts from 'typescript';
import {createRequire} from 'node:module';

test('whole-body continuation relays exact study identity without external routing or unrelated fields',()=>{
  const p={study:'1',structure:'vm:anatomy:body:spine:right:muscle:right-longus-capitis',side:'right',source:'a'.repeat(64)};
  const suffix=atlasStudySuffix({...p,patientId:'private',token:'secret',redirect:'https://example.test',region:'whole-body'});
  assert.ok(suffix);assert.deepEqual(Object.fromEntries(new URLSearchParams(suffix.slice(1))),p);
  assert.equal(atlasStudySuffix({}), '');assert.equal(atlasStudySuffix({unknown:'ignored'}),'');
  for(const key of Object.keys(p)){
    assert.equal(atlasStudySuffix({...p,[key]:[p[key as keyof typeof p],p[key as keyof typeof p]]}),null);
    assert.equal(atlasStudySuffix({...p,[key]:'<script>&region=foot'}),null);
  }
  for(const patch of [{source:'a'.repeat(63)},{structure:'x'.repeat(241)},{study:'3'},{side:'either'},{focus:'../escape'},{detail:'x'.repeat(300)}]){
    assert.equal(atlasStudySuffix({...p,...patch}),null);
  }
  const nested={...p,study:'2',detail:'eye',part:'test:part',partSource:'b'.repeat(64)};
  assert.deepEqual(Object.fromEntries(new URLSearchParams(atlasStudySuffix(nested)!.slice(1))),nested);
  assert.equal(atlasStudySuffix({structure:'valid-id'}),'&structure=valid-id','Partial query retained for module rejection, never silently dropped');
  const page=readFileSync(new URL('../app/atlas/3d/page.tsx',import.meta.url),'utf8');
  assert.ok(page.includes('const studySuffix=atlasStudySuffix(params)'));
  assert.ok(page.includes('if(studySuffix===null)notFound()'));
  assert.ok(page.includes('region=${region.id}${studySuffix}'));
  assert.ok(page.includes('src={source}'));
  assert.ok(page.includes("if(!studySuffix&&!region.href.startsWith('/atlas/3d'))redirect(region.href)"),
    'Source-bound head/neck, trunk and pelvic links must not lose the query through a plain regional redirect');
});

test('actual host page keeps source-bound links for all twelve regions and keeps plain redirects',async()=>{
  const require=createRequire(import.meta.url);
  const source=ts.transpileModule(readFileSync(new URL('../app/atlas/3d/page.tsx',import.meta.url),'utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports:Record<string, (props:unknown)=>Promise<unknown>>={};
  const imports:Record<string,unknown>={
    'next/link':()=>null,
    'next/navigation':{notFound:()=>{throw Error('not-found');},redirect:(href:string)=>{throw Error('redirect:'+href);}},
    '../../../components/AtlasRegionNavigation':{AtlasRegionNavigation:()=>null},
    '../../../lib/atlas-navigation':{selectedBodyRegion},
    '../../../lib/atlas-study-transport':{atlasStudySuffix},
    '../shoulder-3d/shoulder-module.css':{},
    'react/jsx-runtime':require('react/jsx-runtime'),
  };
  new Function('require','exports',source)((name:string)=>{assert(Object.hasOwn(imports,name),name);return imports[name];},exports);
  const params={study:'1',structure:'test:source',source:'a'.repeat(64),side:'right'};
  function elements(node:unknown):Array<{type:unknown;props:Record<string,unknown>}>{
    if(Array.isArray(node))return node.flatMap(elements);
    if(!node||typeof node!=='object'||!('props' in node))return [];
    const element=node as {type:unknown;props:Record<string,unknown>};
    return [element,...elements(element.props.children)];
  }
  for(const region of atlasBodyRegions){
    const tree=await exports.default({searchParams:Promise.resolve({...params,region:region.id})});
    const nodes=elements(tree),frame=nodes.find(n=>n.type==='iframe');assert(frame);
    const url=new URL(String(frame.props.src),'https://atlas.test');
    assert.equal(url.searchParams.get('region'),region.id);
    for(const [key,value]of Object.entries(params))assert.equal(url.searchParams.get(key),value);
    assert.equal(nodes.find(n=>n.type==='h1')?.props.children,region.label);
    if(!region.href.startsWith('/atlas/3d')){
      await assert.rejects(exports.default({searchParams:Promise.resolve({region:region.id})}),
        (error:Error)=>error.message==='redirect:'+region.href);
    }
  }
  await assert.rejects(exports.default({searchParams:Promise.resolve({...params,source:['a','b']})}),/not-found/);
});

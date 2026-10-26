import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {restorePreCanonicalNavigation} from './canonical-navigation-source-inverse.mjs';

const proposal=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const website=process.env.VM_WEBSITE_ROOT||'F:/VisibleMedicine/website';
const require=createRequire(path.join(website,'package.json'));
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {build}=require('esbuild');
const manifest=JSON.parse(readFileSync(path.join(website,'public/atlas-runtime/head-neck/manifest.json'),'utf8'));
const catalog=JSON.parse(readFileSync(path.join(website,'lib/lecture-body-catalog.json'),'utf8'));
const source='/atlas-runtime/head-neck/index.html?region=whole-body&study=1';
const original=readFileSync(path.join(proposal,'tests/fixtures/atlas-body-learning-installed.tsx.raw'),'utf8').replaceAll('\r\n','\n');
const candidate=restorePreCanonicalNavigation(readFileSync(path.join(proposal,'components/AtlasBodyLearning.tsx'),'utf8'));
const css=readFileSync(path.join(proposal,'components/atlas-body-learning.css'),'utf8');

test('all source, frame, session and actionable-click gates remain exact',()=>{
  const gateEnd='  return <details className=';
  assert.equal(candidate.slice(0,candidate.indexOf(gateEnd)),original.slice(0,original.indexOf(gateEnd)));
  const click=text=>text.slice(text.indexOf('onClick={event=>{'),text.indexOf('}}>Related teaching ↗</a>'));
  assert.equal(click(candidate),click(original));
  assert.match(candidate,/target="_blank" rel="noopener noreferrer"/);
});

test('the actual component renders a selected root link and nested source/access disclosure',async()=>{
  const built=await build({entryPoints:[path.join(proposal,'components/AtlasBodyLearning.tsx')],bundle:true,write:false,
    format:'cjs',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'current-source',setup(build){
      build.onResolve({filter:/^\.\.\/lib\/(atlas-body-learning-selection|lecture-body-related-links)$/},args=>({path:path.join(website,'lib',args.path.split('/').at(-1)+'.ts')}));
    }}]});
  assert.equal(built.errors.length,0);
  const row=catalog.rows[0],region=catalog.regions[row[4]][0],side=row[5],bundle=catalog.bundles[row[6]];
  const reference={kind:'body-structure-v1',structureId:row[0],region,side,sourceSha256:bundle,
    atlasRevision:catalog.sourceCommit,atlasTarget:'/atlas/3d?'+new URLSearchParams({region,
      atlasRevision:catalog.sourceCommit,study:'1',structure:row[0],side,source:bundle})};
  const snapshot={identity:JSON.stringify([source,manifest.sourceCommit,'whole-body']),
    value:{sequence:1,status:'selected',reference,label:row[1]}};
  const hooks={...React,useMemo:fn=>fn(),useRef:initial=>({current:initial}),useState:()=>[snapshot,()=>{}],
    useLayoutEffect:()=>{},useEffect:()=>{}};
  const module={exports:{}};
  new Function('require','module','exports',built.outputFiles[0].text)(id=>id==='react'?hooks:require(id),module,module.exports);
  const tree=module.exports.AtlasBodyLearning({frame:{current:null},src:source});
  const html=renderToStaticMarkup(tree);
  assert.match(html,/data-learning-state="selected"/);
  assert.match(html,/<summary>Lectures · /);
  assert.match(html,/class="atlas-body-learning-action"/);
  assert.match(html,/href="\/learn\/related-structure\?/);
  assert.match(html,/<details class="atlas-body-learning-source"><summary>Source &amp; access<\/summary>/);
  for(const phrase of ['Only accessible published lectures appear','Atlas access does not unlock paid lectures',
    'Separate specimens and nested parts are not inherited','No CT/MRI match or patient-space registration is inferred'])
    assert(html.includes(phrase),phrase);
});

test('reserved frame row remains 36px closed and never floats over the iframe when open',()=>{
  assert.match(css,/--atlas-learning-row:36px/);
  assert.match(css,/--atlas-learning-row:96px/);
  assert.match(css,/--atlas-learning-row:128px/);
  assert.match(css,/--atlas-learning-row:168px/);
  assert.match(css,/--atlas-learning-row:224px/);
  assert.match(css,/:has\(>\.atlas-body-learning\[open\]>\.atlas-body-learning-source\[open\]\)/);
  assert.match(css,/height:calc\(100% - var\(--atlas-learning-row\)\)/);
  assert.match(css,/\.atlas-runtime-frame>\.atlas-body-learning\{position:absolute[^}]*bottom:0;left:0;right:0;width:100%;height:var\(--atlas-learning-row\)/);
  assert.match(css,/min-height:calc\(280px \+ var\(--atlas-learning-row\)\)/);
  assert.match(css,/overflow-x:hidden/);
  assert(!css.includes('.atlas-3d-workspace-page'),'Standalone frames must reserve the same row without an outer page class');
});

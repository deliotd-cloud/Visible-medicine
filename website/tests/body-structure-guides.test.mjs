import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const proposal=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const website=process.env.VM_WEBSITE_ROOT??proposal;
const requireWebsite=createRequire(resolve(website,'package.json'));
const esbuild=requireWebsite('esbuild');
const source=path=>resolve(existsSync(resolve(proposal,path))?proposal:website,path);
async function load(catalogueMutation){
  const entry=`export {bodyStructureGuides} from ${JSON.stringify(source('lib/body-structure-guides.ts').replaceAll('\\','/'))};
    export {createLectureBodyReference,resolveLectureBodyReference} from ${JSON.stringify(source('lib/lecture-body-reference.ts').replaceAll('\\','/'))};
    export {regionalLearningCatalogue} from ${JSON.stringify(source('lib/regional-learning-catalogue.ts').replaceAll('\\','/'))};
    export {regionalTours} from ${JSON.stringify(source('atlas-review/lib/regional-tours.ts').replaceAll('\\','/'))};
    export {regionalTourEntrySuffix} from ${JSON.stringify(source('lib/regional-tour-entry-navigation.ts').replaceAll('\\','/'))};`;
  const result=await esbuild.build({stdin:{contents:entry,resolveDir:website},bundle:true,platform:'node',format:'cjs',target:'node22',write:false,
    plugins:[{name:'proposal-fallback',setup(build){
      build.onResolve({filter:/^\.\.?\//},args=>{
        const target=resolve(args.resolveDir,args.path);
        if(catalogueMutation&&args.importer===source('lib/body-structure-guides.ts')&&args.path==='./regional-learning-catalogue')return {path:'mutated',namespace:'catalogue'};
        if(target.startsWith(proposal)&&!existsSync(target)){
          const fallback=resolve(website,target.slice(proposal.length+1));
          if(existsSync(fallback)||existsSync(fallback+'.ts'))return {path:existsSync(fallback)?fallback:fallback+'.ts'};
        }
        return null;
      });
      build.onLoad({filter:/.*/,namespace:'catalogue'},()=>({contents:`import {regionalLearningCatalogue as real} from ${JSON.stringify(source('lib/regional-learning-catalogue.ts').replaceAll('\\','/'))}; export function regionalLearningCatalogue(){const value=real();return ${catalogueMutation==='unavailable'?'({...value,available:false})':'({...value,sourceRevision:"a".repeat(40)})'};}`,loader:'ts',resolveDir:website}));
    }}]});
  const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(requireWebsite,mod,mod.exports);return mod.exports;
}
const api=await load();

test('real authored stops link to the exact canonical entry; whole-body launch stays whole-body',()=>{
  const admitted=api.regionalLearningCatalogue();assert.equal(admitted.available,true);
  let checked=0,wholeBody=0;
  const guidesById=new Map();
  for(const tour of admitted.tours){
    const authored=api.regionalTours.find(item=>item.id===tour.id);assert(authored);
    assert.equal(authored.steps.length,tour.steps.length);
    for(const stop of authored.steps){
      const ref=api.createLectureBodyReference(stop.selectedId);if(!ref)continue;
      if(!guidesById.has(stop.selectedId))guidesById.set(stop.selectedId,api.bodyStructureGuides(ref));
      const guide=guidesById.get(stop.selectedId).find(item=>item.id===tour.id);assert(guide,`${tour.id} / ${stop.selectedId}`);
      assert.equal(guide.step,authored.steps.findIndex(step=>step.selectedId===stop.selectedId)+1);
      assert.equal(guide.total,authored.steps.length);
      assert.deepEqual(Object.keys(guide).sort(),['href','id','label','regionLabel','step','total']);
      const url=new URL(guide.href,'https://example.invalid');
      assert.equal(url.pathname,'/atlas/3d');assert.equal(url.searchParams.get('region'),tour.regionId);
      assert.equal(url.searchParams.get('regionalTour'),tour.id);
      assert.equal(url.searchParams.get('regionalStep'),String(guide.step));
      assert.equal(url.searchParams.get('tourRevision'),tour.revision);
      assert.equal(url.searchParams.get('tourSource'),ref.atlasRevision);
      assert.equal(api.regionalTourEntrySuffix(Object.fromEntries(url.searchParams)),`&${url.searchParams.toString().replace(/^region=[^&]+&/,'')}`);
      for(const forbidden of ['autoplay','progress','score','source','structure','side'])assert.equal(url.searchParams.has(forbidden),false);
      if(tour.regionId==='whole-body'){wholeBody++;assert.equal(url.searchParams.get('region'),'whole-body');}
      checked++;
    }
  }
  assert(checked>0);assert(wholeBody>0);
});

test('stale and tampered refs, contextual IDs, names and laterality guesses give no guides',()=>{
  const contextual=api.regionalTours.flatMap(tour=>(Array.isArray(tour.contextIds)?tour.contextIds:[])
    .filter(id=>!tour.steps.some(step=>step.selectedId===id))
    .map(id=>({tour,ref:api.createLectureBodyReference(id)}))).find(item=>item.ref);
  assert(contextual,'a real registered context-only structure exists');
  assert.equal(api.bodyStructureGuides(contextual.ref).some(item=>item.id===contextual.tour.id),false);
  const otherSide=id=>id.includes(':left:')?id.replace(':left:',':right:').replaceAll('left-','right-')
    :id.includes(':right:')?id.replace(':right:',':left:').replaceAll('right-','left-'):'';
  const oneSided=api.regionalTours.flatMap(tour=>tour.steps.map(step=>({tour,id:step.selectedId})))
    .map(item=>({...item,oppositeRef:api.createLectureBodyReference(otherSide(item.id))}))
    .find(({tour,oppositeRef})=>oppositeRef&&!tour.steps.some(step=>step.selectedId===oppositeRef.structureId));
  assert(oneSided);
  assert.equal(api.bodyStructureGuides(oneSided.oppositeRef).some(item=>item.id===oneSided.tour.id),false);
  const selected=api.regionalTours.flatMap(item=>item.steps).map(step=>api.createLectureBodyReference(step.selectedId)).find(Boolean);assert(selected);
  for(const change of [{atlasRevision:'a'.repeat(40)},{sourceSha256:'a'.repeat(64)},{structureId:'Some matching name'},{side:selected.side==='left'?'right':'left'}])assert.deepEqual(api.bodyStructureGuides({...selected,...change}),[]);
  assert.deepEqual(api.bodyStructureGuides(null),[]);
  assert.deepEqual(api.bodyStructureGuides(selected.structureId),[]);
  assert.deepEqual(api.bodyStructureGuides({name:'quadriceps'}),[]);
});

test('unavailable or revision-mismatched catalogue refuses otherwise real refs',async()=>{
  const ref=api.regionalTours.flatMap(item=>item.steps).map(step=>api.createLectureBodyReference(step.selectedId)).find(Boolean);assert(ref);
  for(const mutation of ['unavailable','revision'])assert.deepEqual((await load(mutation)).bodyStructureGuides(ref),[]);
});


test('page keeps auth, invalid, failure, empty and pagination paths while showing exact guide labels',async()=>{
  const ts=requireWebsite('typescript');
  const jsx=requireWebsite('react/jsx-runtime');
  const render=requireWebsite('react-dom/server').renderToStaticMarkup;
  const page=readFileSync(source('app/learn/related-structure/page.tsx'),'utf8');
  const compiled=ts.transpileModule(page,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const ref=api.regionalTours.flatMap(item=>item.steps).map(step=>api.createLectureBodyReference(step.selectedId)).find(candidate=>candidate&&api.bodyStructureGuides(candidate).length);assert(ref);
  const guides=api.bodyStructureGuides(ref);
  const calls=[];
  let result={items:[],nextOffset:null},failure=false;
  const mocks={
    'react/jsx-runtime':jsx,
    'next/link':{default:({href,children,prefetch,...props})=>jsx.jsx('a',{href,...props,children})},
    '../../chatgpt-auth':{requireChatGPTUser:async href=>{calls.push(['auth',href]);return {userId:'synthetic',email:'learner@example.invalid',displayName:'Learner'};}},
    '@/lib/lecture-body-related-links':{BODY_RELATED_LECTURE_PAGE_SIZE:16,parseBodyRelatedLectureRequest:params=>params.invalid?null:{reference:ref,offset:Number(params.offset??0)},bodyRelatedLectureHref:(_ref,offset=0)=>`/learn/related-structure?test=1${offset?'&offset='+offset:''}`},
    '@/lib/lecture-body-reference':{resolveLectureBodyReference:api.resolveLectureBodyReference},
    '@/lib/body-structure-guides':{bodyStructureGuides:api.bodyStructureGuides},
    '@/lib/lecture-body-related-repository':{getRelatedPublishedBodyLectures:async()=>{calls.push(['repository']);if(failure)throw Error('offline');return result;}},
    '../related-anatomy/related-anatomy.css':{},
  };
  const mod={exports:{}};new Function('require','module','exports',compiled)(name=>mocks[name]??requireWebsite(name),mod,mod.exports);
  const pageHtml=async params=>render(await mod.exports.default({searchParams:Promise.resolve(params)}));
  const invalid=await pageHtml({invalid:'1'});assert.match(invalid,/Structure link unavailable/);assert.equal(calls.filter(item=>item[0]==='repository').length,0);
  const empty=await pageHtml({});assert.match(empty,/No accessible linked slides/);assert.match(empty,/Guided learning · Draft/);assert.match(empty,/Source &amp; access/);
  assert.match(empty,/<details class="structure-learning-guides">/);
  assert.doesNotMatch(empty,/<details class="structure-learning-guides"\s+open(?:\s|>)/);
  for(const guide of guides){assert(empty.includes(render(jsx.jsx('span',{children:guide.label})).slice(6,-7)));assert(empty.includes(render(jsx.jsx('span',{children:guide.regionLabel})).slice(6,-7)));assert(empty.includes(`href="${guide.href.replaceAll('&','&amp;')}"`));}
  result={items:[],nextOffset:16};const next=await pageHtml({});assert.match(next,/More allocated lectures/);
  result={items:[],nextOffset:null};const previous=await pageHtml({offset:'16'});assert.match(previous,/Previous group/);
  failure=true;const failed=await pageHtml({});assert.match(failed,/Related lectures could not be loaded/);assert.doesNotMatch(failed,/Published edition/);
  assert.equal(calls[0][0],'auth');assert(calls.filter(item=>item[0]==='auth').length>=5);
});

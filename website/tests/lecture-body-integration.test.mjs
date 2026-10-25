import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),website=process.env.VM_WEBSITE_ROOT??root;
const require=createRequire(resolve(website,'package.json')),esbuild=require('esbuild'),ts=require('typescript');
const source=p=>resolve(existsSync(resolve(root,p))?root:website,p);
const entry=['content:lecture-content','body:lecture-body-reference','head:lecture-anatomy-reference','collection:lecture-anatomy-collection','manifest:lecture-manifest','bodySearch:body-structure-search','links:lecture-body-related-links','kind:search-kind'].map(pair=>{const[name,file]=pair.split(':');return `export * as ${name} from ${JSON.stringify(source('lib/'+file+'.ts').replaceAll('\\','/'))};`;}).join('\n');
const built=await esbuild.build({stdin:{contents:entry,resolveDir:website},bundle:true,platform:'node',format:'cjs',write:false,alias:{'@':website},plugins:[{name:'candidate-source',setup(b){b.onResolve({filter:/^\.\.?\//},args=>{const target=resolve(args.resolveDir,args.path);if(target.startsWith(root)&&!existsSync(target)){const fallback=resolve(website,target.slice(root.length+1));if(existsSync(fallback))return {path:fallback};}if(args.path==='./lecture-content.ts')return {path:source('lib/lecture-content.ts')};return null;});}}]});
const mod={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(require,mod,mod.exports);const api=mod.exports;
const normalize=s=>s.replaceAll('\r\n','\n');
const before=p=>normalize(readFileSync(source('tests/fixtures/body-lecture-links/'+p.replaceAll('/','__')+'.raw'),'utf8'));
function compile(p,mocks){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(source(p),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(name=>mocks[name]??require(name),module,module.exports);return module.exports;}
test('entire publication repository is unchanged outside the three explicit body freshness extensions',()=>{
  let actual=normalize(readFileSync(source('lib/lecture-repository.ts'),'utf8'));
  const addition="import {lectureSlideBodyReferences,resolveLectureBodyReference} from './lecture-body-reference.ts';\n\nfunction hasStaleAnatomy(slide:LectureSlide){\n  return lectureSlideAnatomyReferences(slide).some(reference=>!resolveLectureAnatomyReference(reference))||\n    lectureSlideBodyReferences(slide).some(reference=>!resolveLectureBodyReference(reference));\n}\n";
  assert(actual.includes(addition));actual=actual.replace(addition,'');
  assert.equal(actual.match(/\.some\(hasStaleAnatomy\)/g)?.length,3);
  actual=actual.replaceAll('.some(hasStaleAnatomy)','.some(slide=>lectureSlideAnatomyReferences(slide).some(reference=>!resolveLectureAnatomyReference(reference)))');
  assert.equal(actual,before('lib/lecture-repository.ts'),'Every allocation, identity, revision, independent reviewer, atomic write and published read gate is preserved');
});
test('global body search preserves exact old selection hrefs and adds a separate current teaching action',()=>{
  let actual=normalize(readFileSync(source('lib/body-structure-search.ts'),'utf8'));
  actual=actual.replace("import {createLectureBodyReference} from './lecture-body-reference.ts';\n",'').replace("import {bodyRelatedLectureHref} from './lecture-body-related-links.ts';\n",'').replace('    const learningHref=bodyRelatedLectureHref(createLectureBodyReference(s.id));\n','').replace('href,meta:`3D Atlas · ${s.fmaId} · ${s.region}`,\n        ...(learningHref?{learningHref}:{})}','href,meta:`3D Atlas · ${s.fmaId} · ${s.region}`}');
  assert.equal(actual,before('lib/body-structure-search.ts'));
  for(const query of ['left Achilles','right Achilles','collarbone','supraspinatus'])for(const row of api.bodySearch.searchBodyStructures(query)){
    assert(row.href.startsWith('/atlas/3d?'));assert(row.learningHref?.startsWith('/learn/related-structure?'));
    const p=Object.fromEntries(new URL(row.learningHref,'https://local.invalid').searchParams);
    const ref=api.links.parseBodyRelatedLectureRequest(p);assert(ref);assert.equal(ref.reference.atlasTarget,row.href);
  }
});
test('body stale draft prevents submission, independent approval and publication before mutation',async()=>{
  const fresh=api.body.lectureBodyOptions('left Achilles')[0].reference;
  const row={id:'workbook:body-synthetic',title:'Saved lecture',version:2,status:'draft',course_id:'course-1',course_title:'Teaching',author_id:'author-1',organization_id:'org-1',slides_json:JSON.stringify([{id:'one',title:'Source teaching',body:'Education only.',referenceUrl:'',bodyAnatomyReferences:[{...fresh,sourceSha256:'a'.repeat(64)}]}]),review_hash:'b'.repeat(64)};
  let batches=0,accessCalls=0;
  const DB={prepare(sql){return{bind(){return{first:async()=>sql.includes('FROM workbooks w JOIN modules')?row:null,all:async()=>({results:[]})};}};},batch:async()=>{batches++;return[];}};
  const author={userId:'author-1',displayName:'Author'},reviewer={userId:'reviewer-1',displayName:'Reviewer'};
  const repo=compile('lib/lecture-repository.ts',{'cloudflare:workers':{env:{DB}},'@/db/bootstrap':{ensureEducationUser:async a=>({roles:a.userId==='learner-1'?['learner']:['instructor']}),appendAudit:async()=>{}},'@/db/platform':{getPlatformSnapshot:async()=>({organization:{id:'org-1'},entitlement:{studioAccess:true,atlasAccess:true}})},'@/lib/workbook-access':{canAccessPublishedWorkbook:async()=>{accessCalls++;return false;}},'@/lib/lecture-content':api.content,'@/lib/lecture-manifest':api.manifest,'./lecture-anatomy-reference.ts':api.head,'./lecture-anatomy-collection.ts':api.collection,'./lecture-body-reference.ts':api.body});
  for(const [status,action,actor]of [['draft','request-review',author],['in-review','review',reviewer],['approved','publish',author]]){
    row.status=status;await assert.rejects(()=>repo.mutateLecture(actor,row.id,{action,id:row.id,expectedVersion:2,...(action==='review'?{decision:'approved',comment:'Synthetic independent review'}:{})}),error=>error.status===422&&/an anatomy link has changed/i.test(error.message));
  }
  assert.equal(batches,0);row.status='approved';assert.equal((await repo.getLectureStudio(author,row.id)).canReopenAnatomy,true);
  await assert.rejects(()=>repo.getPublishedLecture({userId:'learner-1',displayName:'Learner'},row.id),error=>error.status===403);assert.equal(accessCalls,1,'Atlas entitlement never grants lecture access');
});
test('search secondary action is a sibling link, with no nested anchor or foreign destination',async()=>{
  const jsx=require('react/jsx-runtime'),{renderToStaticMarkup}=require('react-dom/server');
  const row=api.bodySearch.searchBodyStructures('left Achilles')[0];assert(row);
  for(const learningHref of [row.learningHref,'https://foreign.invalid','//foreign.invalid','/learn/related-structure-other?x=1']){
    const search=compile('app/search/page.tsx',{'react/jsx-runtime':jsx,'next/link':{default:({href,children,...props})=>jsx.jsx('a',{href,...props,children})},'@/lib/public-education-search':{searchPublicEducation:async()=>({results:[{...row,learningHref}],availability:'complete'})},'@/lib/search-kind':api.kind,'./search.css':{}});
    const tree=await search.default({searchParams:Promise.resolve({q:'left Achilles',kind:'anatomy'})});
    const html=renderToStaticMarkup(tree);let depth=0;
    for(const match of html.matchAll(/<\/?a(?=\s|>)[^>]*>/g)){
      depth+=match[0].startsWith('</')?-1:1;assert(depth>=0&&depth<=1,'No nested anchors');
    }
    assert.equal(depth,0);
    assert.equal(html.includes('class="search-related-link"'),learningHref===row.learningHref);
  }
});

// Copy to website tests/ after Review import; no new dependencies or auth fixtures.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

const websiteRoot=resolve(process.env.VM_WEBSITE_ROOT || fileURLToPath(new URL('../',import.meta.url)));
const requireFromWebsite=createRequire(pathToFileURL(join(websiteRoot,'package.json')));
const {transform}=requireFromWebsite('esbuild');
const compiled=async(path,loader)=>transform(await readFile(join(websiteRoot,path),'utf8'),{
  loader,format:'cjs',target:'es2022',jsx:'transform',jsxFactory:'h',jsxFragment:'Fragment',
});
const linksModule={exports:{}};
runInNewContext((await compiled('lib/clinical-review-links.ts','ts')).code,{
  module:linksModule,exports:linksModule.exports,URL,
});
const {reviewModelHref}=linksModule.exports;
assert.equal(typeof reviewModelHref,'function');

function text(node){
  if(typeof node==='string'||typeof node==='number')return String(node);
  if(!node)return '';
  if(Array.isArray(node))return node.map(text).join('');
  return text(node.props?.children);
}
function walk(node,predicate,matches=[]){
  if(Array.isArray(node)){node.forEach(child=>walk(child,predicate,matches));return matches;}
  if(!node||typeof node!=='object'||!node.props)return matches;
  if(predicate(node))matches.push(node);
  walk(node.props.children,predicate,matches);
  return matches;
}
function harness(){
  const state=[];let cursor=0;
  const h=(type,props,...children)=>({type,props:{...props,children}});
  const hooks={
    useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;
      return[state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},
    useMemo(fn){return fn();},useEffect(){},useRef(initial){return{current:initial};},
  };
  const context={h,Fragment:'Fragment',AbortController,URL,
    require(name){
      if(name==='react')return hooks;
      if(name==='next/link')return()=>null;
      if(name==='@/lib/clinical-review-links')return{reviewModelHref};
      if(name.includes('body-review-search'))return{bodyReviewQueue:rows=>rows};
      if(name.includes('body-types'))return{bodySystems:{}};
      if(name.includes('nested-review-queue'))return{
        nestedReviewQuery:value=>value,nestedReviewNavigationTrack:value=>value,
        nestedReviewQueue:()=>({entries:[],previous:null,next:null,index:-1}),
      };
      if(name.includes('nested-review')&&!name.includes('material')&&!name.includes('client'))
        return{nestedReviewTracks:['geometry','teaching','imaging']};
      return new Proxy({}, {get:(_target,key)=>String(key)});
    },
  };
  return{context,render(component,props){cursor=0;return component(props);}};
}
async function component(path,h){
  const module={exports:{}};
  runInNewContext((await compiled(path,'tsx')).code,{
    ...h.context,module,exports:module.exports,
  });
  return module.exports;
}
function modelAnchor(tree){
  const anchors=walk(tree,node=>node.type==='a'&&/separate tab/i.test(text(node)));
  assert.equal(anchors.length,1,'One labelled model-inspection anchor');
  return anchors[0];
}
function exactAnchor(anchor,source){
  assert.equal(anchor.props.href,reviewModelHref(source),'Website adapter must retain exact source query');
  assert.equal(anchor.props.target,'_blank');
  assert.deepEqual(new Set(String(anchor.props.rel).split(/\s+/)),new Set(['noopener','noreferrer']));
  assert.match(text(anchor),/separate tab/i);
}

test('imported body Review renders source-bound model inspection in a separate tab',async()=>{
  const h=harness();
  const {BodyReviewDetails}=await component('atlas-review/app/review/body/review-dashboard.tsx',h);
  const material={atlasLink:'/regions/abdomen?study=exact-study&structure=exact%3Achild&source=source-hash&side=both',
    source:{structure:{id:'exact:child',name:'Child',fmaId:'FMA:1',laterality:'left',sources:[],sourceTree:'source'},
      bundle:{sha256:'fixture-hash'},credit:'fixture',licence:'fixture',sourceVersion:'fixture'},
    materialHash:'fixture-material',limits:[],topics:[],guidedTours:[],reasoning:null,checklist:{}};
  exactAnchor(modelAnchor(h.render(BodyReviewDetails,{material})),material.atlasLink);
  assert.equal(walk(h.render(BodyReviewDetails,{material:{...material,atlasLink:null}}),
    node=>node.type==='a'&&/separate tab/i.test(text(node))).length,0);
});

test('imported nested Review retains exact child link and unavailable fallback',async()=>{
  const h=harness();
  const {NestedReviewWorkspace}=await component('atlas-review/app/review/nested/workspace.tsx',h);
  const packet={atlasLink:'/regions/head-neck?study=ventricles&structure=exact%3Achild&part=part-1&partSource=source-hash',
    context:{nestedKey:'study',structureId:'exact:child',structureName:'Child',sourceFrame:'fixture-frame',materialHash:'fixture-hash',teachingTabs:[]},
    source:{parent:{name:'Parent'},studyTitle:'Study',limitations:'fixture',credit:'fixture',
      structure:{name:'Child',laterality:'left'},orientationContext:null},
    teaching:{topics:[],orientationContext:null,guidedLearning:null,csfMotion:null,lesson:null,referenceTitles:{}}};
  const props={rows:[{key:'study',name:'Study'}],packet,invalid:false};
  exactAnchor(modelAnchor(h.render(NestedReviewWorkspace,props)),packet.atlasLink);
  const unavailable=h.render(NestedReviewWorkspace,{...props,packet:{...packet,atlasLink:null}});
  assert.equal(walk(unavailable,node=>node.type==='a'&&/separate tab/i.test(text(node))).length,0);
  assert.match(text(unavailable),/The exact source link is unavailable\./);
});

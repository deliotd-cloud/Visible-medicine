import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {restoreStudioRouteDisclosure,studioRouteComponentSha256,studioRouteParentSha256,restoreAtlasRegionGuardDisclosure,atlasRegionGuardSha256} from './studio-route-disclosure-source.mjs';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript'),sha=b=>createHash('sha256').update(b).digest('hex'),stage='F:/VisibleMedicine/staging/20261024-studio-route-disclosure';
const sourcePath=process.env.STUDIO_ROUTE_SOURCE||new URL('../components/StudioNavigation.tsx',import.meta.url),source=readFileSync(sourcePath,'utf8');let activeHost;
const NativeDisclosure=props=>React.createElement('details',props),Link=props=>React.createElement('a',props);
const hooks={...React,useRef(initial){const h=activeHost,i=h.refCursor++;return h.refs[i]??(h.refs[i]={current:initial});},useLayoutEffect(effect,deps){const h=activeHost;h.effects.push({effect,deps});}};
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
new Function('require','module','exports',code)(id=>id==='react'?hooks:id==='next/navigation'?{usePathname:()=>activeHost.pathname}:id==='next/link'?{__esModule:true,default:Link}:id==='./NativeDisclosure'?{NativeDisclosure}:require(id),module,module.exports);
const Navigation=module.exports.StudioNavigation;
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!React.isValidElement(n)?[]:[n,...nodes(n.props.children)];
function host(){
 const h={refs:[],refCursor:0,effects:[],installed:[],pathname:'/studio/cohorts'},details={open:false},nav={querySelector:selector=>{assert.equal(selector,':scope > .studio-manage-navigation');return h.hasDetails?details:null;}};let previousOpen;
 function draw(pathname,roles=['administrator']){h.pathname=pathname;h.refCursor=0;h.effects=[];activeHost=h;try{const tree=Navigation({educationRoles:roles});return{tree,effects:[...h.effects]};}finally{activeHost=undefined;}}
 function commit(view){const disclosure=nodes(view.tree).find(n=>n.type===NativeDisclosure);h.hasDetails=!!disclosure;if(disclosure&&disclosure.props.open!==previousOpen)details.open=disclosure.props.open;previousOpen=disclosure?.props.open;if(view.tree.props.ref)view.tree.props.ref.current=nav;
  view.effects.forEach((next,i)=>{const old=h.installed[i];if(old&&old.deps.length===next.deps.length&&old.deps.every((v,j)=>Object.is(v,next.deps[j])))return;old?.cleanup?.();h.installed[i]={...next,cleanup:next.effect()};});}
 return{draw,commit,details,nav};
}
test('actual committed sibling-route change reopens the existing navigation without a keyed remount',()=>{
 const h=host();let view=h.draw('/studio/cohorts');h.commit(view);assert.equal(h.details.open,true);h.details.open=false;
 view=h.draw('/studio/analytics');h.commit(view);assert.equal(h.details.open,true);assert.equal(nodes(view.tree).find(n=>n.type===NativeDisclosure).key,null);assert.equal(view.tree.props.ref.current,h.nav);
 h.details.open=false;view=h.draw('/studio/cohorts');h.commit(view);assert.equal(h.details.open,true);assert.equal(view.tree.props.ref.current,h.nav);
});
test('manual closure survives same-route renders and a discarded route render cannot open it',()=>{
 const h=host();h.commit(h.draw('/studio/cohorts'));h.details.open=false;h.commit(h.draw('/studio/cohorts'));assert.equal(h.details.open,false);
 h.draw('/studio/analytics');assert.equal(h.details.open,false);h.commit(h.draw('/studio/cohorts'));assert.equal(h.details.open,false);
 h.commit(h.draw('/studio/analytics'));assert.equal(h.details.open,true);h.commit(h.draw('/studio/courses'));assert.equal(h.details.open,false);
});
test('current roles and all four primary destinations remain exact without empty administration',()=>{
 for(const[roles,secondary]of [[[],[]],[['educator'],[]],[['examiner'],['/studio/analytics']],[['instructor'],['/studio/cohorts','/studio/analytics']],[['administrator'],['/studio/cohorts','/studio/analytics','/workspace']]]){
  const h=host(),view=h.draw('/studio/courses',roles);h.commit(view);assert.deepEqual(nodes(view.tree).filter(n=>n.type===Link).map(n=>n.props.href),['/studio/workspace','/studio/courses','/studio/workbooks','/studio/publishing',...secondary]);assert.equal(h.details.open,false);
 }
});
test('three complete source seams recover all prior routes, roles, labels and guards; foreign edits fail',()=>{
 assert.equal(sha(Buffer.from(source)),studioRouteComponentSha256);const old=readFileSync(stage+'/before/StudioNavigation.tsx');assert.equal(sha(old),studioRouteParentSha256);assert.deepEqual(restoreStudioRouteDisclosure(Buffer.from(source)),old);
 for(const alter of [s=>s+'\n// foreign',s=>s.replace('educationRoles.includes("administrator")','true'),s=>s.replace('Review & publish','Hidden')])assert.throws(()=>restoreStudioRouteDisclosure(Buffer.from(alter(source))));
});
test('original native-disclosure helper and historical consumer assertions reconstruct byte for byte',()=>{
 const read=p=>readFileSync(new URL('./'+p,import.meta.url),'utf8');let helper=read('native-disclosure-source.mjs');for(const added of ["import {restoreStudioRouteDisclosure,studioRouteComponentSha256,restoreAtlasRegionGuardDisclosure,atlasRegionGuardSha256} from './studio-route-disclosure-source.mjs';\n"," if(path==='components/StudioNavigation.tsx'&&sha(bytes)===studioRouteComponentSha256)bytes=restoreStudioRouteDisclosure(bytes);\n"," if(path==='components/AtlasWorkspaceNavigation.tsx'&&sha(bytes)===atlasRegionGuardSha256)bytes=restoreAtlasRegionGuardDisclosure(bytes);\n"]){assert.equal(helper.split(added).length,2);helper=helper.replace(added,'');}assert.equal(helper,readFileSync(stage+'/before/native-disclosure-source.mjs','utf8'));
 let original=read('native-disclosure.test.mjs');const added="import {restoreStudioRouteDisclosure,studioRouteComponentSha256,restoreAtlasRegionGuardDisclosure,atlasRegionGuardSha256} from './studio-route-disclosure-source.mjs';\n";assert.equal(original.split(added).length,2);original=original.replace(added,'');const before="  const bytes=readFileSync(new URL('../'+r.path,import.meta.url));",after="  let bytes=readFileSync(new URL('../'+r.path,import.meta.url));if(r.path==='components/StudioNavigation.tsx'&&sha(bytes)===studioRouteComponentSha256)bytes=restoreStudioRouteDisclosure(bytes);if(r.path==='components/AtlasWorkspaceNavigation.tsx'&&sha(bytes)===atlasRegionGuardSha256)bytes=restoreAtlasRegionGuardDisclosure(bytes);";assert.equal(original.split(after).length,2);original=original.replace(after,before);assert.equal(original,readFileSync(stage+'/before/native-disclosure.test.mjs','utf8'));
});
test('the already-existing region navigation guard reconstructs its genuine older disclosure source without editing product code',()=>{
 const raw=readFileSync(new URL('../components/AtlasWorkspaceNavigation.tsx',import.meta.url));assert.equal(sha(raw),atlasRegionGuardSha256);const old=restoreAtlasRegionGuardDisclosure(raw);assert.equal(sha(old),'bdb3b0801d047c0061ea5cd4db6080c4c2fa5e6c4777f32469844711c7458aec');assert.throws(()=>restoreAtlasRegionGuardDisclosure(Buffer.from(raw.toString().replace('onBeforeNavigate={onBeforeRegionNavigate}','onBeforeNavigate={undefined}'))));
});

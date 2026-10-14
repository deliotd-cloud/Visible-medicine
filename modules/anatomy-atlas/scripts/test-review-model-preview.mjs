import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react');
let visible=true;
const built=await build({stdin:{contents:"export {ReviewModelPreview} from './app/review/review-model-preview';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require:name=>name==='react'?{...React,useState:()=>[visible,value=>{visible=typeof value==='function'?value(visible):value;}]}:require(name)});
const walk=(node,p,out=[])=>{if(React.isValidElement(node)){if(p(node))out.push(node);React.Children.forEach(node.props.children,child=>walk(child,p,out));}return out;};
test('actual inspector mounts exact link/revision; hide unmounts the GPU frame without worksheet actions',()=>{
 visible=true;const props={href:'/regions/leg?structure=source-id&source=exact',name:'Selected anatomy',revision:'exact-revision'};
 const render=()=>scope.exports.ReviewModelPreview(props);
 let frame=walk(render(),n=>n.type==='iframe')[0];assert.equal(frame.props.src,props.href);assert.equal(frame.key,props.revision+':'+props.href);assert.equal(frame.props.allowFullScreen,true);assert.equal(frame.props.loading,'lazy');
 const toggle=()=>walk(render(),n=>n.type==='button')[0];assert.equal(toggle().props['aria-expanded'],true);toggle().props.onClick();assert.equal(walk(render(),n=>n.type==='iframe').length,0);assert.equal(toggle().props['aria-expanded'],false);toggle().props.onClick();assert.equal(walk(render(),n=>n.type==='iframe').length,1);
 const larger=walk(render(),n=>n.type==='a')[0];assert.equal(larger.props.href,props.href);assert.equal(larger.props.target,'_blank');assert.equal(larger.props.rel,'noopener noreferrer');
});
test('unavailable and nonlocal references never mount a frame or fallback anatomy',()=>{
 for(const href of [null,'https://example.invalid/model','//example.invalid/model','/\\example.invalid/model','/\n/evil','relative']){
  const tree=scope.exports.ReviewModelPreview({href,name:'Unavailable anatomy',revision:'exact'});
  assert.equal(walk(tree,n=>n.type==='iframe'||n.type==='a'||n.type==='button').length,0);
 }
});

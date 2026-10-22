import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const jsx=require('react/jsx-runtime');
const compile=text=>ts.transpileModule(text,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const hooks={useState:value=>[typeof value==='function'?value():value,()=>{}],useRef:value=>({current:value}),useEffect(){},useLayoutEffect(){},useMemo:fn=>fn()};
const module={exports:{}};
new Function('require','module','exports',compile(source))((name)=>{
 if(name==='react')return hooks;
 if(name==='react/jsx-runtime')return jsx;
 if(name==='../lib/head-slice-viewport')return {headSliceViewport:()=>({width:320,height:300,left:0,top:0,zoom:1})};
 if(name==='../lib/head-atlas-display')return {headLabel:()=>''};
 return {};
},module,module.exports);
const NativeSlice=module.exports.NativeSlice;assert.equal(typeof NativeSlice,'function');
function nodes(value){
 if(Array.isArray(value))return value.flatMap(nodes);
 if(!value||typeof value!=='object'||!value.props)return [];
 return [value,...nodes(value.props.children)];
}
function slice(plane,expanded,onExpand){
 const view={fixedAxisIJK:2,width:1,height:1,sliceCount:1,pixelSpacing:[1,1]};
 return NativeSlice({plane,study:{geometry:{views:{[plane]:view},shapeKJI:[1,1,1]},data:new Int16Array(1)},selected:null,layers:[],groupLabels:false,opacity:1,layerOpacity:{},cursor:[0,0,0],windowing:[40,80],overlay:false,regionalCourse:false,showCrosshair:false,
  onCursor:()=>assert.fail('Expansion must not select or navigate anatomy'),onExpand,expanded});
}
for(const plane of ['axial','coronal','sagittal'])for(const expanded of [false,true])test(`${plane} ${expanded?'restore':'enlarge'} names its pane and retains its action`,()=>{
 let calls=0;const onExpand=()=>{calls++;};
 const buttons=nodes(slice(plane,expanded,onExpand)).filter(node=>node.type==='button'&&node.props.onClick===onExpand);
 assert.equal(buttons.length,1);const button=buttons[0],action=expanded?'Restore':'Enlarge';
 assert.equal(button.props.children,action,'Compact visible label is unchanged');
 assert.equal(button.props['aria-label'],`${action} ${plane} image`);
 assert.equal(button.props['aria-pressed'],expanded);assert.equal(button.props.type,'button');
 button.props.onClick();assert.equal(calls,1,'The original callback fires exactly once');
});
test('a read-only pane without an expansion callback has no expansion action',()=>{
 assert.equal(nodes(slice('axial',false,undefined)).filter(node=>node.type==='button'&&['Restore','Enlarge'].includes(node.props.children)).length,0);
});

// Execute the exact surface header button JSX, without requiring a scan or renderer.
const heading='<h2>Selected anatomy · 3D scan view</h2>',start=source.indexOf(heading);assert(start>0&&source.lastIndexOf(heading)===start);
const buttonStart=source.indexOf('<button ',start+heading.length),buttonEnd=source.indexOf('</button>',buttonStart);assert(buttonStart>start&&buttonEnd>buttonStart);
const surface={exports:{}};
new Function('require','module','exports',compile(`export function Expansion({expanded,setExpanded}){return ${source.slice(buttonStart,buttonEnd+'</button>'.length)};}`))(
 name=>{assert.equal(name,'react/jsx-runtime');return jsx;},surface,surface.exports);
for(const expanded of [null,'3d'])test(`selected surface ${expanded?'restore':'enlarge'} has a distinct accessible name`,()=>{
 const changes=[],button=surface.exports.Expansion({expanded,setExpanded:value=>changes.push(value)}),action=expanded?'Restore':'Enlarge';
 assert.equal(button.props.children,action);assert.equal(button.props['aria-label'],`${action} selected anatomy 3D scan view`);
 assert.equal(button.props['aria-pressed'],expanded==='3d');assert.equal(button.props.type,'button');
 button.props.onClick();assert.deepEqual(changes,[expanded?null:'3d']);
});
